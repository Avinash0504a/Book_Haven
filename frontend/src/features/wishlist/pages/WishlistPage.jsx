import { useWishlist, useToggleWishlist } from '../hooks/useWishlist';
import { useCart } from '../../cart/hooks/useCart.js';
import { usePincode } from '../../../providers/PincodeProvider';
import { useNotifyMe } from '../../catalog/hooks/useCatalog';
import { Card } from '../../../components/ui/Card.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { Spinner } from '../../../components/ui/Spinner.jsx';
import { EmptyState } from '../../../components/ui/EmptyState.jsx';
import { ErrorState } from '../../../components/ui/ErrorState.jsx';
import { Link, useNavigate } from 'react-router-dom';

export default function WishlistPage() {
  const { pincode } = usePincode();
  const { data: items = [], isLoading, isError, refetch } = useWishlist(pincode);
  const toggleWishlist = useToggleWishlist();
  const { addItem, isAdding } = useCart();
  const notifyMeMutation = useNotifyMe();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Spinner />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <ErrorState onRetry={refetch} />
      </div>
    );
  }

  const handleMoveToCart = async (book) => {
    try {
      await addItem({ bookId: book.id, quantity: 1 });
      await toggleWishlist.mutateAsync({ bookId: book.id, inWishlist: true });
    } catch {
      // Error handled by mutation
    }
  };

  const handleRemove = (bookId) => {
    toggleWishlist.mutate({ bookId, inWishlist: true });
  };

  const handleNotifyMe = (bookId) => {
    notifyMeMutation.mutate(bookId);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">My Wishlist</h1>
        <p className="text-muted text-sm mt-1">
          Books you have saved for later. Move them to your cart when you are ready to purchase.
        </p>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="Your wishlist is empty"
          message="Explore our catalogue and add books you love to your wishlist."
          actionLabel="Start Browsing"
          onAction={() => navigate('/')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((book) => {
            const authorSlug = book.author?.slug;
            const authorName = book.author?.name || 'Unknown Author';

            return (
              <Card key={book.id} className="p-4 flex flex-col justify-between space-y-4">
                <div className="flex gap-4">
                  <Link to={`/products/${book.id}`} className="shrink-0 w-24 h-32 rounded overflow-hidden bg-bg">
                    <img
                      src={book.coverImageUrl || `/covers/${book.slug}.svg`}
                      alt={book.title}
                      className="w-full h-full object-cover"
                    />
                  </Link>

                  <div className="flex-1 space-y-1">
                    <Link
                      to={`/products/${book.id}`}
                      className="font-semibold text-text hover:text-primary line-clamp-2 text-sm leading-snug"
                    >
                      {book.title}
                    </Link>
                    <p className="text-xs text-muted">
                      by{' '}
                      {authorSlug ? (
                        <Link to={`/writers/${authorSlug}`} className="hover:underline">
                          {authorName}
                        </Link>
                      ) : (
                        authorName
                      )}
                    </p>
                    <p className="text-xs text-muted">
                      {book.format} • {book.language}
                    </p>
                    <div className="pt-2 flex items-baseline gap-2">
                      <span className="text-sm font-bold text-text">
                        ₹{(book.unitPrice || book.price || 0).toFixed(2)}
                      </span>
                      {book.discountPercent > 0 && (
                        <span className="text-xs text-muted line-through">
                          ₹{(book.price || 0).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemove(book.id)}
                    loading={toggleWishlist.isPending}
                  >
                    Remove
                  </Button>

                  {book.inStock ? (
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => handleMoveToCart(book)}
                      loading={isAdding}
                    >
                      Move to Cart
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => handleNotifyMe(book.id)}
                      loading={notifyMeMutation.isPending}
                    >
                      Notify Me
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
