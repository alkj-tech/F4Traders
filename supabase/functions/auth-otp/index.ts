import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // 1. Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const msgBotKey = Deno.env.get("MESSAGEBOT_API_KEY");
    const msgBotSender = Deno.env.get("MESSAGEBOT_SENDER_ID");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!msgBotKey || !msgBotSender) throw new Error("Missing API Keys");

    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);
    const { action, phone, otp } = await req.json();
    const cleanPhone = phone.replace(/\s+/g, "");

    // 2. Validate Indian Phone Format
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
      
      // === RATE LIMITING START ===
      // Check the last time an OTP was sent to this number
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
        const timeDiff = now - lastTime;
        const cooldownMs = 60 * 1000; // 60 seconds

        if (timeDiff < cooldownMs) {
          const waitSeconds = Math.ceil((cooldownMs - timeDiff) / 1000);
          return new Response(JSON.stringify({ 
            error: `Please wait ${waitSeconds}s before requesting again.` 
          }), {
            status: 429, // Too Many Requests
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
      }
      // === RATE LIMITING END ===

      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

      // Send SMS
      const response = await fetch("https://portal.messagebot.xyz/api/v2/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: msgBotKey,
          sender: msgBotSender,
          to: cleanPhone,
          message: `Your verification code is ${generatedOtp}. Valid for 5 mins.`,
        }),
      });

      const result = await response.json();
      if (!response.ok || (result.status && result.status !== "success")) {
        console.error("MessageBot Error:", result);
        throw new Error("Failed to send SMS provider");
      }

      // Store in DB
      const { error: dbError } = await supabase.from("otp_store").insert({
        phone: cleanPhone,
        otp_code: generatedOtp,
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
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
      const { data: record } = await supabase
        .from("otp_store")
        .select("*")
        .eq("phone", cleanPhone)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!record || record.otp_code !== otp) {
        throw new Error("Invalid or expired OTP");
      }

      // Delete used OTP
      await supabase.from("otp_store").delete().eq("id", record.id);

      // Find or Create User
      const { data: { users } } = await supabase.auth.admin.listUsers();
      let user = users.find((u) => u.phone === cleanPhone);
      
      if (!user) {
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          phone: cleanPhone,
          email: `${cleanPhone}@placeholder.app`,
          email_confirm: true,
          phone_confirm: true,
        });
        if (createError) throw createError;
        user = newUser.user;
      }

      // Generate Session
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: "magiclink",
        email: user.email!,
      });

      if (linkError) throw linkError;

      return new Response(JSON.stringify({ 
        success: true, 
        session: linkData.properties 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Invalid Action");

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});