import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SearchDialogProps {
  open: boolean;
  onClose: () => void;
}

export function SearchDialog({ open, onClose }: SearchDialogProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (query.length > 1) {
      searchProducts();
    } else {
      setResults([]);
    }
  }, [query]);

  const searchProducts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('products')
      .select('*, category:categories(*)')
      .eq('is_active', true)
      .or(`title.ilike.%${query}%,brand.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(5);

    setResults(data || []);
    setLoading(false);
  };

  const handleResultClick = (productId: string) => {
    navigate(`/products/${productId}`);
    onClose();
    setQuery('');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] p-0">
        <div className="relative">
          <Search className="absolute left-4 top-4 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-12 pr-12 h-14 text-base border-0 focus-visible:ring-0"
            autoFocus
          />
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {query.length > 1 && (
          <div className="max-h-[400px] overflow-y-auto border-t">
            {loading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Searching...
              </div>
            ) : results.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No products found for "{query}"
              </div>
            ) : (
              <div className="py-2">
                {results.map((product) => {
                  const images = product.images || [];
                  const finalPrice = product.price_inr * (1 - product.discount_percent / 100);

                  return (
                    <button
                      key={product.id}
                      onClick={() => handleResultClick(product.id)}
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
                          <span className="font-bold text-primary">
                            ₹{finalPrice.toFixed(2)}
                          </span>
                          {product.discount_percent > 0 && (
                            <span className="text-sm text-muted-foreground line-through">
                              ₹{product.price_inr.toFixed(2)}
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
      </DialogContent>
    </Dialog>
  );
}
