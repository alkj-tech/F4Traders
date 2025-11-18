import { Home, ShoppingBag, ShoppingCart, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";

export default function MobileBottomMenu() {
  const location = useLocation();
  const { itemCount } = useCart(); // Updated: using itemCount

  const navItems = [
    { label: "Home", icon: Home, path: "/" },
    { label: "Orders", icon: ShoppingBag, path: "/my-orders" },
    { label: "Cart", icon: ShoppingCart, path: "/cart" },
    { label: "Account", icon: User, path: "/account" }, // Make sure page exists
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50 md:hidden">
      <div className="flex justify-between items-center px-4 py-2">
        {navItems.map(({ label, icon: Icon, path }) => {
          const active = location.pathname === path;

          return (
            <Link
              key={path}
              to={path}
              className="flex flex-col items-center flex-1 relative"
            >
              {/* ICON */}
              <Icon
                className={`h-6 w-6 transition-all ${
                  active ? "text-black scale-110" : "text-gray-600"
                }`}
              />

              {/* CART BADGE */}
              {label === "Cart" && itemCount > 0 && (
                <span className="absolute -top-1 right-5 bg-black text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
                  {itemCount}
                </span>
              )}

              {/* LABEL */}
              <span
                className={`text-[11px] mt-1 ${
                  active ? "text-black font-semibold" : "text-gray-700"
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
