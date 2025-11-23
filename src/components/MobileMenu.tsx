import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, ChevronDown, User, Phone, Mail, X as XIcon } from "lucide-react";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.jpg";

export function MobileMenu() {
  const { user, isAdmin, signOut } = useAuth();
  const [categories, setCategories] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("display_order");

    setCategories(data || []);
  };

  const handleClose = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>

      <SheetContent
        side="left"
        className="w-[86%] max-w-xs p-0 bg-white h-full overflow-hidden"
      >
        {/* Drawer wrapper: header + scrollable body */}
        <div className="flex flex-col h-full">
          {/* Top header */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div className="text-sm font-medium text-gray-700">
              Hi {user?.user_metadata?.full_name || "Guest"}
            </div>

            <div className="flex-1 flex items-center justify-center">
              {/* Replace src with your dark logo path */}
              <img src={logo} alt="Logo" className="h-9 object-contain" />
            </div>

            {/* <button
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="p-1 rounded-md hover:bg-muted/50"
            >
              <XIcon className="h-5 w-5 text-gray-700" />
            </button> */}
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto">
            {/* Category section */}
            <div className="px-4 py-3 border-b">
              <Button
                onClick={() => setCatOpen(!catOpen)}
                aria-expanded={catOpen}
                className="w-full flex items-center justify-between gap-2 py-2 text-left bg-transparent hover:bg-muted/50 rounded-sm"
              >
                <span className="font-medium text-sm text-gray-800">
                  Category
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-gray-600 transition-transform ${
                    catOpen ? "rotate-180" : ""
                  }`}
                />
              </Button>

              {catOpen && (
                <div className="mt-3 flex flex-col text-sm">
                  {categories.map((c) => (
                    <Link
                      key={c.id}
                      to={`/products?category=${c.slug}`}
                      onClick={handleClose}
                      className="py-2 text-sm text-gray-700 border-b last:border-b-0 hover:text-primary transition-colors"
                    >
                      {c.name}
                    </Link>
                  ))}

                  {categories.length === 0 && (
                    <div className="py-2 text-sm text-muted-foreground">
                      No categories
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Policies and other links */}
            <div className="px-4 py-3 border-b flex flex-col text-sm">
              <Link
                to="/shipping-policy"
                onClick={handleClose}
                className="py-3 border-b text-gray-700"
              >
                Shipping Policy
              </Link>
              <Link
                to="/payment-policy"
                onClick={handleClose}
                className="py-3 border-b text-gray-700"
              >
                Payment Policy
              </Link>
              <Link
                to="/return-policy"
                onClick={handleClose}
                className="py-3 border-b text-gray-700"
              >
                Return and Refund Policy
              </Link>
              <Link
                to="/about"
                onClick={handleClose}
                className="py-3 border-b text-gray-700"
              >
                About Us
              </Link>
              <a
                href="https://www.instagram.com/f4tradersofficial/"
                target="_blank"
                rel="noopener noreferrer"
                className="py-3 text-gray-700"
                onClick={handleClose}
              >
                Follow F4traders on Instagram !!
              </a>
            </div>

            {/* Auth-related / Account links */}
            <div className="px-4 py-3 flex flex-col text-sm space-y-2">
              {user ? (
                <>
                  <Link
                    to="/my-orders"
                    onClick={handleClose}
                    className="py-2 text-gray-700 border-b"
                  >
                    My Orders
                  </Link>
                  <Link
                    to="/my-addresses"
                    onClick={handleClose}
                    className="py-2 text-gray-700 border-b"
                  >
                    My Addresses
                  </Link>
                  <Link
                    to="/track-order"
                    onClick={handleClose}
                    className="py-2 text-gray-700 border-b"
                  >
                    Track Order
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={handleClose}
                      className="py-2 text-gray-700 border-b"
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      signOut();
                      handleClose();
                    }}
                    className="py-2 text-left text-red-600 font-medium"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  to="/auth"
                  onClick={handleClose}
                  className="py-2 text-gray-700"
                >
                  Sign In / Sign Up
                </Link>
              )}
            </div>

            {/* optional extra spacing so bottom bar doesn't overlap content */}
            <div className="h-24" />
          </div>

          {/* Bottom sticky bar */}
          <div className="sticky bottom-0 left-0 right-0 bg-white border-t">
            <div className="flex items-center justify-around py-3">
              <a
                href="tel:+919043713490"
                className="flex flex-col items-center text-xs text-gray-700"
              >
                <div className="rounded-full p-2 bg-muted/20">
                  <Phone className="h-5 w-5" />
                </div>
                <span className="mt-1">Contact</span>
              </a>

              <a
                href="mailto:f4tradersofficial@gmail.com"
                className="flex flex-col items-center text-xs text-gray-700"
              >
                <div className="rounded-full p-2 bg-muted/20">
                  <Mail className="h-5 w-5" />
                </div>
                <span className="mt-1">Email</span>
              </a>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
