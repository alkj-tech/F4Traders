import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Star } from "lucide-react";
import { toast } from "sonner";

interface RawReview {
  id: string;
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
}

interface Profile {
  id: string;
  full_name?: string | null;
}

interface Review {
  id: string;
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
  profiles?: {
    full_name?: string | null;
  };
}

interface ProductReviewsProps {
  productId: string;
}

/**
 * Notes:
 * - The original error (PGRST200) happens because PostgREST (used by Supabase)
 *   couldn't find a DB foreign-key relationship between `reviews` and `profiles`.
 * - This component avoids relying on a DB relationship by:
 *   1) fetching the reviews
 *   2) fetching all profiles for the unique user_ids returned
 *   3) merging profile.full_name into each review client-side
 *
 * If you'd rather keep one query with an implicit join, add a FK constraint
 * in your database (see the migration file suggested below).
 */
export const ProductReviews = ({ productId }: ProductReviewsProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();


  const fetchReviews = useCallback(async () => {
    try {
      // 1) Fetch reviews for this product
      const { data: reviewsData, error: reviewsError } = await supabase
        .from("reviews")
        .select("*")
        .eq("product_id", productId)
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (reviewsError) {
        console.error("Error fetching reviews:", reviewsError);
        toast.error("Failed to load reviews");
        setReviews([]);
        return;
      }

      const rawReviews = reviewsData || [];

      if (rawReviews.length === 0) {
        setReviews([]);
        return;
      }

      // 2) Fetch profiles for the unique user_ids returned by reviews
      const uniqueUserIds = Array.from(new Set(rawReviews.map((r) => r.user_id)));

      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", uniqueUserIds);

      if (profilesError) {
        // If profiles fetch fails, we still show reviews (with Anonymous)
        console.error("Error fetching profiles:", profilesError);
      }

      const profilesById: Record<string, Profile> = {};
      (profilesData || []).forEach((p) => {
        profilesById[p.id] = p;
      });

      // 3) Merge profile info into reviews
      const merged: Review[] = rawReviews.map((r) => ({
        ...r,
        profiles: {
          full_name: profilesById[r.user_id]?.full_name ?? null,
        },
      }));

      setReviews(merged);
    } catch (err) {
      console.error("Unexpected error fetching reviews:", err);
      toast.error("Failed to load reviews");
      setReviews([]);
    }
  }, [productId]);

  useEffect(() => {
    fetchReviews();
    // intentionally only re-run when productId or fetchReviews changes
  }, [productId, fetchReviews]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please login to submit a review");
      return;
    }

    setLoading(true);
    try {
      // Insert the review. Note: depending on your DB defaults, new reviews might
      // be created with status = 'pending' and won't show until approved.
      // If you want them to appear immediately, set `status: 'approved'` here,
      // but be cautious about moderation rules.
      const { error } = await supabase.from("reviews").insert([
        {
          product_id: productId,
          user_id: user.id,
          rating,
          comment,
        },
      ]);

      if (error) {
        throw error;
      }

      toast.success("Review submitted successfully!");
      setComment("");
      setRating(5);
      // refresh to include the new review (may not show if status != 'approved')
      await fetchReviews();
    } catch (err) {
      console.error("Error submitting review:", err);
      toast.error("Failed to submit review");
    } finally {
      setLoading(false);
    }
  };

  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : "0.0";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Customer Reviews</span>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              <span className="text-2xl font-bold">{averageRating}</span>
              <span className="text-muted-foreground">({reviews.length} reviews)</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {user && (
            <form onSubmit={handleSubmit} className="space-y-4 mb-6 p-4 border rounded-lg">
              <div>
                <label className="block text-sm font-medium mb-2">Your Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                        }`}
                      />
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Your Review</label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience with this product..."
                  required
                  rows={4}
                />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? "Submitting..." : "Submit Review"}
              </Button>
            </form>
          )}

          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold">{review.profiles?.full_name || "Anonymous"}</p>
                    <div className="flex gap-1 mt-1">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Star
                          key={idx}
                          className={`w-4 h-4 ${
                            idx < review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {new Date(review.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm">{review.comment}</p>
              </div>
            ))}
          </div>

          {reviews.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No reviews yet. Be the first to review this product!</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};