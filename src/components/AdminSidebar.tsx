import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
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

interface AdminSidebarProps {
  onNavigate?: () => void; // Optional prop to close mobile menu on click
}

export function AdminSidebar({ onNavigate }: AdminSidebarProps) {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <nav className="flex flex-col gap-2 py-4">
      {navItems.map((item) => {
        const Icon = item.icon;
        // Exact match for dashboard, startsWith for others to keep active state on sub-pages
        const isActive =
          item.path === "/admin"
            ? currentPath === "/admin"
            : currentPath.startsWith(item.path);

        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={onNavigate} // Close menu when clicked (if on mobile)
            className={cn(
              "flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all rounded-md mx-2",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-5 w-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
