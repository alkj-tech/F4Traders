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
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order');
    
    setCategories(data || []);
  };

  const searchProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*, category:categories(*)')
      .eq('is_active', true)
      .or(`title.ilike.%${searchQuery}%,brand.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
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
      {/* Top announcement bar */}
      <div className="bg-black text-white text-center py-2 text-sm">
        Cash on delivery and 3 Days easy replacement available
      </div>

      <header className="sticky top-0 z-50 w-full bg-white border-b">
        <div className="container mx-auto px-4 sm:px-6">
          {/* Main header with logo and icons */}
          <div className="flex h-16 sm:h-20 items-center justify-between">
            <div className="flex-1" />
            
            <Link to="/" className="flex items-center justify-center">
              <span className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight" style={{ fontFamily: 'Arial Black, sans-serif' }}>
                7<span className="block text-center -mt-1 sm:-mt-2">KICKS.</span>
              </span>
            </Link>

            <div className="flex-1 flex items-center justify-end gap-4">
              <Button 
                variant="ghost" 
                size="icon"
                className="h-9 w-9 sm:h-10 sm:w-10"
                onClick={() => setSearchOpen(!searchOpen)}
              >
                <Search className="h-5 w-5 sm:h-6 sm:w-6" />
              </Button>
              
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-10 sm:w-10">
                      <User className="h-5 w-5 sm:h-6 sm:w-6" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link to="/my-orders">My Orders</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/my-addresses">My Addresses</Link>
                    </DropdownMenuItem>
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
                  <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-10 sm:w-10">
                    <User className="h-5 w-5 sm:h-6 sm:w-6" />
                  </Button>
                </Link>
              )}
              
              <Link to="/cart" className="relative">
                <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-10 sm:w-10">
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
          <nav className="border-t py-3 sm:py-4 overflow-x-auto">
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
              
              <Link to="/shipping-policy" className="hover:text-primary transition-colors whitespace-nowrap">
                Shipping Policy
              </Link>
              <Link to="/payment-policy" className="hover:text-primary transition-colors whitespace-nowrap">
                Payment Policy
              </Link>
              <Link to="/return-policy" className="hover:text-primary transition-colors whitespace-nowrap">
                Return and Refund Policy
              </Link>
              <Link to="/about" className="hover:text-primary transition-colors whitespace-nowrap">
                About Us
              </Link>
              <a 
                href="https://instagram.com/7kicks" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors whitespace-nowrap"
              >
                Follow 7Kicks on Instagram !!
              </a>
            </div>
          </nav>
        </div>

        {/* Search overlay */}
        {searchOpen && (
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setSearchOpen(false)}>
            <div className="bg-white max-w-2xl mx-auto mt-4" onClick={(e) => e.stopPropagation()}>
              <div className="relative border-b">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search for a product"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-12 h-14 text-base border-0 focus-visible:ring-0"
                  autoFocus
                />
                <button
                  onClick={() => {
                    setSearchOpen(false);
                    setSearchQuery("");
                    setSearchResults([]);
                  }}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {searchQuery.length > 1 && (
                <div className="max-h-96 overflow-y-auto">
                  {searchResults.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No products found for "{searchQuery}"
                    </div>
                  ) : (
                    <div className="py-2">
                      {searchResults.map((product) => {
                        const images = product.images || [];
                        const finalPrice = product.price_inr * (1 - product.discount_percent / 100);

                        return (
                          <button
                            key={product.id}
                            onClick={() => handleSearchResultClick(product.id)}
                            className="w-full flex items-center gap-4 p-3 hover:bg-muted transition-colors text-left"
                          >
                            <img
                              src={images[0] || '/placeholder.svg'}
                              alt={product.title}
                              className="w-16 h-16 object-cover rounded"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium truncate">{product.title}</h4>
                              <p className="text-sm text-muted-foreground truncate">
                                {product.category?.name || 'Uncategorized'}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="font-bold">
                                  ₹{finalPrice.toFixed(0)}
                                </span>
                                {product.discount_percent > 0 && (
                                  <span className="text-sm text-muted-foreground line-through">
                                    ₹{product.price_inr.toFixed(0)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
}
