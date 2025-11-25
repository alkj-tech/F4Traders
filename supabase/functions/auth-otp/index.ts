import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // 1. Handle CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 2. Load Environment Variables
    const fast2smsKey = Deno.env.get("FAST2SMS_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!fast2smsKey) {
      throw new Error("Missing FAST2SMS_API_KEY in Supabase Secrets");
    }

    // 3. Initialize Supabase Admin Client
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);
    
    // 4. Parse Request
    const { action, phone, otp } = await req.json();
    
    // Clean input: remove spaces/dashes
    const cleanPhone = phone.replace(/\s+/g, "");

    // Validate Format (Accepts +91 or just 10 digits, ensures it's valid for India)
    const phoneRegex = /^\+?91?[6-9]\d{9}$/;
    if (!phoneRegex.test(cleanPhone)) {
      return new Response(JSON.stringify({ error: "Invalid Indian phone number" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ---------------------------------------------------------
    // ACTION: SEND OTP
    // ---------------------------------------------------------
    if (action === "send") {
      
      // === A. RATE LIMITING (Prevent Spam) ===
      // Check if an OTP was sent to this number in the last 60 seconds
      const { data: lastOtp } = await supabase
        .from("otp_store")
        .select("created_at")
        .eq("phone", cleanPhone)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (lastOtp) {
        const lastTime = new Date(lastOtp.created_at).getTime();
        const now = Date.now();
        const cooldownMs = 60 * 1000; // 60 seconds

        if (now - lastTime < cooldownMs) {
          const waitSeconds = Math.ceil((cooldownMs - (now - lastTime)) / 1000);
          return new Response(JSON.stringify({ 
            error: `Please wait ${waitSeconds}s before requesting again.` 
          }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
      }

      // === B. SEND VIA FAST2SMS ===
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Extract last 10 digits (Fast2SMS Dev API works best with 10 digits)
      const tenDigitPhone = cleanPhone.slice(-10);

      console.log(`Sending OTP ${generatedOtp} to ${tenDigitPhone} via Fast2SMS...`);

      const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
        method: "POST",
        headers: {
          "authorization": fast2smsKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "route": "otp", // Uses default Quick OTP route
          "variables_values": generatedOtp,
          "numbers": tenDigitPhone,
        }),
      });

      const result = await response.json();
      
      // Fast2SMS returns { return: true, ... } on success
      if (!result.return) {
        console.error("Fast2SMS Error:", result);
        throw new Error(`SMS Failed: ${result.message || "Unknown error"}`);
      }

      // === C. STORE OTP IN DB ===
      const { error: dbError } = await supabase.from("otp_store").insert({
        phone: cleanPhone, // Store full format for consistency
        otp_code: generatedOtp,
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 mins expiry
      });

      if (dbError) throw dbError;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---------------------------------------------------------
    // ACTION: VERIFY OTP
    // ---------------------------------------------------------
    if (action === "verify") {
      // 1. Check DB for valid OTP
      const { data: record } = await supabase
        .from("otp_store")
        .select("*")
        .eq("phone", cleanPhone)
        .gt("expires_at", new Date().toISOString()) // Must not be expired
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!record || record.otp_code !== otp) {
        throw new Error("Invalid or expired OTP");
      }

      // 2. Delete used OTP (Security: Prevent replay attacks)
      await supabase.from("otp_store").delete().eq("id", record.id);

      // 3. Check if User Exists
      const { data: { users } } = await supabase.auth.admin.listUsers();
      let user = users.find((u) => u.phone === cleanPhone);
      
      // 4. Create User if New
      if (!user) {
        // We use a dummy email based on phone because Supabase Auth needs a unique identifier
        // The phone is the main identifier here.
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          phone: cleanPhone,
          email: `${cleanPhone}@fast2sms.app`, 
          email_confirm: true,
          phone_confirm: true,
        });
        if (createError) throw createError;
        user = newUser.user;
      }

      // 5. Generate Session (Magic Link Strategy)
      // This creates a valid session token for the client
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: "magiclink",
        email: user.email!,
      });

      if (linkError) throw linkError;

      // Return the session tokens to the React frontend
      return new Response(JSON.stringify({ 
        success: true, 
        session: linkData.properties 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Invalid Action");

  } catch (error: any) {
    console.error("Edge Function Error:", error);
    // Return 400 with error message so frontend can display it
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});