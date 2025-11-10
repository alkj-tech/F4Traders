import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Heart } from "lucide-react";

// Demo products - will be replaced with real data
const demoProducts = [
  {
    id: "1",
    title: "Premium Running Shoes",
    brand: "Nike",
    price: 5999,
    originalPrice: 7999,
    discount: 25,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop",
    featured: true,
  },
  {
    id: "2",
    title: "Classic White Sneakers",
    brand: "Adidas",
    price: 4499,
    originalPrice: 5499,
    discount: 18,
    image: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=400&h=400&fit=crop",
    featured: true,
  },
  {
    id: "3",
    title: "Casual Canvas Shoes",
    brand: "Puma",
    price: 3299,
    originalPrice: 4299,
    discount: 23,
    image: "https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=400&h=400&fit=crop",
    featured: true,
  },
  {
    id: "4",
    title: "Sports Training Shoes",
    brand: "Reebok",
    price: 4999,
    originalPrice: 6499,
    discount: 23,
    image: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&h=400&fit=crop",
    featured: true,
  },
];

export function FeaturedProducts() {
  return (
    <section className="py-16 md:py-24 bg-secondary/30">
      <div className="container">
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold">Featured Products</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Handpicked collection of our best sellers
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {demoProducts.map((product, index) => (
            <Card 
              key={product.id} 
              className="group overflow-hidden hover:shadow-xl transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="relative overflow-hidden">
                {product.discount > 0 && (
                  <Badge className="absolute top-4 left-4 z-10 bg-accent text-accent-foreground">
                    {product.discount}% OFF
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4 z-10 bg-white/80 backdrop-blur-sm hover:bg-white"
                >
                  <Heart className="h-5 w-5" />
                </Button>
                <div className="aspect-square overflow-hidden bg-secondary">
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
              </div>
              <CardContent className="p-4 space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  {product.brand}
                </p>
                <h3 className="font-semibold line-clamp-2 group-hover:text-accent transition-colors">
                  {product.title}
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold">₹{product.price.toLocaleString('en-IN')}</span>
                  {product.discount > 0 && (
                    <span className="text-sm text-muted-foreground line-through">
                      ₹{product.originalPrice.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
              </CardContent>
              <CardFooter className="p-4 pt-0">
                <Button variant="cart" className="w-full group">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Add to Cart
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button variant="outline" size="lg">
            View All Products
          </Button>
        </div>
      </div>
    </section>
  );
}
