import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Navigate, useNavigate } from "react-router-dom";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface AddressRow {
  id: number;
  user_id: string;
  full_name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  is_default?: boolean;
  created_at?: string;
}

export default function Checkout() {
  const { items, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState({
    fullName: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    pincode: "",
  });

  const [addressConfirmed, setAddressConfirmed] = useState(false);

  useEffect(() => {
    const fetchAddress = async () => {
      try {
        if (!user) return;

        let { data, error } = await supabase
          .from("user_addresses")
          .select(
            "id,user_id,full_name,phone,street,city,state,pincode,is_default,created_at"
          )
          .eq("user_id", user.id)
          .eq("is_default", true)
          .single();

        // If no default found (PostgREST returns PGRST116), fetch latest address
        if (error && (error as any).code === "PGRST116") {
          const { data: fallback, error: fallbackError } = await supabase
            .from("user_addresses")
            .select(
              "id,user_id,full_name,phone,street,city,state,pincode,created_at"
            )
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          if (fallback && !fallbackError) data = fallback as any;
        }

        if (data) {
          setAddress({
            fullName: data.full_name || "",
            phone: data.phone || "",
            street: data.street || "",
            city: data.city || "",
            state: data.state || "",
            pincode: data.pincode || "",
          });
        }
      } catch (err) {
        console.error("Failed to fetch address", err);
      }
    };

    fetchAddress();
  }, [user]);

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (items.length === 0) {
    return <Navigate to="/cart" replace />;
  }

  const calculateTotals = () => {
    let subtotal = 0;
    let discountTotal = 0;
    let gstTotal = 0;
    let cgstTotal = 0;

    items.forEach((item) => {
      const product = item.product;
      if (!product) return;

      const itemSubtotal = product.price_inr * item.quantity;
      const itemDiscount = itemSubtotal * (product.discount_percent / 100);
      const discountedPrice = itemSubtotal - itemDiscount;

      subtotal += itemSubtotal;
      discountTotal += itemDiscount;
      gstTotal += discountedPrice * (product.gst_percent / 100);
      cgstTotal += discountedPrice * (product.cgst_percent / 100);
    });

    const total = subtotal - discountTotal + gstTotal + cgstTotal;

    return { subtotal, discountTotal, gstTotal, cgstTotal, total };
  };

  const totals = calculateTotals();

  const createOrder = async (shippingAddress: any) => {
    const orderItems = items.map((item) => ({
      product_id: item.product.id,
      product_name: item.product.title,
      quantity: item.quantity,
      price: item.product.price_inr,
      discount_percent: item.product.discount_percent,
      gst_percent: item.product.gst_percent,
      cgst_percent: item.product.cgst_percent,
      size: item.size,
      color: item.color,
      total_price:
        item.product.price_inr *
        item.quantity *
        (1 - item.product.discount_percent / 100),
    }));

    const orderNo = `ORD-${Date.now()}`;

    const { data: order, error } = await supabase
      .from("orders")
      .insert([
        {
          order_no: orderNo,
          user_id: user!.id,
          items: orderItems as any,
          subtotal: totals.subtotal,
          discount_total: totals.discountTotal,
          gst_total: totals.gstTotal,
          cgst_total: totals.cgstTotal,
          total_amount: totals.total,
          shipping_address: shippingAddress as any,
          payment_status: "pending",
          order_status: "pending",
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return order;
  };

  // Load Razorpay SDK dynamically
  const loadRazorpayScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if ((window as any).Razorpay) return resolve();
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Razorpay SDK failed to load"));
      document.body.appendChild(script);
    });
  };

  const handleRazorpayPayment = async (order: any) => {
    try {
      // Ensure publishable key is available at runtime
      const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID;
      if (!keyId) {
        // clearer message and checks for the correct env var name
        throw new Error(
          "Razorpay Key ID (VITE_RAZORPAY_KEY_ID) missing in client env. Please add it to your .env and redeploy."
        );
      }

      await loadRazorpayScript();

      // IMPORTANT: your Edge Function multiplies amount * 100 already.
      // So send the amount in RUPEES (not paise) and let the server convert to paise.
      // Previously you were sending paise and server was multiplying again -> huge value -> 500.
      const payload = {
        amount: Number(totals.total), // rupees (server will do Math.round(amount * 100))
        currency: "INR",
        receipt: order.order_no,
      };

      // call the Edge Function
      let razorpayOrder: any = null;

      try {
        const invokeResult = await supabase.functions.invoke(
          "create-razorpay-order",
          {
            body: payload,
          }
        );

        // supabase.functions.invoke returns FunctionsResponse with data and error
        const { data, error } = invokeResult as any;
        if (error) throw error;
        razorpayOrder = data;
      } catch (fnError: any) {
        console.error("Edge function (create-razorpay-order) failed:", fnError);
        // try to surface message returned by the function (if any)
        const message = fnError?.message || JSON.stringify(fnError);
        throw new Error(`Payment server error: ${message}`);
      }

      // Basic validation
      if (!razorpayOrder || !razorpayOrder.id) {
        console.error("Invalid razorpay order response:", razorpayOrder);
        throw new Error("Failed to create Razorpay order from server");
      }

      const options = {
        key: keyId,
        amount: razorpayOrder.amount, // should be paise (server returns paise)
        currency: razorpayOrder.currency || "INR",
        name: "F4TRADERS",
        description: `Order ${order.order_no}`,
        order_id: razorpayOrder.id,
        handler: async function (response: any) {
          try {
            // Reduce stock
            for (const item of items) {
              const { data: product } = await supabase
                .from("products")
                .select("stock")
                .eq("id", item.product.id)
                .single();

              if (product) {
                await supabase
                  .from("products")
                  .update({ stock: product.stock - item.quantity })
                  .eq("id", item.product.id);
              }
            }

            // Ask your edge function to verify signature and update order
            const { error: verifyError } = await supabase.functions.invoke(
              "verify-razorpay-payment",
              {
                body: {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  orderId: order.id,
                },
              }
            );

            if (verifyError) throw verifyError;

            await clearCart();
            toast.success("Payment successful! Order placed.");
            navigate("/track-order");
          } catch (err) {
            console.error("Post-payment error", err);
            toast.error("Payment verification failed");
          }
        },
        prefill: {
          name: address.fullName,
          contact: address.phone,
        },
        theme: {
          color: "#000000",
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      console.error("Razorpay error", error);
      // display clean error to the user and keep the error in console for debugging
      toast.error(error.message || "Razorpay checkout failed");
      // do not rethrow: we want the UI to recover gracefully
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!addressConfirmed) {
      toast.error(
        "Please confirm the delivery address before placing the order."
      );
      return;
    }

    setLoading(true);

    try {
      const order = await createOrder(address);
      // Only Razorpay flow is supported in production right now
      await handleRazorpayPayment(order);
    } catch (error: any) {
      console.error("Checkout error:", error);
      // surface meaningful message if available
      toast.error(
        error?.message?.startsWith("Payment server error:")
          ? "Payment server error. Check logs."
          : "Checkout failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Delivery Address</h2>

              <div className="space-y-2">
                <div className="p-4 border rounded-lg">
                  <div className="font-semibold">{address.fullName || "—"}</div>
                  <div className="text-sm">{address.phone || "—"}</div>
                  <div className="text-sm">
                    {address.street}, {address.city}, {address.state} -{" "}
                    {address.pincode}
                  </div>
                </div>

                <label className="inline-flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={addressConfirmed}
                    onChange={(e) => setAddressConfirmed(e.target.checked)}
                  />
                  <span>Confirm delivery address</span>
                </label>

                <div className="text-sm text-muted-foreground">
                  If you want to use a different address, please update it from
                  your account addresses page before placing the order.
                </div>
              </div>
            </Card>

            <Card className="p-6 mt-6">
              <h2 className="text-xl font-bold mb-4">Payment Method</h2>

              {/* ONLY Razorpay enabled - COD disabled until further notice */}
              <div className="p-4 border rounded-lg mb-3">
                <div className="font-semibold">Razorpay (Online Payment)</div>
                <div className="text-sm text-muted-foreground">
                  Pay securely with card, UPI, net banking.
                </div>
              </div>

              <div className="p-4 border rounded-lg bg-yellow-50 text-sm">
                Cash on Delivery is temporarily disabled due to technical
                reasons. We expect to enable it as soon as possible — thank you
                for your patience.
              </div>
            </Card>
          </div>

          <div>
            <Card className="p-6 sticky top-4">
              <h2 className="text-xl font-bold mb-4">Order Summary</h2>
              <div className="space-y-2 text-sm mb-4">
                {items.map((item) => {
                  const product = item.product;
                  if (!product) return null;
                  return (
                    <div key={item.id} className="flex justify-between">
                      <span>
                        {product.title} x {item.quantity}
                      </span>
                      <span>
                        ₹{(product.price_inr * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="border-t pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{totals.subtotal.toFixed(2)}</span>
                </div>
                {totals.discountTotal > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-₹{totals.discountTotal.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>GST</span>
                  <span>₹{totals.gstTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>CGST</span>
                  <span>₹{totals.cgstTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Delivery</span>
                  <span>FREE</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>₹{totals.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full mt-6"
                size="lg"
              >
                {loading
                  ? "Processing..."
                  : `Pay ₹${totals.total.toFixed(2)} with Razorpay`}
              </Button>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
