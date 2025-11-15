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
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left: Image Gallery */}
          <div className="space-y-4">
            {/* Thumbnail sidebar + Main image */}
            <div className="flex gap-4">
              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex flex-col gap-3 w-20">
                  {images.slice(0, 4).map((img: string, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImage === idx
                          ? 'border-primary ring-2 ring-primary ring-offset-2'
                          : 'border-border hover:border-primary/50'
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
              <div className="flex-1 aspect-square rounded-lg overflow-hidden bg-muted">
                <img
                  src={images[selectedImage] || '/placeholder.svg'}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Right: Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-3">{product.title}</h1>
              
              {/* Rating */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-1 bg-green-600 text-white px-2 py-1 rounded">
                  <span className="font-semibold">4.9</span>
                  <Star className="w-3 h-3 fill-white" />
                </div>
                <span className="text-sm text-muted-foreground">Ratings</span>
              </div>

              {/* Price */}
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl font-bold">₹{finalPrice.toFixed(0)}</span>
                {product.discount_percent > 0 && (
                  <>
                    <span className="text-xl text-muted-foreground line-through">
                      ₹{product.price_inr.toFixed(0)}
                    </span>
                    <Badge variant="destructive" className="text-sm">
                      {product.discount_percent}%
                    </Badge>
                  </>
                )}
              </div>

              {/* Share buttons */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => shareProduct('whatsapp')}
                  className="p-2 rounded-full border hover:bg-muted transition-colors"
                  title="Share on WhatsApp"
                >
                  <MessageCircle className="w-5 h-5 text-green-600" />
                </button>
                <button
                  onClick={() => shareProduct('facebook')}
                  className="p-2 rounded-full border hover:bg-muted transition-colors"
                  title="Share on Facebook"
                >
                  <Facebook className="w-5 h-5 text-blue-600" />
                </button>
              </div>
            </div>

            <hr />

            {/* Size Selection */}
            {sizes.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold">
                  Size: <span className="text-primary">{selectedSize}</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((size: string) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-2 border-2 rounded-lg font-medium transition-all ${
                        selectedSize === size
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border hover:border-primary'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <hr />

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleAddToCart}
                variant="outline"
                size="lg"
                className="flex-1 border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              >
                Add
              </Button>
              <Button onClick={handleBuyNow} size="lg" className="flex-1">
                Buy Now
              </Button>
            </div>

            {/* Delivery Info */}
            <div className="border rounded-lg p-4 space-y-2">
              <h3 className="font-semibold">Delivery Options</h3>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <span className="text-2xl">🚚</span>
                Get delivery at your doorstep
              </p>
            </div>

            {/* Product Details */}
            {product.brand && (
              <div className="space-y-2">
                <h3 className="font-semibold">Product Details</h3>
                <div className="text-sm space-y-1">
                  <p>
                    <span className="font-medium">Brand:</span> {product.brand}
                  </p>
                  {product.category && (
                    <p>
                      <span className="font-medium">Category:</span>{' '}
                      {product.category.name}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Description */}
            {product.description && (
              <div className="space-y-2">
                <h3 className="font-semibold">Description:</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-12">
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
