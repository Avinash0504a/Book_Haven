import { useReviews } from '../hooks/useReviews';
import { Spinner } from '../../../components/ui/Spinner.jsx';

export default function ReviewList({ bookId, averageRating, reviewCount }) {
  const { data: reviews = [], isLoading } = useReviews(bookId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h2 className="text-lg font-bold text-text">Customer Reviews</h2>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex text-warning text-lg">
              {'★'.repeat(Math.round(averageRating || 0))}
              {'☆'.repeat(5 - Math.round(averageRating || 0))}
            </div>
            <span className="font-bold text-sm text-text">
              {(averageRating || 0).toFixed(1)} out of 5
            </span>
            <span className="text-xs text-muted">
              ({reviewCount || reviews.length} {reviewCount === 1 ? 'review' : 'reviews'})
            </span>
          </div>
        </div>
      </div>

      {isLoading ? (
        <Spinner />
      ) : reviews.length === 0 ? (
        <p className="text-sm text-muted py-4">
          No reviews yet. Be the first to review this book!
        </p>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div
              key={r.id}
              className="p-4 rounded-xl bg-bg border border-border space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text">
                  {r.memberName || 'Verified Reader'}
                </span>
                <span className="text-xs text-muted">
                  {new Date(r.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              </div>
              <div className="flex text-warning text-sm">
                {'★'.repeat(r.rating)}
                {'☆'.repeat(5 - r.rating)}
              </div>
              <p className="text-xs text-muted leading-relaxed whitespace-pre-line">
                {r.body}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
