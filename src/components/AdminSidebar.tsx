import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Settings,
  FolderTree,
  Star,
  Package2,
} from "lucide-react";

const navItems = [
  { path: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/admin/products", icon: Package, label: "Products" },
  { path: "/admin/categories", icon: FolderTree, label: "Categories" },
  { path: "/admin/orders", icon: ShoppingCart, label: "Orders" },
  { path: "/admin/reviews", icon: Star, label: "Reviews" },
  { path: "/admin/stock", icon: Package2, label: "Stock" },
  { path: "/admin/settings", icon: Settings, label: "Settings" },
];

export function AdminSidebar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const currentPath = location.pathname;

  const renderNav = (isMobile = false) => (
    <nav className={`flex flex-col gap-1 ${isMobile ? "mt-6" : ""}`}>
      {navItems.map((item) => {
        const Icon = item.icon;

        const isActive =
          currentPath === item.path ||
          (item.path !== "/admin" && currentPath.startsWith(item.path));

        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => isMobile && setOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all 
              ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-gray-700 hover:bg-gray-100"
              }
            `}
          >
            <Icon className="h-5 w-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* ---------- Mobile Top Menu Trigger ---------- */}
      <div className="lg:hidden p-3">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="rounded-xl">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>

          {/* Mobile Drawer */}
          <SheetContent side="left" className="w-[260px] sm:w-[300px] p-5">
            <h2 className="text-lg font-semibold mb-3">Admin Panel</h2>
            {renderNav(true)}
          </SheetContent>
        </Sheet>
      </div>

      {/* ---------- Desktop Sidebar ---------- */}
      <aside className="hidden lg:flex lg:flex-col lg:w-[260px] bg-white border-r shadow-sm py-6 px-4">
        <h2 className="text-xl font-semibold px-2 mb-5">Admin Panel</h2>
        {renderNav(false)}
      </aside>
    </>
  );
}
