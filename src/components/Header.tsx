import { ShoppingCart, User, Search, X } from "lucide-react";
import { Button } from "./ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { Badge } from "./ui/badge";
import { Link, useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "./ui/input";
import { MobileMenu } from "./MobileMenu";

export function Header() {
  const { user, isAdmin, signOut } = useAuth();
  const { itemCount } = useCart();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (searchQuery.length > 1) {
      searchProducts();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("display_order");

    setCategories(data || []);
  };

  const searchProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("*, category:categories(*)")
      .eq("is_active", true)
      .or(
        `title.ilike.%${searchQuery}%,brand.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`
      )
      .limit(5);

    setSearchResults(data || []);
  };

  const handleSearchResultClick = (productId: string) => {
    navigate(`/products/${productId}`);
    setSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-white border-b">
        <div className="container mx-auto px-4 sm:px-6">
          {/* Main header */}
          <div className="flex h-16 sm:h-20 items-center justify-between">
            {/* Left */}
            <div className="flex-1 flex items-center gap-2">
              <MobileMenu />
            </div>

            {/* Center Logo */}
            {!searchOpen && (
              <Link to="/" className="flex items-center justify-center">
                <span
                  className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight"
                  style={{ fontFamily: "Arial Black, sans-serif" }}
                >
                  F4
                  <span className="block text-center -mt-1 sm:-mt-2">
                    Traders.
                  </span>
                </span>
              </Link>
            )}

            {/* Right Icons */}
            <div className="flex-1 flex items-center justify-end gap-2 sm:gap-4">
              {/* INLINE SEARCH BAR */}
              <div className="relative flex items-center">
                {!searchOpen && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSearchOpen(true)}
                    className="transition-all duration-300"
                  >
                    <Search className="h-5 w-5" />
                  </Button>
                )}

                {searchOpen && (
                  <div className="flex items-center gap-2 w-[220px] sm:w-[300px] transition-all duration-300">
                    <Search className="h-5 w-5 text-muted-foreground" />

                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search for a product"
                      className="h-10 w-full text-sm"
                      autoFocus
                    />

                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setSearchOpen(false);
                        setSearchQuery("");
                        setSearchResults([]);
                      }}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                )}
              </div>

              {/* USER ICON */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 sm:h-10 sm:w-10"
                    >
                      <User className="h-5 w-5 sm:h-6 sm:w-6" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link to="/my-orders">My Orders</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/account">My Account</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/track-order">Track Order</Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin">Admin Dashboard</Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={signOut}>
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link to="/auth">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 sm:h-10 sm:w-10"
                  >
                    <User className="h-5 w-5 sm:h-6 sm:w-6" />
                  </Button>
                </Link>
              )}

              {/* CART ICON */}
              <Link to="/cart" className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 sm:h-10 sm:w-10"
                >
                  <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6" />
                  {itemCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center p-0 text-[10px] sm:text-xs">
                      {itemCount}
                    </Badge>
                  )}
                </Button>
              </Link>
            </div>
          </div>

          {/* Navigation menu */}
          <nav className="hidden lg:block border-t py-3 sm:py-4 overflow-x-auto">
            <div className="flex items-center justify-center gap-4 sm:gap-6 lg:gap-8 text-xs sm:text-sm min-w-max px-4">
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1 hover:text-primary transition-colors whitespace-nowrap">
                  <span>Category</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem asChild>
                    <Link to="/products">All Products</Link>
                  </DropdownMenuItem>
                  {categories.map((category) => (
                    <DropdownMenuItem key={category.id} asChild>
                      <Link to={`/products?category=${category.slug}`}>
                        {category.name}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Link to="/shipping-policy" className="hover:text-primary">
                Shipping Policy
              </Link>
              <Link to="/payment-policy" className="hover:text-primary">
                Payment Policy
              </Link>
              <Link to="/return-policy" className="hover:text-primary">
                Return & Refund Policy
              </Link>
              <Link to="/about" className="hover:text-primary">
                About Us
              </Link>
              <a
                href="https://www.instagram.com/f4tradersofficial/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary whitespace-nowrap"
              >
                Follow F4Traders on Instagram !!
              </a>
            </div>
          </nav>
        </div>

        {/* INLINE SEARCH RESULTS DROPDOWN */}
        {searchOpen && searchQuery.length > 1 && (
          <div className="absolute left-0 right-0 bg-white shadow-md border z-40 max-w-xl mx-auto mt-2 p-2 rounded">
            {searchResults.length === 0 ? (
              <p className="text-sm p-2 text-muted-foreground">
                No results for "{searchQuery}"
              </p>
            ) : (
              searchResults.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleSearchResultClick(product.id)}
                  className="flex w-full items-center gap-3 p-2 hover:bg-muted rounded transition"
                >
                  <img
                    src={product.images?.[0] || "/placeholder.svg"}
                    alt={product.title || "Product image"}
                    className="w-12 h-12 rounded object-cover"
                  />
                  <div className="text-left">
                    <p className="font-medium text-sm">{product.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {product.category?.name}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </header>
    </>
  );
}
