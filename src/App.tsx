import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import ShippingPolicy from "./pages/ShippingPolicy";
import PaymentPolicy from "./pages/PaymentPolicy";
import ReturnPolicy from "./pages/ReturnPolicy";
import About from "./pages/About";
import TrackOrder from "./pages/TrackOrder";
import MyOrders from "./pages/MyOrders";
import MyAddresses from "./pages/MyAddresses";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminProducts from "./pages/admin/Products";
import AdminOrders from "./pages/admin/Orders";
import AdminCategories from "./pages/admin/Categories";
import AdminSettings from "./pages/admin/Settings";
import AdminReviews from "./pages/admin/Reviews";
import AdminStock from "./pages/admin/Stock";
import NotFound from "./pages/NotFound";
import MyAccount from "./pages/MyAccount";
import MobileBottomMenu from "./components/MobileBottomMenu";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter basename="/F4Traders">
      <AuthProvider>
        <CartProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/shipping-policy" element={<ShippingPolicy />} />
              <Route path="/payment-policy" element={<PaymentPolicy />} />
              <Route path="/return-policy" element={<ReturnPolicy />} />
              <Route path="/about" element={<About />} />
              <Route path="/track-order" element={<TrackOrder />} />
              <Route path="/my-orders" element={<MyOrders />} />
              <Route path="/account" element={<MyAccount />} />
              <Route path="/my-addresses" element={<MyAddresses />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="categories" element={<AdminCategories />} />
                <Route path="reviews" element={<AdminReviews />} />
                <Route path="stock" element={<AdminStock />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
            <MobileBottomMenu />
          </TooltipProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
