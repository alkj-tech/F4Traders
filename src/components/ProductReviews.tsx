import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress"; // Assuming you have a shadcn Progress component
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Star, ThumbsUp, User } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

interface Review {
  id: string;
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
  profiles?: {
    full_name?: string | null;
    avatar_url?: string | null;
  };
}

interface ProductReviewsProps {
  productId: string;
}

const ITEMS_PER_PAGE = 5;

export const ProductReviews = ({ productId }: ProductReviewsProps) => {
  const { user } = useAuth();

  // State
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sortBy, setSortBy] = useState<"newest" | "highest" | "lowest">(
    "newest"
  );
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Form State
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");

  // --- 1. Efficient Data Fetching ---
  const fetchReviews = useCallback(
    async (pageNum: number, isNewSort = false) => {
      try {
        setLoading(true);

        let query = supabase
          .from("reviews")
          .select(
            `
          *,
          profiles (full_name, avatar_url)
        `
          )
          .eq("product_id", productId)
          .eq("status", "approved");

        // Apply Sorting
        if (sortBy === "newest")
          query = query.order("created_at", { ascending: false });
        if (sortBy === "highest")
          query = query.order("rating", { ascending: false });
        if (sortBy === "lowest")
          query = query.order("rating", { ascending: true });

        // Apply Pagination
        const from = pageNum * ITEMS_PER_PAGE;
        const to = from + ITEMS_PER_PAGE - 1;

        const { data, error } = await query.range(from, to);

        if (error) throw error;

        const newReviews = data as Review[];

        if (newReviews.length < ITEMS_PER_PAGE) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }

        setReviews((prev) =>
          isNewSort ? newReviews : [...prev, ...newReviews]
        );
      } catch (error) {
        console.error("Error:", error);
        toast.error("Failed to load reviews");
      } finally {
        setLoading(false);
      }
    },
    [productId, sortBy]
  );

  // Initial Load & Sort Change
  useEffect(() => {
    setPage(0);
    fetchReviews(0, true);
  }, [fetchReviews, sortBy]);

  // Load More Handler
  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchReviews(nextPage, false);
  };

  // --- 2. Data Calculation (Memoized) ---
  const stats = useMemo(() => {
    if (!reviews.length)
      return { average: 0, total: 0, distribution: [0, 0, 0, 0, 0] };

    const total = reviews.length;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const average = (sum / total).toFixed(1);

    // Calculate percentages for 5, 4, 3, 2, 1 stars
    const counts = [0, 0, 0, 0, 0]; // Index 0 = 1 star, Index 4 = 5 stars
    reviews.forEach((r) => {
      if (r.rating >= 1 && r.rating <= 5) counts[r.rating - 1]++;
    });

    const distribution = counts.map((count) =>
      Math.round((count / total) * 100)
    );

    return { average, total, distribution };
  }, [reviews]);

  // --- 3. Submission Logic ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error("Please login to review");
    if (rating === 0) return toast.error("Please select a star rating");

    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from("reviews")
        .insert([
          {
            product_id: productId,
            user_id: user.id,
            rating,
            comment,
            status: "pending", // Usually explicitly set pending for moderation
          },
        ])
        .select() // Select back to show immediately
        .single();

      if (error) throw error;

      toast.success("Review submitted! It will appear after approval.");
      setComment("");
      setRating(0);

      // Optional: Optimistic update if you allow instant reviews
      // setReviews(prev => [data as Review, ...prev]);
    } catch (err) {
      toast.error("Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header & Stats Section */}
      <div className="grid md:grid-cols-2 gap-8 items-start">
        <div>
          <h2 className="text-2xl font-bold mb-4">Customer Reviews</h2>
          <div className="flex items-center gap-4 mb-6">
            <div className="text-5xl font-bold">{stats.average}</div>
            <div className="space-y-1">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-5 h-5 ${
                      star <= Number(stats.average)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-200"
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                {stats.total} verified ratings
              </p>
            </div>
          </div>
        </div>

        {/* Rating Bars */}
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((star) => (
            <div key={star} className="flex items-center gap-3 text-sm">
              <span className="w-3 font-medium">{star}</span>
              <Star className="w-4 h-4 text-muted-foreground" />
              <Progress value={stats.distribution[star - 1]} className="h-2" />
              <span className="w-8 text-right text-muted-foreground">
                {stats.distribution[star - 1]}%
              </span>
            </div>
          ))}
        </div>
      </div>

      <hr />

      {/* Review Submission Form */}
      {user ? (
        <Card className="bg-slate-50/50">
          <CardHeader>
            <CardTitle className="text-lg">Write a Review</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  How was the product?
                </label>
                <div
                  className="flex gap-1"
                  onMouseLeave={() => setHoverRating(0)}
                >
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onClick={() => setRating(star)}
                      className="transition-transform hover:scale-110 focus:outline-none"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= (hoverRating || rating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    </Button>
                  ))}
                </div>
              </div>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="What did you like or dislike? What did you use this product for?"
                rows={4}
                required
              />
              <Button type="submit" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Review"}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-slate-100 p-6 rounded-lg text-center">
          <p className="text-muted-foreground">
            Please{" "}
            <Button variant="link" className="px-1">
              Login
            </Button>{" "}
            to write a review
          </p>
        </div>
      )}

      {/* Filter & List Section */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">{reviews.length} Reviews</h3>
          <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="highest">Highest Rated</SelectItem>
              <SelectItem value="lowest">Lowest Rated</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="p-6 border rounded-xl bg-card">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={review.profiles?.avatar_url || ""} />
                    <AvatarFallback>
                      <User className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-sm">
                      {review.profiles?.full_name || "Anonymous User"}
                    </p>
                    <div className="flex gap-0.5 mt-0.5">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Star
                          key={idx}
                          className={`w-3.5 h-3.5 ${
                            idx < review.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(review.created_at).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
              <p className="text-gray-700 leading-relaxed text-sm">
                {review.comment}
              </p>
            </div>
          ))}

          {loading && (
            <p className="text-center py-4 text-muted-foreground animate-pulse">
              Loading reviews...
            </p>
          )}

          {!loading && reviews.length === 0 && (
            <div className="text-center py-12 bg-slate-50 rounded-lg">
              <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900">
                No reviews yet
              </h3>
              <p className="text-gray-500">
                Be the first to review this product!
              </p>
            </div>
          )}

          {hasMore && !loading && reviews.length > 0 && (
            <Button variant="outline" className="w-full" onClick={loadMore}>
              Load More Reviews
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
