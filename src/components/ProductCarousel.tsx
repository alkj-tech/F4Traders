import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { Link } from 'react-router-dom';
import { Button } from './ui/button';

export function ProductCarousel() {
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .eq('is_featured', true)
      .limit(5);
    
    setProducts(data || []);
  };

  if (products.length === 0) return null;

  return (
    <section className="w-full">
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        plugins={[
          Autoplay({
            delay: 4000,
          }),
        ]}
        className="w-full"
      >
        <CarouselContent>
          {products.map((product) => {
            const images = Array.isArray(product.images) ? product.images : [];
            const finalPrice = product.price_inr * (1 - (product.discount_percent || 0) / 100);
            
            return (
              <CarouselItem key={product.id}>
                <div className="relative h-[400px] md:h-[600px] w-full overflow-hidden">
                  <div 
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                      backgroundImage: `url(${images[0] || '/placeholder.svg'})`,
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
                  </div>
                  
                  <div className="container relative h-full flex items-center">
                    <div className="max-w-2xl space-y-6">
                      <div className="inline-block">
                        <span className="text-accent text-sm font-semibold uppercase tracking-wider">
                          {product.brand || 'Featured'}
                        </span>
                      </div>
                      <h2 className="text-4xl md:text-6xl font-bold text-white leading-tight">
                        {product.title}
                      </h2>
                      <p className="text-lg md:text-xl text-gray-200 line-clamp-2">
                        {product.description || 'Premium quality footwear'}
                      </p>
                      <div className="flex items-baseline gap-3">
                        <span className="text-3xl md:text-4xl font-bold text-white">
                          ₹{finalPrice.toFixed(0)}
                        </span>
                        {product.discount_percent > 0 && (
                          <>
                            <span className="text-xl text-gray-400 line-through">
                              ₹{product.price_inr}
                            </span>
                            <span className="text-accent font-semibold">
                              {product.discount_percent}% OFF
                            </span>
                          </>
                        )}
                      </div>
                      <div className="flex gap-4">
                        <Link to={`/products/${product.id}`}>
                          <Button variant="hero" size="lg">
                            Shop Now
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            );
          })}
        </CarouselContent>
        <CarouselPrevious className="left-4" />
        <CarouselNext className="right-4" />
      </Carousel>
    </section>
  );
}
