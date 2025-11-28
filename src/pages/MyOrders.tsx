import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Package,
  MapPin,
  Clock,
  Receipt,
  Truck,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  HelpCircle,
} from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// --- Types ---
type OrderItem = {
  product_name: string;
  quantity: number;
  price: number; // Inclusive of Tax
  image?: string;
  size?: string;
  color?: string;
};

type OrderAddress = {
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
};

type AppSettings = {
  site_name: string;
  support_email: string;
  support_phone: string;
  gst_percentage: number;
  cgst_percentage: number;
};

export default function MyOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Default settings fallback
  const [settings, setSettings] = useState<AppSettings>({
    site_name: "My Store",
    support_email: "support@example.com",
    support_phone: "+910000000000",
    gst_percentage: 0,
    cgst_percentage: 0,
  });

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      Promise.all([fetchOrders(), fetchSettings()]);
    }
  }, [user]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase.from("settings").select("*");
      if (error) throw error;

      if (data) {
        // Convert array of key-value pairs to object
        const newSettings: any = { ...settings };
        data.forEach((item: any) => {
          if (item.key === "site_name") newSettings.site_name = item.value;
          if (item.key === "support_email")
            newSettings.support_email = item.value;
          if (item.key === "support_phone")
            newSettings.support_phone = item.value; // Assuming you might add this key later
          if (item.key === "gst_percentage")
            newSettings.gst_percentage = Number(item.value);
          if (item.key === "cgst_percentage")
            newSettings.cgst_percentage = Number(item.value);
        });
        setSettings(newSettings);
      }
    } catch (err) {
      console.error("Error fetching settings:", err);
    }
  };

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  // --- Invoice Generator (Detailed Breakdown) ---
  const handleDownloadInvoice = (order: any) => {
    const items = order.items as OrderItem[];
    const address = order.shipping_address as OrderAddress;

    // Tax Calculation Logic
    const gstRate = settings.gst_percentage;
    const cgstRate = settings.cgst_percentage;
    const totalTaxRate = gstRate + cgstRate;

    // Calculate Totals for Summary
    let totalTaxableValue = 0;
    let totalTaxAmount = 0;

    const itemsHtml = items
      .map((item) => {
        const lineTotal = item.price * item.quantity;

        // Back-calculate Taxable Value from Inclusive Price
        // Formula: Inclusive / (1 + Rate/100)
        const taxableValue = lineTotal / (1 + totalTaxRate / 100);
        const taxAmount = lineTotal - taxableValue;

        totalTaxableValue += taxableValue;
        totalTaxAmount += taxAmount;

        return `
        <tr>
          <td>
            <strong>${item.product_name}</strong>
            ${item.size ? `<br><small>Size: ${item.size}</small>` : ""}
            ${item.color ? `<br><small>Color: ${item.color}</small>` : ""}
          </td>
          <td style="text-align: center">${item.quantity}</td>
          <td style="text-align: right">₹${taxableValue.toFixed(2)}</td>
          <td style="text-align: right">
            ${
              gstRate > 0
                ? `₹${(taxAmount / 2).toFixed(2)} <small>(${gstRate}%)</small>`
                : "-"
            }
          </td>
          <td style="text-align: right">
            ${
              cgstRate > 0
                ? `₹${(taxAmount / 2).toFixed(2)} <small>(${cgstRate}%)</small>`
                : "-"
            }
          </td>
          <td style="text-align: right">₹${lineTotal.toFixed(2)}</td>
        </tr>
      `;
      })
      .join("");

    const printWindow = window.open("", "", "width=900,height=800");
    if (!printWindow) return;

    const htmlContent = `
      <html>
        <head>
          <title>Invoice #${order.order_no}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; line-height: 1.5; }
            .header-container { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
            .company-info h1 { margin: 0; font-size: 28px; color: #000; text-transform: uppercase; letter-spacing: 1px; }
            .company-info p { margin: 5px 0 0; font-size: 14px; color: #666; }
            .invoice-info { text-align: right; }
            .invoice-info h2 { margin: 0; color: #555; font-weight: 300; }
            .invoice-info p { margin: 5px 0 0; font-weight: bold; }
            
            .bill-to { margin-bottom: 30px; background: #f9f9f9; padding: 20px; border-radius: 5px; }
            .bill-to h3 { margin-top: 0; font-size: 14px; text-transform: uppercase; color: #888; letter-spacing: 1px; }
            
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { text-align: left; background: #333; color: white; padding: 12px; font-size: 12px; text-transform: uppercase; }
            td { padding: 12px; border-bottom: 1px solid #eee; font-size: 14px; }
            tr:last-child td { border-bottom: 2px solid #333; }
            
            .summary-section { display: flex; justify-content: flex-end; }
            .summary-table { width: 300px; }
            .summary-table td { border-bottom: 1px solid #eee; padding: 8px 0; }
            .summary-table .total-row td { border-top: 2px solid #333; border-bottom: none; font-weight: bold; font-size: 18px; padding-top: 15px; }
            
            .footer { margin-top: 60px; text-align: center; font-size: 12px; color: #aaa; border-top: 1px solid #eee; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header-container">
            <div class="company-info">
              <h1>${settings.site_name}</h1>
              <p>Email: ${settings.support_email}</p>
            </div>
            <div class="invoice-info">
              <h2>TAX INVOICE</h2>
              <p>Invoice #: ${order.order_no}</p>
              <p>Date: ${new Date(order.created_at).toLocaleDateString()}</p>
              <p>Status: ${order.payment_status?.toUpperCase()}</p>
            </div>
          </div>

          <div class="bill-to">
            <h3>Bill To:</h3>
            <strong>${address.fullName}</strong><br>
            ${address.street}<br>
            ${address.city}, ${address.state} - ${address.pincode}<br>
            Phone: ${address.phone}
          </div>

          <table>
            <thead>
              <tr>
                <th width="40%">Item / Description</th>
                <th style="text-align: center">Qty</th>
                <th style="text-align: right">Taxable Value</th>
                <th style="text-align: right">CGST</th>
                <th style="text-align: right">SGST/GST</th>
                <th style="text-align: right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="summary-section">
            <table class="summary-table">
              <tr>
                <td>Total Taxable Value:</td>
                <td style="text-align: right">₹${totalTaxableValue.toFixed(
                  2
                )}</td>
              </tr>
              <tr>
                <td>Total CGST (${cgstRate}%):</td>
                <td style="text-align: right">₹${(totalTaxAmount / 2).toFixed(
                  2
                )}</td>
              </tr>
              <tr>
                <td>Total SGST (${gstRate}%):</td>
                <td style="text-align: right">₹${(totalTaxAmount / 2).toFixed(
                  2
                )}</td>
              </tr>
              <tr class="total-row">
                <td>Grand Total:</td>
                <td style="text-align: right">₹${order.total_amount.toFixed(
                  2
                )}</td>
              </tr>
              <tr>
                <td colspan="2" style="font-size: 10px; color: #666; padding-top: 5px;">
                  (Inclusive of all taxes)
                </td>
              </tr>
            </table>
          </div>

          <div class="footer">
            <p>Thank you for shopping with ${settings.site_name}!</p>
            <p>For any queries, contact ${settings.support_email}</p>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  if (!user) return <Navigate to="/auth" replace />;

  const activeOrders = orders.filter(
    (o) => !["delivered", "cancelled", "returned"].includes(o.order_status)
  );
  const pastOrders = orders.filter((o) =>
    ["delivered", "cancelled", "returned"].includes(o.order_status)
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
        <h1 className="text-3xl font-bold mb-6">My Orders</h1>

        <Tabs defaultValue="active" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="active">
              Active Orders ({activeOrders.length})
            </TabsTrigger>
            <TabsTrigger value="history">
              Order History ({pastOrders.length})
            </TabsTrigger>
          </TabsList>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading your orders...</p>
            </div>
          ) : (
            <>
              <TabsContent value="active">
                {activeOrders.length === 0 ? (
                  <EmptyState navigate={navigate} />
                ) : (
                  <div className="space-y-6">
                    {activeOrders.map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        settings={settings}
                        onInvoice={handleDownloadInvoice}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="history">
                {pastOrders.length === 0 ? (
                  <EmptyState navigate={navigate} title="No past orders" />
                ) : (
                  <div className="space-y-6">
                    {pastOrders.map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        settings={settings}
                        onInvoice={handleDownloadInvoice}
                        isHistory
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            </>
          )}
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}

// --- Sub Components ---

function EmptyState({
  navigate,
  title = "No active orders",
}: {
  navigate: any;
  title?: string;
}) {
  return (
    <Card className="border-dashed">
      <CardContent className="py-16 text-center">
        <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <Package className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
          It looks like you haven't placed any orders yet. Check out our latest
          collection!
        </p>
        <Button onClick={() => navigate("/products")}>Start Shopping</Button>
      </CardContent>
    </Card>
  );
}

// Visual Tracker
function OrderTracker({ status }: { status: string }) {
  if (status === "cancelled") {
    return (
      <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2 text-sm font-medium border border-red-100">
        <AlertCircle className="w-5 h-5" />
        This order has been Cancelled
      </div>
    );
  }

  const steps = [
    { key: "pending", label: "Ordered", icon: Clock },
    { key: "processing", label: "Packed", icon: Package },
    { key: "shipped", label: "Shipped", icon: Truck },
    { key: "delivered", label: "Delivered", icon: CheckCircle2 },
  ];

  let currentIndex = 0;
  if (status === "processing") currentIndex = 1;
  else if (status === "shipped") currentIndex = 2;
  else if (status === "out_for_delivery")
    currentIndex = 2; // Treat as shipped/in-transit
  else if (status === "delivered") currentIndex = 3;

  return (
    <div className="w-full py-6">
      <div className="relative flex justify-between">
        <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -translate-y-1/2 z-0 hidden sm:block" />
        <div
          className="absolute top-1/2 left-0 h-1 bg-green-500 -translate-y-1/2 z-0 transition-all duration-500 hidden sm:block"
          style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isActive = idx <= currentIndex;
          return (
            <div
              key={step.key}
              className="relative z-10 flex flex-col items-center group"
            >
              <div
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 
                  ${
                    isActive
                      ? "bg-green-500 border-green-500 text-white shadow-md"
                      : "bg-white border-gray-200 text-gray-400"
                  }`}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span
                className={`text-[10px] sm:text-xs font-medium mt-2 ${
                  isActive ? "text-green-600" : "text-gray-400"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Order Card
function OrderCard({
  order,
  onInvoice,
  settings,
  isHistory = false,
}: {
  order: any;
  onInvoice: (o: any) => void;
  settings: AppSettings;
  isHistory?: boolean;
}) {
  const items = order.items as OrderItem[];
  const address = order.shipping_address as OrderAddress;

  return (
    <Card className="overflow-hidden border-none shadow-md ring-1 ring-slate-200">
      <div className="bg-slate-50/80 p-4 sm:p-6 border-b flex flex-wrap gap-4 justify-between items-center">
        <div className="flex gap-4 sm:gap-8">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
              Placed
            </p>
            <p className="text-sm font-medium">
              {new Date(order.created_at).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
              Total
            </p>
            <p className="text-sm font-medium">
              ₹{order.total_amount.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
              Order #
            </p>
            <p className="text-sm font-medium">{order.order_no}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 h-8 bg-white"
            onClick={() => onInvoice(order)}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Invoice</span>
          </Button>
        </div>
      </div>

      <CardContent className="p-4 sm:p-6">
        {!isHistory || order.order_status === "delivered" ? (
          <div className="mb-8 px-2">
            <OrderTracker status={order.order_status} />
          </div>
        ) : null}

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 space-y-4">
            {items.map((item, idx) => (
              <div key={idx} className="flex gap-4 items-start">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 rounded-md flex-shrink-0 overflow-hidden border">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.product_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <Package className="w-6 h-6" />
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-sm sm:text-base">
                    {item.product_name}
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Qty: {item.quantity}
                    {item.size && <span> • Size: {item.size}</span>}
                    {item.color && <span> • Color: {item.color}</span>}
                  </p>
                  <p className="text-sm font-medium mt-1">₹{item.price}</p>
                </div>
              </div>
            ))}
          </div>

          <Separator className="lg:hidden" />

          <div className="lg:w-64 flex-shrink-0 text-sm">
            <h5 className="font-semibold mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              Delivery Address
            </h5>
            <div className="text-muted-foreground bg-slate-50 p-3 rounded-md">
              <p className="font-medium text-foreground">{address.fullName}</p>
              <p>{address.street}</p>
              <p>
                {address.city}, {address.state}
              </p>
              <p>{address.pincode}</p>
              <p className="mt-1 text-xs">Ph: {address.phone}</p>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="bg-slate-50 p-3 sm:px-6 flex justify-between items-center border-t">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Payment: </span>
          <Badge
            variant={order.payment_status === "paid" ? "default" : "secondary"}
            className="text-[10px] h-5"
          >
            {order.payment_status?.toUpperCase()}
          </Badge>
        </div>

        {/* NEW: Need Help Section */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-8 text-muted-foreground hover:text-foreground gap-1"
            >
              <HelpCircle className="w-3.5 h-3.5" /> Need Help?
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <a
                href={`mailto:${settings.support_email}`}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Mail className="w-4 h-4" /> Email Support
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a
                href={`tel:${settings.support_phone}`}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Phone className="w-4 h-4" /> Call Support
              </a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  );
}
