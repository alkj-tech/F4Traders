import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, User, ShoppingCart, Search } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";

export function MobileMenu() {
  const { user, isAdmin, signOut } = useAuth();
  const { itemCount } = useCart();
  const [categories, setCategories] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order');
    
    setCategories(data || []);
  };

  const handleLinkClick = () => {
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[400px]">
        <nav className="flex flex-col gap-4 mt-8">
          <Link 
            to="/products" 
            className="text-lg font-medium hover:text-primary transition-colors"
            onClick={handleLinkClick}
          >
            All Products
          </Link>
          
          <div className="border-t pt-4">
            <p className="text-sm font-semibold text-muted-foreground mb-2">Categories</p>
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/products?category=${category.slug}`}
                className="block py-2 text-base hover:text-primary transition-colors"
                onClick={handleLinkClick}
              >
                {category.name}
              </Link>
            ))}
          </div>

          <div className="border-t pt-4">
            <Link 
              to="/shipping-policy" 
              className="block py-2 text-base hover:text-primary transition-colors"
              onClick={handleLinkClick}
            >
              Shipping Policy
            </Link>
            <Link 
              to="/payment-policy" 
              className="block py-2 text-base hover:text-primary transition-colors"
              onClick={handleLinkClick}
            >
              Payment Policy
            </Link>
            <Link 
              to="/return-policy" 
              className="block py-2 text-base hover:text-primary transition-colors"
              onClick={handleLinkClick}
            >
              Return and Refund Policy
            </Link>
            <Link 
              to="/about" 
              className="block py-2 text-base hover:text-primary transition-colors"
              onClick={handleLinkClick}
            >
              About Us
            </Link>
          </div>

          {user && (
            <div className="border-t pt-4">
              <Link 
                to="/my-orders" 
                className="block py-2 text-base hover:text-primary transition-colors"
                onClick={handleLinkClick}
              >
                My Orders
              </Link>
              <Link 
                to="/my-addresses" 
                className="block py-2 text-base hover:text-primary transition-colors"
                onClick={handleLinkClick}
              >
                My Addresses
              </Link>
              <Link 
                to="/track-order" 
                className="block py-2 text-base hover:text-primary transition-colors"
                onClick={handleLinkClick}
              >
                Track Order
              </Link>
              {isAdmin && (
                <Link 
                  to="/admin" 
                  className="block py-2 text-base hover:text-primary transition-colors"
                  onClick={handleLinkClick}
                >
                  Admin Dashboard
                </Link>
              )}
              <Button 
                variant="ghost" 
                className="w-full justify-start p-2 h-auto text-base"
                onClick={() => {
                  signOut();
                  handleLinkClick();
                }}
              >
                Sign Out
              </Button>
            </div>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
