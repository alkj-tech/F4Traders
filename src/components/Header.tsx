import { ShoppingCart, User, Search, ChevronDown } from "lucide-react";
import { Button } from "./ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { Badge } from "./ui/badge";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";

export function Header() {
  const { user, isAdmin, signOut } = useAuth();
  const { itemCount } = useCart();
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b">
      <div className="container mx-auto px-4">
        {/* Logo Section */}
        <div className="flex h-20 items-center justify-between">
          <div className="flex-1" />
          
          <Link to="/" className="flex items-center justify-center">
            <span className="text-4xl font-black tracking-tight" style={{ fontFamily: 'Arial Black, sans-serif' }}>
              7<span className="block text-center -mt-2">KICKS.</span>
            </span>
          </Link>

          <div className="flex-1 flex items-center justify-end space-x-4">
            <Button variant="ghost" size="icon" onClick={() => setSearchOpen(!searchOpen)}>
              <Search className="h-6 w-6" />
            </Button>
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="h-6 w-6" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to="/track-order">Track Order</Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin">Admin Dashboard</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={signOut}>Sign Out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/auth">
                <Button variant="ghost" size="icon">
                  <User className="h-6 w-6" />
                </Button>
              </Link>
            )}
            
            <Link to="/cart">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-6 w-6" />
                {itemCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                    {itemCount}
                  </Badge>
                )}
              </Button>
            </Link>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="border-t py-3">
          <div className="flex items-center justify-center space-x-8 text-sm">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center space-x-1 hover:text-primary transition-colors">
                <span>Category</span>
                <ChevronDown className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem asChild>
                  <Link to="/products">All Products</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/products?category=travis-scott">Travis Scott</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/products?category=low-dunks">Low Dunks</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/products?category=retro-4">Retro 4</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/products?category=air-jordans">Air Jordan's</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/products?category=air-forces">Air Force's</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Link to="/shipping-policy" className="hover:text-primary transition-colors">
              Shipping Policy
            </Link>
            <Link to="/payment-policy" className="hover:text-primary transition-colors">
              Payment Policy
            </Link>
            <Link to="/return-policy" className="hover:text-primary transition-colors">
              Return and Refund Policy
            </Link>
            <Link to="/about" className="hover:text-primary transition-colors">
              About Us
            </Link>
            <a 
              href="https://instagram.com/7kicks" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              Follow 7Kicks on Instagram !!
            </a>
          </div>
        </nav>
      </div>
    </header>
  );
}
