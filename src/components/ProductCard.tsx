import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';

interface ProductCardProps {
  product: any;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const images = product.images || [];
  const finalPrice = product.price_inr * (1 - product.discount_percent / 100);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart(product.id, 1);
  };

  return (
    <Link to={`/products/${product.id}`}>
      <Card className="group hover:shadow-xl transition-all duration-300 overflow-hidden h-full">
        <div className="aspect-square overflow-hidden bg-muted">
          <img
            src={images[0] || '/placeholder.svg'}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
        </div>
        <CardContent className="p-4">
          {product.brand && (
            <p className="text-sm text-muted-foreground mb-1">{product.brand}</p>
          )}
          <h3 className="font-semibold mb-2 line-clamp-2">{product.title}</h3>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-primary">₹{finalPrice.toFixed(2)}</span>
            {product.discount_percent > 0 && (
              <>
                <span className="text-sm text-muted-foreground line-through">
                  ₹{product.price_inr.toFixed(2)}
                </span>
                <Badge variant="destructive" className="text-xs">
                  {product.discount_percent}% OFF
                </Badge>
              </>
            )}
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0">
          <Button
            variant="cart"
            size="sm"
            className="w-full"
            onClick={handleQuickAdd}
            disabled={product.stock === 0}
          >
            {product.stock === 0 ? 'Out of Stock' : 'Quick Add'}
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}
