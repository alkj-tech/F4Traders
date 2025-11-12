import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface Order {
  id: string;
  order_no: string;
  user_id: string;
  order_status: string;
  payment_status: string;
  total_amount: number;
  created_at: string;
  tracking_no: string | null;
  courier_provider: string | null;
  shipping_address: any;
  items: any;
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [trackingNo, setTrackingNo] = useState("");
  const [courierProvider, setCourierProvider] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error fetching orders", variant: "destructive" });
    } else {
      setOrders(data || []);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ order_status: status })
      .eq("id", orderId);

    if (error) {
      toast({ title: "Error updating order status", variant: "destructive" });
    } else {
      toast({ title: "Order status updated" });
      fetchOrders();
    }
  };

  const updateTracking = async () => {
    if (!selectedOrder) return;

    const { error } = await supabase
      .from("orders")
      .update({
        tracking_no: trackingNo,
        courier_provider: courierProvider,
        order_status: "shipped",
      })
      .eq("id", selectedOrder.id);

    if (error) {
      toast({ title: "Error updating tracking", variant: "destructive" });
    } else {
      toast({ title: "Tracking information updated" });
      setSelectedOrder(null);
      setTrackingNo("");
      setCourierProvider("");
      fetchOrders();
    }
  };

  const generateInvoice = async (order: Order) => {
    try {
      const { data, error } = await supabase.functions.invoke("generate-invoice", {
        body: { orderId: order.id },
      });

      if (error) throw error;

      toast({ title: "Invoice generated successfully" });
      fetchOrders();
    } catch (error: any) {
      toast({ title: "Error generating invoice", description: error.message, variant: "destructive" });
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500",
      confirmed: "bg-blue-500",
      shipped: "bg-purple-500",
      delivered: "bg-green-500",
      cancelled: "bg-red-500",
    };
    return colors[status] || "bg-gray-500";
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Order Management</h1>

      <div className="grid gap-4">
        {orders.map((order) => (
          <Card key={order.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Order #{order.order_no}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {new Date(order.created_at).toLocaleString()}
                  </p>
                </div>
                <Badge className={getStatusColor(order.order_status)}>
                  {order.order_status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Total Amount</p>
                    <p className="text-lg">₹{order.total_amount}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Payment Status</p>
                    <Badge variant={order.payment_status === "completed" ? "default" : "secondary"}>
                      {order.payment_status}
                    </Badge>
                  </div>
                </div>

                {order.tracking_no && (
                  <div>
                    <p className="text-sm font-medium">Tracking</p>
                    <p className="text-sm">
                      {order.courier_provider}: {order.tracking_no}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium mb-2">Items</p>
                  {order.items.map((item: any, idx: number) => (
                    <div key={idx} className="text-sm flex justify-between py-1 border-b">
                      <span>{item.product_name} x {item.quantity}</span>
                      <span>₹{item.total_price}</span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Select
                    value={order.order_status}
                    onValueChange={(value) => updateOrderStatus(order.id, value)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedOrder(order);
                          setTrackingNo(order.tracking_no || "");
                          setCourierProvider(order.courier_provider || "");
                        }}
                      >
                        Update Tracking
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Update Tracking Information</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Courier Provider</Label>
                          <Input
                            value={courierProvider}
                            onChange={(e) => setCourierProvider(e.target.value)}
                            placeholder="e.g., Professional Courier"
                          />
                        </div>
                        <div>
                          <Label>Tracking Number</Label>
                          <Input
                            value={trackingNo}
                            onChange={(e) => setTrackingNo(e.target.value)}
                            placeholder="Enter tracking number"
                          />
                        </div>
                        <Button onClick={updateTracking} className="w-full">
                          Update Tracking
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button variant="outline" onClick={() => generateInvoice(order)}>
                    Generate Invoice
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
