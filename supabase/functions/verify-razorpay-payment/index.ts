import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
    } = body;

    console.log("INPUT PAYLOAD:", body);

    const secret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!secret) throw new Error("Secret missing");

    const text = `${razorpay_order_id}|${razorpay_payment_id}`;

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signatureBytes = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(text)
    );

    const expected = Array.from(new Uint8Array(signatureBytes))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    console.log("EXPECTED SIG:", expected);
    console.log("RECEIVED SIG:", razorpay_signature);

    if (expected !== razorpay_signature) {
      throw new Error("Invalid payment signature");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error } = await supabase
      .from("orders")
      .update({
        payment_status: "completed",
        order_status: "confirmed",
        razorpay_order_id,
        razorpay_payment_id,
      })
      .eq("id", orderId);

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("FUNCTION ERROR:", err);
    return new Response(
      JSON.stringify({ error: `${err.message}` }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});