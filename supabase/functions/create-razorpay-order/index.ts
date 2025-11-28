import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { amount, currency = "INR", receipt } = await req.json();

    console.log("📌 Received amount (Rupees):", amount);

    if (!amount || amount <= 0) {
      throw new Error("Invalid amount");
    }

    // 1. Get Keys from Supabase Secrets
    const keyId = Deno.env.get("RAZORPAY_KEY_ID");
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (!keyId || !keySecret) {
      console.error("❌ Secrets missing: Check RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET");
      throw new Error("Razorpay environment keys missing");
    }

    // 2. Prepare Amount (Convert to Paise and ensure Integer)
    const amountInPaise = Math.round(amount * 100);
    console.log("💰 Converting to Paise:", amountInPaise);

    // 3. Create Authorization Header
    const auth = btoa(`${keyId}:${keySecret}`);

    // 4. Call Razorpay API
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency,
        receipt,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Razorpay API Error:", data);
      throw new Error(data.error?.description || "Failed creating order");
    }

    // 5. Return Data AND the Key ID to the client
    // This ensures the client uses the exact same key that created the order
    return new Response(JSON.stringify({ ...data, key_id: keyId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("🔥 Function ERROR:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});