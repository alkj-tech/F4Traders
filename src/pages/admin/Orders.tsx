import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Download,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Printer,
  Truck,
  Package,
  CheckCircle2,
  Clock,
  MapPin,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

// --- Constants ---
const ITEMS_PER_PAGE = 20;

// --- Types ---
// Defined loosely (any) to prevent TypeScript fighting with your complex JSON structure
interface Order {
  id: string;
  order_no: string;
  user_id: string;
  created_at: string;
  total_amount: number;
  payment_status: string;
  order_status: string;
  tracking_no: string | null;
  courier_provider: string | null;
  shipping_address: any; // Fixed: Use any to allow property access without errors
  items: any[]; // Fixed: Use array of any for items
  profiles: any; // Fixed: Use any to handle join results safely
}

interface AppSettings {
  site_name: string;
  support_email: string;
  gst_percentage: number;
  cgst_percentage: number;
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const [settings, setSettings] = useState<AppSettings>({
    site_name: "My Store",
    support_email: "",
    gst_percentage: 0,
    cgst_percentage: 0,
  });

  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [managingOrder, setManagingOrder] = useState<Order | null>(null);
  const [trackingInput, setTrackingInput] = useState("");
  const [providerInput, setProviderInput] = useState("");

  // --- Initial Load ---
  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [page, search, statusFilter]);

  // --- Data Fetching ---
  const fetchSettings = async () => {
    const { data } = await supabase.from("settings").select("*");
    if (data) {
      const newSettings: any = { ...settings };
      data.forEach((item: any) => {
        if (item.key === "site_name") newSettings.site_name = item.value;
        if (item.key === "support_email")
          newSettings.support_email = item.value;
        if (item.key === "gst_percentage")
          newSettings.gst_percentage = Number(item.value);
        if (item.key === "cgst_percentage")
          newSettings.cgst_percentage = Number(item.value);
      });
      setSettings(newSettings);
    }
  };

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("orders")
        .select(`*, profiles(full_name, email)`, { count: "exact" });

      if (statusFilter !== "all")
        query = query.eq("order_status", statusFilter);
      if (search)
        query = query.or(
          `order_no.ilike.%${search}%,tracking_no.ilike.%${search}%`
        );

      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data, count, error } = await query
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;

      // Cast to any to satisfy the Order interface requirements
      setOrders((data as any) || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  // --- Bulk Actions ---
  const toggleSelectAll = (checked: boolean) => {
    if (checked) setSelectedOrders(orders.map((o) => o.id));
    else setSelectedOrders([]);
  };

  const toggleSelectOrder = (id: string) => {
    setSelectedOrders((prev) =>
      prev.includes(id) ? prev.filter((oid) => oid !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedOrders.length === 0) return;
    if (selectedOrders.length > 100)
      return toast.error("Max 100 deletes at once");
    if (!confirm(`Delete ${selectedOrders.length} orders?`)) return;

    try {
      const { error } = await supabase
        .from("orders")
        .delete()
        .in("id", selectedOrders);
      if (error) throw error;
      toast.success("Orders deleted");
      setSelectedOrders([]);
      fetchOrders();
    } catch (error) {
      toast.error("Failed to delete");
    }
  };

  const handleExportExcel = () => {
    const exportData = orders.map((order) => {
      // FIX: Ensure address exists or use empty object
      const addr = order.shipping_address || {};

      return {
        "Order No": order.order_no,
        Date: new Date(order.created_at).toLocaleDateString(),
        Customer: addr.fullName || "Guest",
        City: addr.city || "",
        Phone: addr.phone || "",
        Status: order.order_status,
        Payment: order.payment_status,
        Total: order.total_amount,
        Tracking: order.tracking_no || "N/A",
        Provider: order.courier_provider || "N/A",
      };
    });
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Orders");
    XLSX.writeFile(wb, `Orders_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // --- Order Management ---
  const openManageDialog = (order: Order) => {
    setManagingOrder(order);
    setTrackingInput(order.tracking_no || "");
    setProviderInput(order.courier_provider || "");
  };

  const updateStatus = async (status: string, extraData: any = {}) => {
    if (!managingOrder) return;

    // Optimistic Update
    const updatedOrder = {
      ...managingOrder,
      order_status: status,
      ...extraData,
    };
    setManagingOrder(updatedOrder);

    const { error } = await supabase
      .from("orders")
      .update({ order_status: status, ...extraData })
      .eq("id", managingOrder.id);

    if (error) {
      toast.error("Failed to update status");
      fetchOrders();
    } else {
      toast.success(`Order marked as ${status}`);
      fetchOrders();
    }
  };

  // --- Invoice Logic ---
  const handlePrintInvoice = (order: Order) => {
    const items = Array.isArray(order.items) ? order.items : [];

    // FIX: Fallback to default object with all properties to prevent TS error
    const address: any = order.shipping_address || {
      fullName: "N/A",
      street: "",
      city: "",
      state: "",
      pincode: "",
      phone: "",
    };

    const gstRate = settings.gst_percentage;
    const cgstRate = settings.cgst_percentage;
    const totalTaxRate = gstRate + cgstRate;

    let totalTaxable = 0;
    let totalTax = 0;

    const itemsRows = items
      .map((item) => {
        const lineTotal = Number(
          item.total_price || item.price * item.quantity
        );

        const taxable = lineTotal / (1 + totalTaxRate / 100);
        const taxAmount = lineTotal - taxable;

        totalTaxable += taxable;
        totalTax += taxAmount;

        return `
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">
                <strong>${item.product_name}</strong>
                ${
                  item.size
                    ? `<br><small style="color:#666">Size: ${item.size}</small>`
                    : ""
                }
                ${
                  item.color
                    ? `<br><small style="color:#666">Color: ${item.color}</small>`
                    : ""
                }
            </td>
            <td align="center" style="padding: 10px; border-bottom: 1px solid #eee;">${
              item.quantity
            }</td>
            <td align="right" style="padding: 10px; border-bottom: 1px solid #eee;">₹${taxable.toFixed(
              2
            )}</td>
            <td align="right" style="padding: 10px; border-bottom: 1px solid #eee;">₹${lineTotal.toFixed(
              2
            )}</td>
        </tr>
       `;
      })
      .join("");

    const printWindow = window.open("", "", "width=900,height=800");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
           <title>Invoice ${order.order_no}</title>
           <style>
             body { font-family: 'Helvetica', sans-serif; padding: 40px; color: #333; font-size: 14px; }
             h1 { margin: 0; font-size: 24px; text-transform: uppercase; }
             p { margin: 5px 0; }
             table { width: 100%; border-collapse: collapse; }
             th { background: #f4f4f4; padding: 10px; text-align: left; font-weight: bold; border-bottom: 2px solid #ddd; }
             .header-row { display: flex; justify-content: space-between; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
           </style>
        </head>
        <body>
           <div class="header-row">
              <div>
                  <h1>${settings.site_name}</h1>
                  <p>${settings.support_email}</p>
              </div>
              <div style="text-align:right">
                  <h2 style="margin:0; color:#555;">INVOICE</h2>
                  <p># ${order.order_no}</p>
                  <p>Date: ${new Date(
                    order.created_at
                  ).toLocaleDateString()}</p>
              </div>
           </div>
           
           <div style="margin-bottom: 30px; display: flex; justify-content: space-between;">
              <div style="background: #f9f9f9; padding: 15px; border-radius: 4px; width: 45%;">
                  <strong>Bill To:</strong><br>
                  ${address.fullName}<br>
                  ${address.street}<br>
                  ${address.city}, ${address.state} - ${address.pincode}<br>
                  Phone: ${address.phone}
              </div>
           </div>

           <table>
             <thead>
               <tr><th>Item</th><th align="center">Qty</th><th align="right">Taxable</th><th align="right">Total</th></tr>
             </thead>
             <tbody>${itemsRows}</tbody>
           </table>

           <div style="display:flex; justify-content:flex-end; margin-top: 30px;">
              <table style="width: 300px;">
                 <tr>
                    <td style="padding: 5px;">Total Taxable:</td>
                    <td align="right" style="padding: 5px;">₹${totalTaxable.toFixed(
                      2
                    )}</td>
                 </tr>
                 <tr>
                    <td style="padding: 5px;">CGST (${cgstRate}%):</td>
                    <td align="right" style="padding: 5px;">₹${(
                      totalTax / 2
                    ).toFixed(2)}</td>
                 </tr>
                 <tr>
                    <td style="padding: 5px;">SGST (${gstRate}%):</td>
                    <td align="right" style="padding: 5px;">₹${(
                      totalTax / 2
                    ).toFixed(2)}</td>
                 </tr>
                 <tr style="font-weight:bold; font-size:18px;">
                    <td style="padding-top: 15px; border-top: 2px solid #333;">Grand Total:</td>
                    <td align="right" style="padding-top: 15px; border-top: 2px solid #333;">₹${Number(
                      order.total_amount
                    ).toFixed(2)}</td>
                 </tr>
                 <tr>
                    <td colspan="2" align="right" style="font-size: 11px; color: #777;">(Inclusive of all taxes)</td>
                 </tr>
              </table>
           </div>
           <script>window.onload = () => window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
      case "delivered":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      case "shipped":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100";
      case "processing":
      case "confirmed":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
      case "cancelled":
        return "bg-red-100 text-red-800 hover:bg-red-100";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground mt-1">
            Manage {totalCount} orders
          </p>
        </div>
        <div className="flex gap-2">
          {selectedOrders.length > 0 && (
            <Button variant="destructive" onClick={handleBulkDelete}>
              <Trash2 className="w-4 h-4 mr-2" /> Delete (
              {selectedOrders.length})
            </Button>
          )}
          <Button variant="outline" onClick={handleExportExcel}>
            <Download className="w-4 h-4 mr-2" /> Export Page
          </Button>
        </div>
      </div>

      {/* FILTERS */}
      <Card>
        <div className="p-4 flex flex-col md:flex-row gap-4 items-end md:items-center">
          <div className="flex-1 w-full relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search Order ID, Tracking..."
              className="pl-9"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="w-full md:w-[200px]">
            <Select
              value={statusFilter}
              onValueChange={(val) => {
                setStatusFilter(val);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  <SelectValue placeholder="Status" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* TABLE */}
      {loading ? (
        <div className="text-center py-20">Loading...</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 border border-dashed rounded-lg">
          No orders found
        </div>
      ) : (
        <>
          <div className="hidden md:block rounded-md border bg-white shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={selectedOrders.length === orders.length}
                      onCheckedChange={(c) => toggleSelectAll(!!c)}
                    />
                  </TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => {
                  // Safe Accessors
                  const addr = order.shipping_address || {};
                  const customerName =
                    addr.fullName || order.profiles?.full_name || "Guest";

                  return (
                    <TableRow key={order.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedOrders.includes(order.id)}
                          onCheckedChange={() => toggleSelectOrder(order.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{order.order_no}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">
                          {customerName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {addr.city}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(order.order_status)}>
                          {order.order_status.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        ₹{Number(order.total_amount).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openManageDialog(order)}
                        >
                          Manage
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* MOBILE LIST */}
          <div className="md:hidden grid gap-4">
            {orders.map((order) => {
              const addr = order.shipping_address || {};
              return (
                <Card key={order.id}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div className="font-bold">{order.order_no}</div>
                    <Badge className={getStatusColor(order.order_status)}>
                      {order.order_status}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between mb-2">
                      <span className="text-muted-foreground">Customer</span>
                      <span>{addr.fullName || "Guest"}</span>
                    </div>
                    <div className="flex justify-between mb-4">
                      <span className="text-muted-foreground">Total</span>
                      <span className="font-bold">
                        ₹{Number(order.total_amount).toFixed(2)}
                      </span>
                    </div>
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => openManageDialog(order)}
                    >
                      Manage Order
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* PAGINATION */}
          <div className="flex items-center justify-between py-4">
            <div className="text-sm text-muted-foreground">
              Page {page} of {Math.ceil(totalCount / ITEMS_PER_PAGE)}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page * ITEMS_PER_PAGE >= totalCount}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}

      {/* --- MANAGE ORDER DIALOG --- */}
      {managingOrder && (
        <Dialog
          open={!!managingOrder}
          onOpenChange={(open) => !open && setManagingOrder(null)}
        >
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>Manage Order #{managingOrder.order_no}</span>
                <Badge className={getStatusColor(managingOrder.order_status)}>
                  {managingOrder.order_status.toUpperCase()}
                </Badge>
              </DialogTitle>
            </DialogHeader>

            <div className="py-6 px-2 bg-slate-50 rounded-lg border">
              <OrderTrackerAdmin status={managingOrder.order_status} />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Shipping Details
                </h4>
                {/* Use safe access again for dialog */}
                {(() => {
                  const addr = managingOrder.shipping_address || {};
                  return (
                    <div className="text-sm bg-slate-50 p-3 rounded border">
                      <p className="font-medium">{addr.fullName || "Guest"}</p>
                      <p>{addr.street}</p>
                      <p>
                        {addr.city}, {addr.state}
                      </p>
                      <p>{addr.pincode}</p>
                      <p className="mt-1 text-muted-foreground">
                        Phone: {addr.phone}
                      </p>
                    </div>
                  );
                })()}
              </div>
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Package className="w-4 h-4" /> Order Items
                </h4>
                <div className="text-sm bg-slate-50 p-3 rounded border max-h-[120px] overflow-y-auto space-y-2">
                  {managingOrder.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>
                        {item.product_name}{" "}
                        <span className="text-xs text-muted-foreground">
                          x{item.quantity}
                        </span>
                      </span>
                      <span className="font-medium">
                        ₹
                        {(
                          Number(item.total_price) || item.price * item.quantity
                        ).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-semibold">Update Status Workflow</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Button
                  variant={
                    managingOrder.order_status === "pending" ||
                    managingOrder.order_status === "confirmed"
                      ? "default"
                      : "outline"
                  }
                  disabled={
                    managingOrder.order_status !== "pending" &&
                    managingOrder.order_status !== "confirmed"
                  }
                  onClick={() => updateStatus("processing")}
                  className="justify-start h-auto py-3"
                >
                  <div className="text-left">
                    <div className="font-semibold">1. Mark Processing</div>
                    <div className="text-xs font-normal opacity-70">
                      Confirm & Pack items
                    </div>
                  </div>
                </Button>

                <div
                  className={`col-span-1 md:col-span-2 p-3 border rounded-md ${
                    managingOrder.order_status === "processing"
                      ? "bg-blue-50 border-blue-200"
                      : "bg-slate-50"
                  }`}
                >
                  <div className="font-semibold mb-2 text-sm">
                    2. Ship Order
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <Input
                      placeholder="Provider"
                      value={providerInput}
                      onChange={(e) => setProviderInput(e.target.value)}
                      className="bg-white h-8 text-xs"
                      disabled={
                        managingOrder.order_status !== "processing" &&
                        managingOrder.order_status !== "shipped"
                      }
                    />
                    <Input
                      placeholder="Tracking #"
                      value={trackingInput}
                      onChange={(e) => setTrackingInput(e.target.value)}
                      className="bg-white h-8 text-xs"
                      disabled={
                        managingOrder.order_status !== "processing" &&
                        managingOrder.order_status !== "shipped"
                      }
                    />
                  </div>
                  <Button
                    size="sm"
                    className="w-full"
                    disabled={!trackingInput || !providerInput}
                    onClick={() =>
                      updateStatus("shipped", {
                        tracking_no: trackingInput,
                        courier_provider: providerInput,
                      })
                    }
                  >
                    <Truck className="w-3 h-3 mr-2" />
                    {managingOrder.order_status === "shipped"
                      ? "Update Tracking"
                      : "Mark as Shipped"}
                  </Button>
                </div>

                <Button
                  variant={
                    managingOrder.order_status === "shipped"
                      ? "default"
                      : "outline"
                  }
                  disabled={
                    managingOrder.order_status !== "shipped" &&
                    managingOrder.order_status !== "delivered"
                  }
                  onClick={() => updateStatus("delivered")}
                  className="justify-start h-auto py-3 md:col-span-3"
                >
                  <div className="text-left flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <div>
                      <div className="font-semibold">3. Mark Delivered</div>
                      <div className="text-xs font-normal opacity-70">
                        Order reached customer
                      </div>
                    </div>
                  </div>
                </Button>
              </div>

              <div className="flex justify-between items-center pt-4 mt-2 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePrintInvoice(managingOrder)}
                >
                  <Printer className="w-4 h-4 mr-2" /> Print Invoice
                </Button>
                {managingOrder.order_status !== "cancelled" && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => updateStatus("cancelled")}
                  >
                    <XCircle className="w-4 h-4 mr-2" /> Cancel Order
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// --- Visual Tracker ---
function OrderTrackerAdmin({ status }: { status: string }) {
  if (status === "cancelled")
    return (
      <div className="text-center text-red-600 font-medium">
        Order Cancelled
      </div>
    );

  const steps = [
    { key: "confirmed", label: "Confirmed", icon: Clock },
    { key: "processing", label: "Processing", icon: Package },
    { key: "shipped", label: "Shipped", icon: Truck },
    { key: "delivered", label: "Delivered", icon: CheckCircle2 },
  ];

  let currentIndex = 0;
  if (status === "processing") currentIndex = 1;
  else if (status === "shipped") currentIndex = 2;
  else if (status === "delivered") currentIndex = 3;

  return (
    <div className="relative w-full px-4">
      <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -translate-y-1/2 z-0" />
      <div
        className="absolute top-1/2 left-0 h-1 bg-blue-600 -translate-y-1/2 z-0 transition-all duration-300"
        style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
      />
      <div className="relative z-10 flex justify-between">
        {steps.map((step, idx) => {
          const active = idx <= currentIndex;
          const Icon = step.icon;
          return (
            <div
              key={step.key}
              className="flex flex-col items-center bg-slate-50 px-2"
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  active
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "bg-white border-gray-300 text-gray-400"
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span
                className={`text-[10px] font-medium mt-1 ${
                  active ? "text-blue-700" : "text-gray-400"
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
