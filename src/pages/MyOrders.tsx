import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, MapPin, Calendar, DollarSign, Eye } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function MyOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'default';
      case 'shipped':
        return 'default';
      case 'processing':
        return 'secondary';
      case 'pending':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">My Orders</h1>

        {loading ? (
          <div className="text-center py-12">Loading orders...</div>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No orders yet</h3>
              <p className="text-muted-foreground mb-4">
                Start shopping to see your orders here
              </p>
              <Button onClick={() => navigate('/products')}>Browse Products</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {orders.map((order) => {
              const items = order.items as any[];
              const address = order.shipping_address as any;

              return (
                <Card key={order.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg mb-2">
                          Order #{order.order_no}
                        </CardTitle>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(order.created_at).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            ₹{order.total_amount.toFixed(2)}
                          </div>
                        </div>
                      </div>
                      <Badge variant={getStatusColor(order.order_status)}>
                        {order.order_status?.toUpperCase()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Order Items */}
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm">Items:</h4>
                        {items.slice(0, 2).map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-sm"
                          >
                            <span className="text-muted-foreground">
                              {item.product_name} x {item.quantity}
                            </span>
                            <span className="font-medium">
                              ₹{(item.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                        {items.length > 2 && (
                          <p className="text-xs text-muted-foreground">
                            +{items.length - 2} more items
                          </p>
                        )}
                      </div>

                      {/* Delivery Address */}
                      <div className="pt-3 border-t">
                        <div className="flex items-start gap-2 text-sm">
                          <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{address.fullName}</p>
                            <p className="text-muted-foreground">
                              {address.street}, {address.city}, {address.state} -{' '}
                              {address.pincode}
                            </p>
                            <p className="text-muted-foreground">{address.phone}</p>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/track-order?order=${order.order_no}`)}
                          className="flex-1"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Track Order
                        </Button>
                        {order.payment_status === 'pending' && (
                          <Badge variant="secondary" className="py-2">
                            Payment: {order.payment_status}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
