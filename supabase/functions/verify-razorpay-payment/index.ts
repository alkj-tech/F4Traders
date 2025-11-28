import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { createHmac } from "node:crypto";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature, 
      order_data, 
      items,      
      user_id 
    } = await req.json();

    console.log("📌 Verifying:", razorpay_order_id);

    // 1. VERIFY SIGNATURE
    const secret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!secret) throw new Error("Razorpay Secret missing");

    const generated_signature = createHmac("sha256", secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      throw new Error("Invalid signature");
    }

    // 2. PREPARE DB PAYLOAD (Safely convert types)
    // Your DB seems to store numbers as strings (based on your previous logs)
    const payload = {
        order_no: order_data.order_no,
        user_id: user_id,
        items: items, 
        shipping_address: order_data.shipping_address,
        
        // Convert numbers to strings to prevent type errors
        subtotal: String(order_data.subtotal), 
        discount_total: String(order_data.discount_total || 0),
        gst_total: String(order_data.gst_total),
        cgst_total: String(order_data.cgst_total),
        delivery_fee: String(order_data.delivery_fee),
        total_amount: String(order_data.total_amount),
        
        razorpay_order_id: razorpay_order_id,
        razorpay_payment_id: razorpay_payment_id,
        payment_status: "completed",
        order_status: "confirmed"
    };

    // 3. INSERT INTO DB
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: order, error: insertError } = await supabaseClient
      .from("orders")
      .insert(payload)
      .select()
      .single();

    if (insertError) {
      console.error("🔥 DB INSERT ERROR:", insertError);
      // This will now show the REAL error in your frontend toast
      throw new Error(`DB Error: ${insertError.message}`); 
    }

    // 4. REDUCE STOCK
    for (const item of items) {
       if (item.product_id) {
         const { data: product } = await supabaseClient
           .from("products")
           .select("stock")
           .eq("id", item.product_id)
           .single();
         
         if (product) {
           await supabaseClient
             .from("products")
             .update({ stock: product.stock - item.quantity })
             .eq("id", item.product_id);
         }
       }
    }

    return new Response(JSON.stringify({ success: true, orderId: order.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("Function Error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});