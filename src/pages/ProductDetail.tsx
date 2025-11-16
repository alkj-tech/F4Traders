import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { Badge } from '@/components/ui/badge';
import { ProductReviews } from '@/components/ProductReviews';
import { Heart, Star, Share2, Facebook, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState(0);
  const { addToCart } = useCart();

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    const { data } = await supabase
      .from('products')
      .select('*, category:categories(*)')
      .eq('id', id)
      .single();

    setProduct(data);
    const productSizes = data?.sizes as string[] | null;
    if (productSizes && Array.isArray(productSizes) && productSizes.length > 0) {
      setSelectedSize(productSizes[0]);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p>Loading...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p>Product not found</p>
        </main>
        <Footer />
      </div>
    );
  }

  const images = product.images || [];
  const sizes = (product.sizes as string[]) || [];
  const finalPrice = product.price_inr * (1 - product.discount_percent / 100);

  const handleAddToCart = () => {
    if (!selectedSize && sizes.length > 0) {
      toast.error('Please select a size');
      return;
    }
    addToCart(product.id, 1, selectedSize);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    setTimeout(() => navigate('/cart'), 300);
  };

  const shareProduct = (platform: string) => {
    const url = window.location.href;
    const text = `Check out ${product.title}`;
    
    if (platform === 'whatsapp') {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
    } else if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6 lg:py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-[500px_1fr] gap-6 lg:gap-12">
          {/* Left: Image Gallery */}
          <div className="flex gap-3">
            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex flex-col gap-2">
                {images.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`w-16 h-16 lg:w-20 lg:h-20 rounded-md overflow-hidden border-2 transition-all ${
                      selectedImage === idx
                        ? 'border-foreground'
                        : 'border-border hover:border-muted-foreground'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${product.title} ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Main image */}
            <div className="flex-1 rounded-md overflow-hidden bg-background">
              <img
                src={images[selectedImage] || '/placeholder.svg'}
                alt={product.title}
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Right: Product Info */}
          <div className="space-y-4">
            {/* Title */}
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">{product.title}</h1>
            
            {/* Rating */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-green-600 text-white px-2 py-0.5 rounded text-sm font-semibold">
                <span>5.0</span>
                <Star className="w-3 h-3 fill-white" />
              </div>
              <span className="text-sm text-muted-foreground">Ratings</span>
            </div>

            {/* Price */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-2xl lg:text-3xl font-bold">₹ {finalPrice.toFixed(0)}</span>
              {product.discount_percent > 0 && (
                <>
                  <span className="text-lg lg:text-xl text-muted-foreground line-through">
                    ₹ {product.price_inr.toFixed(0)}
                  </span>
                  <Badge className="bg-[hsl(var(--accent))] text-white text-sm font-semibold">
                    {product.discount_percent}%
                  </Badge>
                </>
              )}
            </div>

            {/* Share buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => shareProduct('whatsapp')}
                className="p-2.5 rounded-full hover:bg-muted transition-colors"
                title="Share on WhatsApp"
              >
                <MessageCircle className="w-5 h-5 text-[#25D366]" />
              </button>
              <button
                onClick={() => shareProduct('facebook')}
                className="p-2.5 rounded-full hover:bg-muted transition-colors"
                title="Share on Facebook"
              >
                <Facebook className="w-5 h-5 text-[#1877F2]" />
              </button>
            </div>

            <hr className="my-4" />

            {/* Size Selection */}
            {sizes.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-medium">
                  Size: <span className="font-semibold">{selectedSize}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((size: string) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`min-w-[70px] px-4 py-2 border rounded-md font-medium transition-all text-sm ${
                        selectedSize === size
                          ? 'border-foreground bg-foreground text-background'
                          : 'border-border hover:border-foreground'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <hr className="my-4" />

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleAddToCart}
                variant="outline"
                size="lg"
                className="flex-1 border-2 border-foreground text-foreground hover:bg-foreground hover:text-background font-semibold"
              >
                Add
              </Button>
              <Button 
                onClick={handleBuyNow} 
                size="lg" 
                className="flex-1 bg-[hsl(var(--accent))] hover:bg-[hsl(var(--accent))]/90 text-white font-semibold"
              >
                Buy Now
              </Button>
            </div>

            {/* Delivery Info */}
            <div className="border rounded-md p-4">
              <h3 className="font-semibold mb-2 text-sm">Delivery Options</h3>
              <div className="flex items-start gap-2 text-sm">
                <input 
                  type="text" 
                  placeholder="Enter your pincode" 
                  className="flex-1 px-3 py-2 border rounded-md text-sm"
                />
                <Button variant="outline" size="sm" className="font-semibold">
                  Check
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-3 flex items-center gap-2">
                <span className="text-xl">🚚</span>
                Get delivery at your doorstep
              </p>
            </div>

            <hr className="my-4" />

            {/* Product Specifications */}
            {product.brand && (
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="font-semibold">Upper body</span> : Synthetic leather, PU, Suede leather
                </div>
                <div className="text-sm">
                  <span className="font-semibold">Lower body</span> : TPR (Thermoplastic Rubber)
                </div>
                <div className="text-sm">
                  <span className="font-semibold">Closure</span> : Lace-ups
                </div>
              </div>
            )}

            <hr className="my-4" />

            {/* Description */}
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Description :</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {product.description || `The ${product.title} is a fresh addition to the iconic New Balance 550 series. Featuring a clean, minimal design with a stylish grey and black colorway, it offers great versatility for everyday wear. Known for its affordable price point, this sneaker doesn't compromise on quality. The build includes premium leather and suede details, delivering a sleek yet durable look. With decent comfort and a timeless aesthetic, it's a solid pick for both casual and streetwear styles.`}
              </p>
            </div>

            {/* Care Instructions */}
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Care Instructions</h3>
              <p className="text-sm text-muted-foreground">
                Clean with less wet cloth, Don't wash in washing
              </p>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-12 border-t pt-8">
          <ProductReviews productId={id!} />
        </div>

        {/* Related Products */}
        <RelatedProducts 
          categoryId={product.category_id} 
          currentProductId={product.id} 
        />
      </main>
      <Footer />
    </div>
  );
}

// Related Products Component
function RelatedProducts({ categoryId, currentProductId }: { categoryId: string | null, currentProductId: string }) {
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);

  useEffect(() => {
    if (categoryId) {
      fetchRelatedProducts();
    }
  }, [categoryId]);

  const fetchRelatedProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('category_id', categoryId)
      .eq('is_active', true)
      .neq('id', currentProductId)
      .limit(4);
    
    setRelatedProducts(data || []);
  };

  if (relatedProducts.length === 0) return null;

  return (
    <section className="container py-16">
      <h2 className="text-2xl font-bold mb-8">Related Products</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {relatedProducts.map((product) => {
          const images = Array.isArray(product.images) ? product.images : [];
          const finalPrice = product.price_inr * (1 - (product.discount_percent || 0) / 100);
          
          return (
            <Link key={product.id} to={`/products/${product.id}`} className="group">
              <div className="bg-card rounded-lg overflow-hidden border hover:shadow-lg transition-shadow">
                <div className="aspect-square overflow-hidden bg-muted">
                  <img
                    src={images[0] || '/placeholder.svg'}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-4 space-y-2">
                  <h3 className="font-semibold line-clamp-1">{product.title}</h3>
                  {product.brand && (
                    <p className="text-sm text-muted-foreground">{product.brand}</p>
                  )}
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold">₹{finalPrice.toFixed(0)}</span>
                    {product.discount_percent > 0 && (
                      <span className="text-sm text-muted-foreground line-through">
                        ₹{product.price_inr}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
