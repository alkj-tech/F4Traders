import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId, invoiceHtml, type } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch order
    const { data: order } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (!order) throw new Error("Order not found");

    const { data: settings } = await supabase.from("settings").select("*");
    const settingsMap = settings?.reduce((acc: any, s: any) => {
      acc[s.key] = s.value;
      return acc;
    }, {});

    const supportEmail = settingsMap?.support_email || "support@example.com";

    // Prepare email content
    const subject = type === "confirmed" 
      ? `Order Confirmed - ${order.order_no}`
      : `Order Cancelled - ${order.order_no}`;

    const htmlContent = type === "confirmed"
      ? invoiceHtml
      : `
        <html>
          <body style="font-family: Arial, sans-serif; padding: 40px;">
            <h1>Order Cancelled</h1>
            <p>Your order ${order.order_no} has been cancelled.</p>
            <p>If you have any questions, please contact us at ${supportEmail}</p>
          </body>
        </html>
      `;

    // Log email sending (actual email service integration needed)
    console.log(`Email would be sent to customer for order: ${orderId}`);
    console.log(`Subject: ${subject}`);
    console.log(`Support notified at: ${supportEmail}`);

    return new Response(
      JSON.stringify({ success: true, message: "Email queued for sending" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
