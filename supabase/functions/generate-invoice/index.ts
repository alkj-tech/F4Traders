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
    const { orderId } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch order details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError) throw orderError;

    // Fetch settings
    const { data: settings } = await supabase.from("settings").select("*");
    const settingsMap = settings?.reduce((acc: any, s: any) => {
      acc[s.key] = s.value;
      return acc;
    }, {});

    const items = Array.isArray(order.items) ? order.items : [];

    // Generate invoice HTML
    const invoiceHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; }
    .header { text-align: center; margin-bottom: 30px; }
    .invoice-details { margin: 20px 0; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    th { background-color: #f4f4f4; }
    .totals { margin-top: 20px; text-align: right; }
    .totals div { margin: 8px 0; }
    .grand-total { font-size: 18px; font-weight: bold; margin-top: 10px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${settingsMap?.site_name || "7kicks Clone"}</h1>
    <h2>INVOICE</h2>
    <p>Invoice No: INV-${order.order_no}</p>
    <p>Date: ${new Date(order.created_at).toLocaleDateString()}</p>
  </div>

  <div class="invoice-details">
    <h3>Shipping Address:</h3>
    <p>${order.shipping_address?.name || ""}</p>
    <p>${order.shipping_address?.street || ""}</p>
    <p>${order.shipping_address?.city || ""}, ${order.shipping_address?.state || ""} - ${order.shipping_address?.pincode || ""}</p>
    <p>Phone: ${order.shipping_address?.phone || ""}</p>
  </div>

  <table>
    <thead>
      <tr>
        <th>Product</th>
        <th>Quantity</th>
        <th>Price</th>
        <th>Discount</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      ${items.map((item: any) => `
        <tr>
          <td>${item.product_name || ""}</td>
          <td>${item.quantity || 0}</td>
          <td>₹${item.unit_price || 0}</td>
          <td>${item.discount_percentage || 0}%</td>
          <td>₹${item.total_price || 0}</td>
        </tr>
      `).join("")}
    </tbody>
  </table>

  <div class="totals">
    <div>Subtotal: ₹${order.subtotal || 0}</div>
    <div>Discount: -₹${order.discount_total || 0}</div>
    <div>GST (${settingsMap?.gst_percentage || 9}%): ₹${order.gst_total || 0}</div>
    <div>CGST (${settingsMap?.cgst_percentage || 9}%): ₹${order.cgst_total || 0}</div>
    <div>Delivery: Free (included in price)</div>
    <div class="grand-total">Grand Total: ₹${order.total_amount || 0}</div>
  </div>

  <div style="margin-top: 40px; text-align: center; color: #666;">
    <p>Thank you for your purchase!</p>
    <p>For support: ${settingsMap?.support_email || "support@example.com"}</p>
  </div>
</body>
</html>
    `;

    // Store invoice in database
    const invoiceNo = `INV-${order.order_no}`;
    const { error: invoiceError } = await supabase
      .from("invoices")
      .insert({
        order_id: orderId,
        invoice_no: invoiceNo,
      });

    if (invoiceError) console.error("Error storing invoice:", invoiceError);

    // Send email
    await supabase.functions.invoke("send-order-email", {
      body: {
        orderId,
        invoiceHtml,
        type: order.payment_status === "completed" ? "confirmed" : "cancelled",
      },
    });

    console.log("Invoice generated for order:", orderId);

    return new Response(
      JSON.stringify({ success: true, invoiceHtml }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error generating invoice:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
