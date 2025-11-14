import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { Navigate } from 'react-router-dom';

export default function Reviews() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const { user, isAdmin, isSuperAdmin } = useAuth();

  useEffect(() => {
    if (user && (isAdmin || isSuperAdmin)) {
      fetchReviews();
    }
  }, [user, isAdmin, isSuperAdmin, filter]);

  const fetchReviews = async () => {
    setLoading(true);
    let query = supabase
      .from('reviews')
      .select(`
        id,
        rating,
        comment,
        status,
        created_at,
        moderated_at,
        product:products(title),
        user:profiles!reviews_user_id_fkey(full_name)
      `)
      .order('created_at', { ascending: false });

    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Failed to fetch reviews');
    } else {
      setReviews(data || []);
    }
    setLoading(false);
  };

  const moderateReview = async (reviewId: string, status: 'approved' | 'rejected') => {
    const { error } = await supabase
      .from('reviews')
      .update({
        status,
        moderated_at: new Date().toISOString(),
        moderated_by: user!.id,
      })
      .eq('id', reviewId);

    if (error) {
      toast.error(`Failed to ${status} review`);
    } else {
      toast.success(`Review ${status}`);
      fetchReviews();
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
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
            size="sm"
          >
            All
          </Button>
          <Button
            variant={filter === 'pending' ? 'default' : 'outline'}
            onClick={() => setFilter('pending')}
            size="sm"
          >
            Pending
          </Button>
          <Button
            variant={filter === 'approved' ? 'default' : 'outline'}
            onClick={() => setFilter('approved')}
            size="sm"
          >
            Approved
          </Button>
          <Button
            variant={filter === 'rejected' ? 'default' : 'outline'}
            onClick={() => setFilter('rejected')}
            size="sm"
          >
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
                    <CardTitle className="text-lg">
                      {review.product?.title || 'Unknown Product'}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-muted-foreground'
                            }`}
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
                      review.status === 'approved'
                        ? 'default'
                        : review.status === 'rejected'
                        ? 'destructive'
                        : 'secondary'
                    }
                  >
                    {review.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4">{review.comment}</p>
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
                        className="text-green-600 hover:text-green-700"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => moderateReview(review.id, 'rejected')}
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
