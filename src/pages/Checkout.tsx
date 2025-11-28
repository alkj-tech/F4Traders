import { useEffect, useState, useRef } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Navigate, useNavigate } from "react-router-dom";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function Checkout() {
  const { items, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Settings State
  const [gstRate, setGstRate] = useState(0);
  const [cgstRate, setCgstRate] = useState(0);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const [address, setAddress] = useState({
    fullName: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    pincode: "",
  });

  const [addressConfirmed, setAddressConfirmed] = useState(false);

  // 1. Fetch Global Settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await supabase.from("settings").select("*");
        if (data) {
          const gst = data.find((s) => s.key === "gst_percentage");
          const cgst = data.find((s) => s.key === "cgst_percentage");
          if (gst) setGstRate(Number(gst.value));
          if (cgst) setCgstRate(Number(cgst.value));
        }
        setSettingsLoaded(true);
      } catch (err) {
        console.error("Failed to fetch settings", err);
      }
    };
    fetchSettings();
  }, []);

  // 2. Fetch User Address
  useEffect(() => {
    const fetchAddress = async () => {
      try {
        if (!user) return;
        let { data, error } = await supabase
          .from("user_addresses")
          .select(
            "full_name,phone,street,city,state,pincode,is_default,created_at"
          )
          .eq("user_id", user.id)
          .eq("is_default", true)
          .single();

        if (error && (error as any).code === "PGRST116") {
          const { data: fallback } = await supabase
            .from("user_addresses")
            .select("full_name,phone,street,city,state,pincode,created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();
          if (fallback) data = fallback as any;
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

  if (!user) return <Navigate to="/auth" replace />;
  if (items.length === 0) return <Navigate to="/cart" replace />;

  const isTamilNaduPincode = (pincode: string) => {
    if (!pincode) return false;
    const prefix = pincode.substring(0, 2);
    const pVal = parseInt(prefix);
    return pVal >= 60 && pVal <= 66;
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let totalTaxableValue = 0;
    let gstTotal = 0;
    let cgstTotal = 0;

    items.forEach((item) => {
      const product = item.product;
      if (!product) return;

      const itemTotalPrice = product.price_inr * item.quantity;
      const discountAmount = itemTotalPrice * (product.discount_percent / 100);
      const itemFinalPrice = itemTotalPrice - discountAmount;

      const totalTaxRate = gstRate + cgstRate;
      const itemBasePrice = itemFinalPrice / (1 + totalTaxRate / 100);
      const itemTaxAmount = itemFinalPrice - itemBasePrice;

      const gstShare =
        totalTaxRate > 0 ? (gstRate / totalTaxRate) * itemTaxAmount : 0;
      const cgstShare =
        totalTaxRate > 0 ? (cgstRate / totalTaxRate) * itemTaxAmount : 0;

      subtotal += itemFinalPrice;
      totalTaxableValue += itemBasePrice;
      gstTotal += gstShare;
      cgstTotal += cgstShare;
    });

    let deliveryFee = 50;
    if (address.pincode && isTamilNaduPincode(address.pincode)) {
      deliveryFee = 0;
    }

    const total = subtotal + deliveryFee;

    return {
      subtotal,
      taxableValue: totalTaxableValue,
      gstTotal,
      cgstTotal,
      deliveryFee,
      total,
    };
  };

  const totals = calculateTotals();

  // Helper to structure data
  const prepareOrderData = () => {
    const orderItems = items.map((item) => {
      const itemTotal = item.product.price_inr * item.quantity;
      const discount = itemTotal * (item.product.discount_percent / 100);
      const finalPrice = itemTotal - discount;

      return {
        product_id: item.product.id,
        product_name: item.product.title,
        quantity: item.quantity,
        price: item.product.price_inr,
        discount_percent: item.product.discount_percent,
        gst_percent: gstRate,
        cgst_percent: cgstRate,
        size: item.size,
        color: item.color,
        total_price: finalPrice,
      };
    });

    const orderNo = `ORD-${Date.now()}`;

    return {
      order_no: orderNo,
      subtotal: totals.subtotal,
      discount_total: 0,
      gst_total: totals.gstTotal,
      cgst_total: totals.cgstTotal,
      delivery_fee: totals.deliveryFee,
      total_amount: totals.total,
      shipping_address: address,
      items: orderItems,
    };
  };

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

  const handlePayment = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!settingsLoaded) {
      toast.error("Loading settings...");
      return;
    }
    if (!addressConfirmed) {
      toast.error("Please confirm address.");
      return;
    }

    setLoading(true);

    try {
      await loadRazorpayScript();

      // 1. Prepare Data
      const orderData = prepareOrderData();
      console.log("Preparing Order Data:", orderData); // DEBUG LOG

      const amountInRupees = Number(totals.total.toFixed(2));

      // 2. Call Server to generate Razorpay ID
      const { data: rzpOrder, error: rzpError } =
        await supabase.functions.invoke("create-razorpay-order", {
          body: {
            amount: amountInRupees,
            currency: "INR",
            receipt: orderData.order_no,
          },
        });

      if (rzpError) throw new Error(rzpError.message);
      if (!rzpOrder?.id) throw new Error("Failed to init payment");

      // 3. Open Razorpay
      const options = {
        key: rzpOrder.key_id,
        amount: rzpOrder.amount,
        currency: "INR",
        name: "F4TRADERS",
        description: `Order ${orderData.order_no}`,
        order_id: rzpOrder.id,
        handler: async function (response: any) {
          try {
            toast.info("Verifying payment...");
            console.log("Sending verification with data:", orderData); // DEBUG LOG

            // ✅ THIS IS THE CRITICAL PART - SENDING order_data
            const { error: verifyError } = await supabase.functions.invoke(
              "verify-razorpay-payment",
              {
                body: {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,

                  // Passing the Data
                  order_data: orderData,
                  items: orderData.items,
                  user_id: user!.id,
                },
              }
            );

            if (verifyError) throw verifyError;

            await clearCart();
            toast.success("Order Placed Successfully!");
            navigate("/track-order");
          } catch (err: any) {
            console.error("Verification error", err);
            toast.error(err.message || "Order creation failed.");
          }
        },
        prefill: {
          name: address.fullName,
          contact: address.phone,
        },
        theme: { color: "#000000" },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      console.error("Payment Flow Error:", error);
      toast.error(error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // ... (JSX Return logic stays exactly the same)
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
                <label className="inline-flex items-center space-x-2 pt-2">
                  <input
                    type="checkbox"
                    className="w-4 h-4"
                    checked={addressConfirmed}
                    onChange={(e) => setAddressConfirmed(e.target.checked)}
                  />
                  <span>Confirm delivery address</span>
                </label>
              </div>
            </Card>
            <Card className="p-6 mt-6">
              <h2 className="text-xl font-bold mb-4">Payment Method</h2>
              <div className="p-4 border rounded-lg bg-gray-50">
                <div className="font-semibold">Razorpay Secure Payment</div>
                <div className="text-sm text-muted-foreground">
                  Cards, UPI, NetBanking
                </div>
              </div>
            </Card>
          </div>
          <div>
            <Card className="p-6 sticky top-4">
              <h2 className="text-xl font-bold mb-4">Order Summary</h2>

              {/* 1. Item List with crossed-out prices */}
              <div className="space-y-4 text-sm mb-4">
                {items.map((item) => {
                  // Calculate individual item math
                  const originalPrice = item.product.price_inr * item.quantity;
                  const discountAmount =
                    originalPrice * (item.product.discount_percent / 100);
                  const finalPrice = originalPrice - discountAmount;

                  return (
                    <div
                      key={item.id}
                      className="flex justify-between items-start"
                    >
                      <div>
                        <div className="font-medium">
                          {item.product.title}{" "}
                          <span className="text-xs text-muted-foreground">
                            x {item.quantity}
                          </span>
                        </div>
                        {/* Show Discount Details if applicable */}
                        {item.product.discount_percent > 0 && (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            <span className="line-through mr-1">
                              ₹{originalPrice.toFixed(2)}
                            </span>
                            <span className="text-green-600 font-medium">
                              (-₹{discountAmount.toFixed(2)})
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div>₹{finalPrice.toFixed(2)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t pt-4 space-y-2 text-sm">
                {/* 2. Added: Total MRP (Before Discount) */}
                {/* We calculate gross total on the fly for display purposes */}
                {(() => {
                  const totalMRP = items.reduce(
                    (acc, item) => acc + item.product.price_inr * item.quantity,
                    0
                  );
                  const totalDiscount = items.reduce(
                    (acc, item) =>
                      acc +
                      item.product.price_inr *
                        item.quantity *
                        (item.product.discount_percent / 100),
                    0
                  );

                  return (
                    <>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Total MRP</span>
                        <span>₹{totalMRP.toFixed(2)}</span>
                      </div>

                      {totalDiscount > 0 && (
                        <div className="flex justify-between text-green-600 font-medium">
                          <span>Discount on MRP</span>
                          <span>-₹{totalDiscount.toFixed(2)}</span>
                        </div>
                      )}
                    </>
                  );
                })()}

                <div className="flex justify-between text-muted-foreground text-xs pt-2">
                  <span>Taxable Value (Net)</span>
                  <span>₹{totals.taxableValue.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-muted-foreground text-xs">
                  <span>GST ({gstRate}%)</span>
                  <span>₹{totals.gstTotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-muted-foreground text-xs">
                  <span>CGST ({cgstRate}%)</span>
                  <span>₹{totals.cgstTotal.toFixed(2)}</span>
                </div>

                <div className="border-t my-2"></div>

                <div className="flex justify-between font-medium">
                  <span>Subtotal</span>
                  <span>₹{totals.subtotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between">
                  <span>Delivery Charges</span>
                  {totals.deliveryFee === 0 ? (
                    <span className="text-green-600 font-bold">FREE</span>
                  ) : (
                    <span>₹{totals.deliveryFee.toFixed(2)}</span>
                  )}
                </div>

                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total Payable</span>
                    <span>₹{totals.total.toFixed(2)}</span>
                  </div>
                  {totals.deliveryFee === 0 && (
                    <p className="text-xs text-green-600 mt-1">
                      Free delivery applied for Tamil Nadu location.
                    </p>
                  )}
                </div>
              </div>

              <Button
                onClick={handlePayment}
                disabled={loading || !settingsLoaded}
                className="w-full mt-6"
                size="lg"
              >
                {loading ? "Processing..." : `Pay ₹${totals.total.toFixed(2)}`}
              </Button>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
