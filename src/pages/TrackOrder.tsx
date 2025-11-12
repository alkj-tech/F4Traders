import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Package, Truck, CheckCircle, Clock } from "lucide-react";

export default function TrackOrder() {
  const [orderNo, setOrderNo] = useState("");
  const [trackingNo, setTrackingNo] = useState("");
  const [orderData, setOrderData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleTrack = async () => {
    if (!orderNo && !trackingNo) {
      toast({
        title: "Input Required",
        description: "Please enter either Order Number or Tracking Number",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      let query = supabase.from("orders").select("*");
      
      if (orderNo) {
        query = query.eq("order_no", orderNo);
      } else if (trackingNo) {
        query = query.eq("tracking_no", trackingNo);
      }

      const { data, error } = await query.single();

      if (error) throw error;

      if (data) {
        setOrderData(data);
        
        // TODO: When Professional Courier API key is added, fetch real-time tracking data
        // For now, showing order status from database
      } else {
        toast({
          title: "Order Not Found",
          description: "No order found with the provided details",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch order details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-8 w-8 text-yellow-500" />;
      case "processing":
        return <Package className="h-8 w-8 text-blue-500" />;
      case "shipped":
        return <Truck className="h-8 w-8 text-purple-500" />;
      case "delivered":
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      default:
        return <Clock className="h-8 w-8 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AnnouncementBar />
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8 text-center">Track Your Order</h1>

        <Card className="max-w-2xl mx-auto mb-8">
          <CardHeader>
            <CardTitle>Enter Order Details</CardTitle>
            <CardDescription>
              Enter your order number or tracking number to track your shipment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Order Number</label>
              <Input
                placeholder="e.g., ORD-2025-001"
                value={orderNo}
                onChange={(e) => setOrderNo(e.target.value)}
              />
            </div>
            <div className="text-center text-sm text-muted-foreground">OR</div>
            <div>
              <label className="text-sm font-medium mb-2 block">Tracking Number</label>
              <Input
                placeholder="Enter tracking number"
                value={trackingNo}
                onChange={(e) => setTrackingNo(e.target.value)}
              />
            </div>
            <Button onClick={handleTrack} disabled={loading} className="w-full">
              {loading ? "Tracking..." : "Track Order"}
            </Button>
          </CardContent>
        </Card>

        {orderData && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                {getStatusIcon(orderData.order_status)}
                Order Status: {orderData.order_status.toUpperCase()}
              </CardTitle>
              <CardDescription>Order #{orderData.order_no}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Order Date</p>
                  <p className="font-medium">
                    {new Date(orderData.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Payment Status</p>
                  <p className="font-medium capitalize">{orderData.payment_status}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
                  <p className="font-medium">₹{orderData.total_amount}</p>
                </div>
                {orderData.tracking_no && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Tracking Number</p>
                    <p className="font-medium">{orderData.tracking_no}</p>
                  </div>
                )}
                {orderData.courier_provider && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Courier Partner</p>
                    <p className="font-medium">{orderData.courier_provider}</p>
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Shipping Address</h3>
                <div className="text-sm space-y-1">
                  <p>{orderData.shipping_address.name}</p>
                  <p>{orderData.shipping_address.address}</p>
                  <p>
                    {orderData.shipping_address.city}, {orderData.shipping_address.state} -{" "}
                    {orderData.shipping_address.pincode}
                  </p>
                  <p>Phone: {orderData.shipping_address.phone}</p>
                </div>
              </div>

              {orderData.order_status === "pending" && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    Your order is being processed. You will receive tracking details soon.
                  </p>
                </div>
              )}

              {orderData.order_status === "shipped" && orderData.tracking_no && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    Your order has been shipped! Real-time tracking updates will be available once
                    Professional Courier API is integrated.
                  </p>
                </div>
              )}

              {orderData.order_status === "delivered" && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800">
                    Your order has been delivered! Thank you for shopping with F4traders.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
}
