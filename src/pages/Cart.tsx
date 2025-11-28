import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trash2, AlertCircle, Info } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Cart() {
  const { items, updateQuantity, removeItem } = useCart();

  // Settings State
  const [gstRate, setGstRate] = useState(0);
  const [cgstRate, setCgstRate] = useState(0);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // 1. Fetch Global Settings (GST/CGST)
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

  // --- Helper: Get Exact Stock for Variant ---
  const getMaxStock = (item: any) => {
    const product = item.product;
    if (!product) return 0;

    // 1. Check for Granular Variant Stock (JSONB)
    if (
      product.variant_stock &&
      Array.isArray(product.variant_stock) &&
      item.size &&
      item.color
    ) {
      const variant = product.variant_stock.find(
        (v: any) => v.size === item.size && v.color === item.color
      );
      return variant ? variant.stock : 0;
    }

    // 2. Fallback to global stock (if no variants exist)
    return product.stock || 0;
  };

  // --- Handle Quantity Increase with Validation ---
  const handleIncreaseQuantity = (item: any, maxStock: number) => {
    if (item.quantity >= maxStock) {
      toast.error(`Sorry, only ${maxStock} units available in stock.`);
      return;
    }
    updateQuantity(item.id, item.quantity + 1);
  };

  // 2. Check for Invalid Items
  // We check two things: Missing Selections OR Out of Stock items
  const hasBlockingIssues = items.some((item) => {
    const maxStock = getMaxStock(item);
    // Invalid if: No Size/Color OR Stock is 0 (Out of stock)
    return !item.size || !item.color || maxStock === 0;
  });

  // 3. Calculate Totals (Inclusive Tax Logic)
  const calculateTotals = () => {
    let subtotal = 0; // Total Price (After Discount, Inc Tax)
    let totalTaxableValue = 0; // Base Price (Excl Tax)
    let gstTotal = 0;
    let cgstTotal = 0;

    items.forEach((item) => {
      const product = item.product;
      if (!product) return;

      const itemTotalPrice = product.price_inr * item.quantity;
      const discountAmount = itemTotalPrice * (product.discount_percent / 100);

      // Amount user actually pays for this item
      const itemFinalPrice = itemTotalPrice - discountAmount;

      // Back-calculate Tax
      const totalTaxRate = gstRate + cgstRate;
      const itemBasePrice = itemFinalPrice / (1 + totalTaxRate / 100);

      const itemTaxAmount = itemFinalPrice - itemBasePrice;

      // Split tax between GST and CGST
      const gstShare =
        totalTaxRate > 0 ? (gstRate / totalTaxRate) * itemTaxAmount : 0;
      const cgstShare =
        totalTaxRate > 0 ? (cgstRate / totalTaxRate) * itemTaxAmount : 0;

      subtotal += itemFinalPrice;
      totalTaxableValue += itemBasePrice;
      gstTotal += gstShare;
      cgstTotal += cgstShare;
    });

    const total = subtotal;

    return {
      subtotal,
      taxableValue: totalTaxableValue,
      gstTotal,
      cgstTotal,
      total,
    };
  };

  const totals = calculateTotals();

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold">Your cart is empty</h2>
            <Link to="/products">
              <Button>Continue Shopping</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => {
              const product = item.product;
              if (!product) return null;

              const images = product.images || [];
              const price = product.price_inr * item.quantity;
              const discount = price * (product.discount_percent / 100);
              const finalPrice = price - discount;

              const isMissingDetails = !item.size || !item.color;
              const maxStock = getMaxStock(item);
              const isOutOfStock = maxStock === 0;
              const isMaxReached = item.quantity >= maxStock;

              return (
                <Card
                  key={item.id}
                  className={`p-4 ${
                    isMissingDetails || isOutOfStock
                      ? "border-red-500 bg-red-50"
                      : ""
                  }`}
                >
                  <div className="flex gap-4">
                    <img
                      src={images[0] || "/placeholder.svg"}
                      alt={product.title}
                      className="w-24 h-24 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold">{product.title}</h3>
                      {product.brand && (
                        <p className="text-sm text-muted-foreground">
                          {product.brand}
                        </p>
                      )}

                      {/* Size & Color Display / Validation */}
                      <div className="mt-1 space-y-1">
                        {item.size ? (
                          <p className="text-sm">
                            Size:{" "}
                            <span className="font-medium">{item.size}</span>
                          </p>
                        ) : (
                          <p className="text-sm text-red-600 font-bold flex items-center">
                            <AlertCircle className="w-4 h-4 mr-1" /> Size
                            Missing
                          </p>
                        )}

                        {item.color ? (
                          <p className="text-sm">
                            Color:{" "}
                            <span className="font-medium">{item.color}</span>
                          </p>
                        ) : (
                          <p className="text-sm text-red-600 font-bold flex items-center">
                            <AlertCircle className="w-4 h-4 mr-1" /> Color
                            Missing
                          </p>
                        )}

                        {/* Stock Warning inside card */}
                        {isOutOfStock && (
                          <p className="text-sm text-red-600 font-bold flex items-center mt-1">
                            <AlertCircle className="w-4 h-4 mr-1" /> Item Out of
                            Stock
                          </p>
                        )}
                      </div>

                      <p className="font-bold mt-2">₹{finalPrice.toFixed(2)}</p>

                      {product.discount_percent > 0 && (
                        <p className="text-xs text-muted-foreground line-through">
                          ₹{price.toFixed(2)}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col items-end justify-between">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 size={18} />
                      </Button>

                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() =>
                              updateQuantity(
                                item.id,
                                Math.max(1, item.quantity - 1)
                              )
                            }
                          >
                            -
                          </Button>
                          <span className="w-8 text-center font-medium">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            // Disable if max reached OR if it's out of stock completely
                            disabled={isMaxReached || isOutOfStock}
                            onClick={() =>
                              handleIncreaseQuantity(item, maxStock)
                            }
                          >
                            +
                          </Button>
                        </div>
                        {isMaxReached && !isOutOfStock && (
                          <span className="text-[10px] text-orange-600 font-medium">
                            Max Stock limit reached
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {(isMissingDetails || isOutOfStock) && (
                    <div className="mt-2 text-xs text-red-600 flex items-start gap-1">
                      <Info className="w-3 h-3 mt-0.5" />
                      <span>
                        {isOutOfStock
                          ? "This item is no longer available in the selected variation. Please remove it."
                          : "Please remove this item and re-add it with valid Size and Color."}
                      </span>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          <div>
            <Card className="p-6 sticky top-4">
              <h2 className="text-xl font-bold mb-4">Order Summary</h2>

              <div className="border-t pt-4 space-y-2 text-sm">
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

                <div className="flex justify-between text-muted-foreground">
                  <span>Delivery</span>
                  <span className="text-xs">Calculated at Checkout</span>
                </div>

                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>₹{totals.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {hasBlockingIssues ? (
                <Button
                  disabled
                  className="w-full mt-6 bg-red-100 text-red-600 hover:bg-red-100 opacity-100"
                  size="lg"
                >
                  Fix Issues to Checkout
                </Button>
              ) : (
                <Link to="/checkout">
                  <Button
                    className="w-full mt-6"
                    size="lg"
                    disabled={!settingsLoaded}
                  >
                    {settingsLoaded ? "Proceed to Checkout" : "Loading..."}
                  </Button>
                </Link>
              )}
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
