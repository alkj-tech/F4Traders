import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { Badge } from "@/components/ui/badge";
import { ProductReviews } from "@/components/ProductReviews";
import {
  Heart,
  Star,
  Share2,
  Facebook,
  MessageCircle,
  Truck,
  MapPin,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Selection State
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedImage, setSelectedImage] = useState(0);

  // Stock State
  const [currentStock, setCurrentStock] = useState<number | null>(null);

  // Delivery State
  const [pincode, setPincode] = useState("");
  const [deliveryStatus, setDeliveryStatus] = useState<{
    type: "idle" | "success" | "error";
    message: string;
  }>({ type: "idle", message: "" });

  const { addToCart } = useCart();

  useEffect(() => {
    fetchProduct();
  }, [id]);

  // --- Stock Calculation Logic ---
  useEffect(() => {
    if (product) {
      // 1. If user has selected both Size and Color, check specific variant stock
      if (selectedSize && selectedColor) {
        const stock = getVariantStock(selectedSize, selectedColor);
        setCurrentStock(stock);
      }
      // 2. If product has no variants (simple product), use global stock
      else if (
        (!product.sizes || product.sizes.length === 0) &&
        (!product.colors || product.colors.length === 0)
      ) {
        setCurrentStock(product.stock);
      }
      // 3. Selection incomplete
      else {
        setCurrentStock(null);
      }
    }
  }, [selectedSize, selectedColor, product]);

  const fetchProduct = async () => {
    const { data } = await supabase
      .from("products")
      .select("*, category:categories(*)")
      .eq("id", id)
      .single();

    setProduct(data);
    setLoading(false);
  };

  // Helper: Get stock for specific combination
  const getVariantStock = (size: string, color: string) => {
    // Fallback: If no granular data exists, assume global stock is valid
    if (!product.variant_stock || !Array.isArray(product.variant_stock)) {
      return product.stock || 0;
    }

    const variant = product.variant_stock.find(
      (v: any) => v.size === size && v.color === color
    );

    return variant ? variant.stock : 0;
  };

  // Helper: check if a specific option is available at all
  // e.g. If Size "S" is selected, is Color "Red" available?
  const isOptionAvailable = (type: "size" | "color", value: string) => {
    if (!product.variant_stock) return true; // fallback

    if (type === "size") {
      // If a color is already selected, check if this size exists for that color
      if (selectedColor) {
        return getVariantStock(value, selectedColor) > 0;
      }
      // Otherwise check if this size exists in ANY color
      return product.variant_stock.some(
        (v: any) => v.size === value && v.stock > 0
      );
    }

    if (type === "color") {
      // If a size is already selected, check if this color exists for that size
      if (selectedSize) {
        return getVariantStock(selectedSize, value) > 0;
      }
      // Otherwise check if this color exists in ANY size
      return product.variant_stock.some(
        (v: any) => v.color === value && v.stock > 0
      );
    }
    return true;
  };

  // --- Delivery Logic ---
  const checkDelivery = () => {
    if (!pincode || pincode.length !== 6) {
      setDeliveryStatus({
        type: "error",
        message: "Please enter a valid 6-digit pincode.",
      });
      return;
    }

    const prefix = parseInt(pincode.substring(0, 2));

    // Tamil Nadu Logic (Approximate Pincodes 60xxxx to 66xxxx)
    if (prefix >= 60 && prefix <= 66) {
      setDeliveryStatus({
        type: "success",
        message: "Free Delivery Available for Tamil Nadu! ✅",
      });
    } else {
      setDeliveryStatus({
        type: "error",
        message: "Delivery coming soon to this location 🚧",
      });
    }
  };

  // --- Validation Logic ---
  const validateSelection = () => {
    const sizes = (product.sizes as string[]) || [];
    const colors = (product.colors as string[]) || [];

    if (sizes.length > 0 && !selectedSize) {
      toast.error("Please select a Size to proceed");
      return false;
    }

    if (colors.length > 0 && !selectedColor) {
      toast.error("Please select a Color to proceed");
      return false;
    }

    // New: Stock Validation
    if (currentStock !== null && currentStock <= 0) {
      toast.error("This variation is currently out of stock");
      return false;
    }

    return true;
  };

  const handleAddToCart = () => {
    if (!validateSelection()) return;

    // Pass both size and color to context
    addToCart(product.id, 1, selectedSize, selectedColor);
    toast.success("Added to cart");
  };

  const handleBuyNow = () => {
    if (!validateSelection()) return;

    addToCart(product.id, 1, selectedSize, selectedColor);
    setTimeout(() => navigate("/cart"), 300);
  };

  const shareProduct = (platform: string) => {
    const url = window.location.href;
    const text = `Check out ${product.title}`;

    if (platform === "whatsapp") {
      window.open(
        `https://api.whatsapp.com/send?text=${encodeURIComponent(
          text + " " + url
        )}`,
        "_blank"
      );
    } else if (platform === "facebook") {
      window.open(
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
          url
        )}`,
        "_blank"
      );
    }
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
  const colors = (product.colors as string[]) || [];
  const finalPrice = product.price_inr * (1 - product.discount_percent / 100);

  // Determine Stock Status UI
  const isOutOfStock = currentStock === 0;
  const isLowStock =
    currentStock !== null && currentStock > 0 && currentStock < 5;
  const hasSelectedDetails =
    (sizes.length === 0 || selectedSize) &&
    (colors.length === 0 || selectedColor);

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
                        ? "border-foreground"
                        : "border-border hover:border-muted-foreground"
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
                src={images[selectedImage] || "/placeholder.svg"}
                alt={product.title}
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Right: Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
                {product.title}
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-1 bg-green-600 text-white px-2 py-0.5 rounded text-sm font-semibold">
                  <span>5.0</span>
                  <Star className="w-3 h-3 fill-white" />
                </div>
                <span className="text-sm text-muted-foreground">Ratings</span>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-2xl lg:text-3xl font-bold">
                ₹ {finalPrice.toFixed(0)}
              </span>
              {product.discount_percent > 0 && (
                <>
                  <span className="text-lg lg:text-xl text-muted-foreground line-through">
                    ₹ {product.price_inr.toFixed(0)}
                  </span>
                  <Badge className="bg-[hsl(var(--accent))] text-white text-sm font-semibold">
                    {product.discount_percent}% OFF
                  </Badge>
                </>
              )}
            </div>

            {/* Share buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => shareProduct("whatsapp")}
                className="p-2 rounded-full bg-green-50 hover:bg-green-100 transition-colors"
                title="Share on WhatsApp"
              >
                <MessageCircle className="w-5 h-5 text-[#25D366]" />
              </button>
              <button
                onClick={() => shareProduct("facebook")}
                className="p-2 rounded-full bg-blue-50 hover:bg-blue-100 transition-colors"
                title="Share on Facebook"
              >
                <Facebook className="w-5 h-5 text-[#1877F2]" />
              </button>
            </div>

            <hr />

            {/* Size Selection */}
            {sizes.length > 0 && (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <p className="text-sm font-medium">Select Size</p>
                  {!selectedSize && (
                    <span className="text-xs text-red-500 font-medium">
                      * Required
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((size: string) => {
                    const available = isOptionAvailable("size", size);
                    return (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`min-w-[60px] px-3 py-2 border rounded-md font-medium transition-all text-sm 
                            ${
                              selectedSize === size
                                ? "border-black bg-black text-white"
                                : "border-gray-200 hover:border-black"
                            }
                            ${
                              !available
                                ? "opacity-50 cursor-not-allowed bg-gray-50 decoration-slice line-through"
                                : ""
                            }
                          `}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Color Selection */}
            {colors.length > 0 && (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <p className="text-sm font-medium">Select Color</p>
                  {!selectedColor && (
                    <span className="text-xs text-red-500 font-medium">
                      * Required
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {colors.map((color: string) => {
                    const available = isOptionAvailable("color", color);
                    return (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`px-4 py-2 border rounded-md font-medium transition-all text-sm capitalize 
                            ${
                              selectedColor === color
                                ? "border-black bg-black text-white"
                                : "border-gray-200 hover:border-black"
                            }
                            ${
                              !available
                                ? "opacity-50 cursor-not-allowed bg-gray-50 line-through"
                                : ""
                            }
                          `}
                      >
                        {color}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STOCK STATUS MESSAGE */}
            {hasSelectedDetails && currentStock !== null && (
              <div className="py-2">
                {currentStock === 0 ? (
                  <div className="flex items-center gap-2 text-red-600 font-bold bg-red-50 p-2 rounded w-fit">
                    <AlertCircle className="w-5 h-5" />
                    <span>Out of Stock</span>
                  </div>
                ) : isLowStock ? (
                  <div className="flex items-center gap-2 text-orange-600 font-bold bg-orange-50 p-2 rounded w-fit animate-pulse">
                    <AlertCircle className="w-5 h-5" />
                    <span>Hurry! Only {currentStock} left!</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-green-600 font-bold">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>In Stock ({currentStock} units available)</span>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 pt-2">
              <Button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                variant="outline"
                size="lg"
                className="flex-1 h-12 border-2 text-base font-semibold"
              >
                {isOutOfStock ? "Out of Stock" : "Add to Cart"}
              </Button>
              <Button
                onClick={handleBuyNow}
                disabled={isOutOfStock}
                size="lg"
                className="flex-1 h-12 text-base font-semibold"
              >
                {isOutOfStock ? "Notify Me" : "Buy Now"}
              </Button>
            </div>

            {/* Delivery Info */}
            <div className="bg-slate-50 border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-muted-foreground" />
                <h3 className="font-semibold text-sm">Delivery Options</h3>
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={pincode}
                    onChange={(e) =>
                      setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="Enter Pincode"
                    className="w-full pl-9 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
                <Button
                  variant="default"
                  size="sm"
                  onClick={checkDelivery}
                  className="px-6"
                >
                  Check
                </Button>
              </div>

              {/* Delivery Status Messages */}
              {deliveryStatus.message && (
                <div
                  className={`text-sm font-medium flex items-center gap-2 ${
                    deliveryStatus.type === "success"
                      ? "text-green-600"
                      : "text-orange-600"
                  }`}
                >
                  {deliveryStatus.message}
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                Enter your pincode to check delivery availability.
              </p>
            </div>

            <hr />

            {/* Specifications & Description */}
            <div className="space-y-4">
              {product.brand && (
                <div className="grid grid-cols-3 gap-2 text-sm border-b pb-4">
                  <span className="text-muted-foreground">Brand</span>
                  <span className="col-span-2 font-medium">
                    {product.brand}
                  </span>
                </div>
              )}

              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Description</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {product.description ||
                    `The ${product.title} features a premium build with high-quality materials, ensuring durability and comfort. Perfect for everyday wear.`}
                </p>
              </div>
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

// Related Products Component (Kept same as provided)
function RelatedProducts({
  categoryId,
  currentProductId,
}: {
  categoryId: string | null;
  currentProductId: string;
}) {
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);

  useEffect(() => {
    if (categoryId) {
      fetchRelatedProducts();
    }
  }, [categoryId]);

  const fetchRelatedProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("category_id", categoryId)
      .eq("is_active", true)
      .neq("id", currentProductId)
      .limit(4);

    setRelatedProducts(data || []);
  };

  if (relatedProducts.length === 0) return null;

  return (
    <section className="container py-12 border-t mt-12">
      <h2 className="text-2xl font-bold mb-6">Similar Products</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {relatedProducts.map((product) => {
          const images = Array.isArray(product.images) ? product.images : [];
          const finalPrice =
            product.price_inr * (1 - (product.discount_percent || 0) / 100);

          return (
            <Link
              key={product.id}
              to={`/products/${product.id}`}
              className="group block"
            >
              <div className="bg-card rounded-lg overflow-hidden border hover:shadow-md transition-all">
                <div className="aspect-square overflow-hidden bg-gray-100">
                  <img
                    src={images[0] || "/placeholder.svg"}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-4 space-y-2">
                  <h3 className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">
                    {product.title}
                  </h3>
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold">₹{finalPrice.toFixed(0)}</span>
                    {product.discount_percent > 0 && (
                      <span className="text-xs text-muted-foreground line-through">
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
