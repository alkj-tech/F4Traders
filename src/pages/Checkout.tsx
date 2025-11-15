import { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

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
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('cod');
  const [address, setAddress] = useState({
    fullName: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
  });

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

  const createOrder = async () => {
    const orderItems = items.map(item => ({
      product_id: item.product.id,
      product_name: item.product.title,
      quantity: item.quantity,
      price: item.product.price_inr,
      discount_percent: item.product.discount_percent,
      gst_percent: item.product.gst_percent,
      cgst_percent: item.product.cgst_percent,
      size: item.size,
      color: item.color,
      total_price: item.product.price_inr * item.quantity * (1 - item.product.discount_percent / 100),
    }));

    const orderNo = `ORD-${Date.now()}`;

    const { data: order, error } = await supabase
      .from('orders')
      .insert([{
        order_no: orderNo,
        user_id: user!.id,
        items: orderItems as any,
        subtotal: totals.subtotal,
        discount_total: totals.discountTotal,
        gst_total: totals.gstTotal,
        cgst_total: totals.cgstTotal,
        total_amount: totals.total,
        shipping_address: address as any,
        payment_status: paymentMethod === 'cod' ? 'pending' : 'pending',
        order_status: 'pending',
      }])
      .select()
      .single();

    if (error) throw error;
    return order;
  };

  const handleRazorpayPayment = async (order: any) => {
    try {
      const { data: razorpayOrder } = await supabase.functions.invoke('create-razorpay-order', {
        body: {
          amount: totals.total,
          currency: 'INR',
          receipt: order.order_no,
        },
      });

      if (!razorpayOrder) throw new Error('Failed to create Razorpay order');

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'F4TRADERS',
        description: `Order ${order.order_no}`,
        order_id: razorpayOrder.id,
        handler: async function (response: any) {
          try {
            // Reduce stock for each item
            for (const item of items) {
              const { data: product } = await supabase
                .from('products')
                .select('stock')
                .eq('id', item.product.id)
                .single();

              if (product) {
                await supabase
                  .from('products')
                  .update({ stock: product.stock - item.quantity })
                  .eq('id', item.product.id);
              }
            }

            await supabase.functions.invoke('verify-razorpay-payment', {
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderId: order.id,
              },
            });

            await clearCart();
            toast.success('Payment successful! Order placed.');
            navigate('/track-order');
          } catch (error) {
            toast.error('Payment verification failed');
          }
        },
        prefill: {
          name: address.fullName,
          contact: address.phone,
        },
        theme: {
          color: '#000000',
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      throw error;
    }
  };

  const handleCODPayment = async (order: any) => {
    try {
      // Reduce stock for each item
      for (const item of items) {
        const { data: product } = await supabase
          .from('products')
          .select('stock')
          .eq('id', item.product.id)
          .single();

        if (product) {
          await supabase
            .from('products')
            .update({ stock: product.stock - item.quantity })
            .eq('id', item.product.id);
        }
      }

      await supabase.functions.invoke('generate-invoice', {
        body: { orderId: order.id },
      });

      await clearCart();
      toast.success('Order placed successfully! You will receive confirmation email shortly.');
      navigate('/track-order');
    } catch (error) {
      toast.error('Failed to process order');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const order = await createOrder();

      if (paymentMethod === 'razorpay') {
        await handleRazorpayPayment(order);
      } else {
        await handleCODPayment(order);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Checkout failed. Please try again.');
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
              <h2 className="text-xl font-bold mb-4">Shipping Address</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      value={address.fullName}
                      onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={address.phone}
                      onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="street">Street Address *</Label>
                  <Input
                    id="street"
                    value={address.street}
                    onChange={(e) => setAddress({ ...address, street: e.target.value })}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={address.city}
                      onChange={(e) => setAddress({ ...address, city: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      value={address.state}
                      onChange={(e) => setAddress({ ...address, state: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pincode">Pincode *</Label>
                    <Input
                      id="pincode"
                      value={address.pincode}
                      onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </form>
            </Card>

            <Card className="p-6 mt-6">
              <h2 className="text-xl font-bold mb-4">Payment Method</h2>
              <RadioGroup value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                <div className="flex items-center space-x-2 p-4 border rounded-lg mb-3 hover:border-primary transition-colors cursor-pointer">
                  <RadioGroupItem value="cod" id="cod" />
                  <Label htmlFor="cod" className="flex-1 cursor-pointer">
                    <div className="font-semibold">Cash on Delivery</div>
                    <div className="text-sm text-muted-foreground">Pay when you receive the order</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-4 border rounded-lg hover:border-primary transition-colors cursor-pointer">
                  <RadioGroupItem value="razorpay" id="razorpay" />
                  <Label htmlFor="razorpay" className="flex-1 cursor-pointer">
                    <div className="font-semibold">Razorpay (Online Payment)</div>
                    <div className="text-sm text-muted-foreground">Pay securely with card, UPI, net banking</div>
                  </Label>
                </div>
              </RadioGroup>
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
                      <span>{product.title} x {item.quantity}</span>
                      <span>₹{(product.price_inr * item.quantity).toFixed(2)}</span>
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
                {loading ? 'Processing...' : paymentMethod === 'cod' ? 'Place Order (COD)' : 'Pay with Razorpay'}
              </Button>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
