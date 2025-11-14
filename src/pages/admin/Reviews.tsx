import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { Navigate } from 'react-router-dom';

type Product = { title?: string | null } | null;
type User = { id?: string; full_name?: string | null } | null;

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  status: 'pending' | 'approved' | 'rejected' | null;
  created_at: string;
  moderated_at: string | null;
  product?: Product;
  user?: User;
  user_id?: string | null;
};

export default function Reviews(): JSX.Element {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const mounted = useRef(true);
  const filterDebounce = useRef<number | undefined>(undefined);

  const { user, isAdmin, isSuperAdmin } = useAuth();

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (filterDebounce.current) window.clearTimeout(filterDebounce.current);
    };
  }, []);

  const normalizeRawReview = (raw: any): Review => {
    return {
      id: String(raw.id),
      rating: Number(raw.rating ?? 0),
      comment: raw.comment ?? null,
      status: (raw.status as Review['status']) ?? 'pending',
      created_at: raw.created_at,
      moderated_at: raw.moderated_at ?? null,
      product: raw.product ?? null,
      user:
        raw.user && typeof raw.user === 'object' && !('message' in raw.user)
          ? { id: raw.user.id ? String(raw.user.id) : undefined, full_name: raw.user.full_name ?? null }
          : null,
      user_id: raw.user_id != null ? String(raw.user_id) : null,
    };
  };

  const fetchReviews = useCallback(async () => {
    if (!user || (!isAdmin && !isSuperAdmin)) return;
    setLoading(true);

    const attemptSelect = `
      id,
      rating,
      comment,
      status,
      created_at,
      moderated_at,
      product:products(title),
      user:profiles(full_name),
      user_id
    `;

    const baseSelect = `
      id,
      rating,
      comment,
      status,
      created_at,
      moderated_at,
      product:products(title),
      user_id
    `;

    try {
      // Try single query with relationship expansion first
      let primaryQuery = supabase.from('reviews').select(attemptSelect).order('created_at', { ascending: false });
      if (filter !== 'all') primaryQuery = primaryQuery.eq('status', filter);

      const { data, error } = await primaryQuery;

      if (!error && data) {
        if (!mounted.current) return;
        // Normalize results to our Review type (ensures ids are strings)
        const normalized = (data as any[]).map(normalizeRawReview);
        setReviews(normalized);
        setLoading(false);
        return;
      }

      // If relationship is missing, PostgREST returns PGRST200 or message mentioning relationship
      const msg = String(error?.message ?? error?.details ?? '');
      const isMissingRelationship =
        error?.code === 'PGRST200' ||
        /Could not find a relationship between|Searched for a foreign key relationship/i.test(msg);

      if (!isMissingRelationship) {
        console.error('Error fetching reviews:', error);
        toast.error('Failed to fetch reviews');
        setReviews([]);
        setLoading(false);
        return;
      }

      // Fallback: fetch reviews (with product) then fetch profiles separately and map them in
      let fallbackQuery = supabase.from('reviews').select(baseSelect).order('created_at', { ascending: false });
      if (filter !== 'all') fallbackQuery = fallbackQuery.eq('status', filter);

      const { data: reviewsOnly, error: reviewsError } = await fallbackQuery;

      if (reviewsError) {
        console.error('Error fetching reviews (fallback):', reviewsError);
        toast.error('Failed to fetch reviews');
        setReviews([]);
        setLoading(false);
        return;
      }

      const reviewsArrRaw = (reviewsOnly || []) as any[];
      const reviewsArr = reviewsArrRaw.map(normalizeRawReview);

      // Collect user IDs as strings
      const userIds = Array.from(new Set(reviewsArr.map((r) => r.user_id).filter(Boolean))) as string[];

      const usersMap: Record<string, User> = {};
      if (userIds.length) {
        const { data: profiles, error: profilesError } = await supabase.from('profiles').select('id, full_name').in('id', userIds);

        if (profilesError) {
          console.warn('Could not fetch profiles for reviews:', profilesError);
        } else if (profiles) {
          for (const p of profiles) {
            usersMap[String(p.id)] = { id: String(p.id), full_name: p.full_name ?? null };
          }
        }
      }

      const withUsers = reviewsArr.map((r) => ({ ...r, user: r.user ?? usersMap[r.user_id ?? ''] ?? null }));

      if (!mounted.current) return;
      setReviews(withUsers);
    } catch (err: any) {
      console.error('Unhandled error fetching reviews:', err);
      toast.error('Failed to fetch reviews');
      if (mounted.current) setReviews([]);
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [filter, user, isAdmin, isSuperAdmin]);

  // Debounce filter changes to avoid rapid refetches
  useEffect(() => {
    if (!user || (!isAdmin && !isSuperAdmin)) return;
    if (filterDebounce.current) window.clearTimeout(filterDebounce.current);
    filterDebounce.current = window.setTimeout(() => {
      fetchReviews();
    }, 250);
    return () => {
      if (filterDebounce.current) window.clearTimeout(filterDebounce.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, user, isAdmin, isSuperAdmin]);

  // Initial load when admin status becomes available
  useEffect(() => {
    if (user && (isAdmin || isSuperAdmin)) fetchReviews();
  }, [user, isAdmin, isSuperAdmin, fetchReviews]);

  const moderateReview = async (reviewId: string, status: 'approved' | 'rejected') => {
    if (!user) {
      toast.error('You must be signed in as an admin to moderate reviews.');
      return;
    }

    setActionLoading((s) => ({ ...s, [reviewId]: true }));
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('reviews')
        .update({
          status,
          moderated_at: now,
          moderated_by: user.id,
        })
        .eq('id', reviewId);

      if (error) {
        console.error(`Failed to ${status} review ${reviewId}:`, error);
        toast.error(`Failed to ${status} review`);
        return;
      }

      // Optimistic update
      setReviews((prev) => prev.map((r) => (r.id === reviewId ? { ...r, status, moderated_at: now } : r)));
      toast.success(`Review ${status}`);
    } catch (err) {
      console.error(`Unexpected error moderating review ${reviewId}:`, err);
      toast.error(`Failed to ${status} review`);
    } finally {
      setActionLoading((s) => {
        const copy = { ...s };
        delete copy[reviewId];
        return copy;
      });
    }
  };

  if (!user || (!isAdmin && !isSuperAdmin)) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Review Moderation</h1>
        <div className="flex gap-2">
          <Button variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')} size="sm">
            All
          </Button>
          <Button variant={filter === 'pending' ? 'default' : 'outline'} onClick={() => setFilter('pending')} size="sm">
            Pending
          </Button>
          <Button variant={filter === 'approved' ? 'default' : 'outline'} onClick={() => setFilter('approved')} size="sm">
            Approved
          </Button>
          <Button variant={filter === 'rejected' ? 'default' : 'outline'} onClick={() => setFilter('rejected')} size="sm">
            Rejected
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading reviews...</div>
      ) : reviews.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No {filter !== 'all' ? filter : ''} reviews found
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{review.product?.title || 'Unknown Product'}</CardTitle>
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${i < (review.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        by {review.user?.full_name || 'Anonymous'}
                      </span>
                    </div>
                  </div>
                  <Badge
                    variant={
                      review.status === 'approved' ? 'default' : review.status === 'rejected' ? 'destructive' : 'secondary'
                    }
                  >
                    {review.status ?? 'pending'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4">{review.comment ?? 'No comment provided.'}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Submitted: {new Date(review.created_at).toLocaleString()}
                  </span>
                  {review.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => moderateReview(review.id, 'approved')}
                        disabled={!!actionLoading[review.id]}
                        className="text-green-600 hover:text-green-700"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => moderateReview(review.id, 'rejected')}
                        disabled={!!actionLoading[review.id]}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}