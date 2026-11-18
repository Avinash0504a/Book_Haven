import React, { useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { Truck, Bell, Check, Star } from 'lucide-react';
import { useBook, useRelated, useNotifyMe } from '../hooks/useCatalog.js';
import { usePincode } from '../../../providers/PincodeProvider.jsx';
import { useAuth } from '../../../providers/AuthProvider.jsx';
import { formatRupees, formatDeliveryDate } from '../../../lib/format.js';
import { Badge } from '../../../components/ui/Badge.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { Input } from '../../../components/ui/Input.jsx';
import { Spinner } from '../../../components/ui/Spinner.jsx';
import { ErrorState } from '../../../components/ui/ErrorState.jsx';
import { CartControl } from '../../cart/components/CartControl.jsx';
import { BookTile } from '../components/BookTile.jsx';
import WishlistButton from '../../wishlist/components/WishlistButton.jsx';
import ReviewForm from '../../reviews/components/ReviewForm.jsx';
import ReviewList from '../../reviews/components/ReviewList.jsx';

const FORMAT_LABELS = {
  PAPERBACK: 'Paperback',
  HARDCOVER: 'Hardcover',
  EBOOK: 'E-Book',
  AUDIOBOOK: 'Audiobook'
};

// Whole rupees read cleaner ("₹149"); keep paise when there are any.
function rupees(amount) {
  const value = Number(amount);
  return formatRupees(amount, { decimals: Number.isInteger(value) ? 0 : 2 });
}

function firstSentence(text) {
  if (!text) return '';
  const match = text.match(/^.*?[.!?](\s|$)/);
  return (match ? match[0] : text).trim();
}

// A simple barcode drawn from the ISBN digits (decorative; not a scannable EAN-13).
function IsbnBarcode({ isbn }) {
  const digits = String(isbn || '').replace(/\D/g, '');
  if (!digits) return null;
  const bars = [];
  let x = 0;
  for (const d of digits) {
    const n = Number(d);
    bars.push({ x, w: (n % 3) + 1 });
    x += (n % 3) + 1 + ((n % 2) + 1);
  }
  return (
    <div className="bg-bg border border-border rounded-sm p-2 inline-block" aria-label={`ISBN ${isbn}`}>
      <svg viewBox={`0 0 ${x} 24`} className="h-8 w-28 text-text" aria-hidden="true" preserveAspectRatio="none">
        {bars.map((bar) => (
          <rect key={bar.x} x={bar.x} y="0" width={bar.w} height="24" fill="currentColor" />
        ))}
      </svg>
      <p className="text-[10px] text-muted text-center mt-1 tracking-wider">{isbn}</p>
    </div>
  );
}

function BackCover({ book, authorName, authorBio }) {
  const quote = firstSentence(book.description);
  return (
    <div className="aspect-[2/3] w-full rounded-md overflow-hidden bg-surface border border-border shadow-md p-3 sm:p-4 flex flex-col text-[11px] leading-snug">
      {quote && <p className="font-semibold text-text italic line-clamp-3">&ldquo;{quote}&rdquo;</p>}
      {book.description && <p className="text-muted mt-2 line-clamp-5">{book.description}</p>}
      {authorName && (
        <div className="mt-3">
          <p className="font-bold text-text">About the Author</p>
          <p className="text-muted mt-1 line-clamp-4">{authorBio || authorName}</p>
        </div>
      )}
      <div className="mt-auto pt-2 flex justify-end">
        <IsbnBarcode isbn={book.isbn} />
      </div>
    </div>
  );
}

function Stars({ value }) {
  const filled = Math.round(Number(value) || 0);
  return (
    <span className="inline-flex items-center gap-0.5" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`w-4 h-4 ${n <= filled ? 'text-warning fill-current' : 'text-muted'}`} />
      ))}
    </span>
  );
}

export function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { pincode, setPincode } = usePincode();
  const { isAuthenticated } = useAuth();

  const [inputPincode, setInputPincode] = useState(pincode);
  const [notifySuccess, setNotifySuccess] = useState(false);
  const [pincodeErrorMsg, setPincodeErrorMsg] = useState(null);

  const { data: book, isLoading, isError, error, refetch } = useBook(id);
  const { data: relatedBooks = [] } = useRelated(id);
  const { mutateAsync: notifyMe, isPending: isNotifying } = useNotifyMe();

  const isDigital = book?.format === 'EBOOK' || book?.format === 'AUDIOBOOK';
  const hasDiscount = (book?.discountPercent || 0) > 0;
  const isOutOfStock = !book?.inStock || (!isDigital && book?.stockQuantity <= 0);

  const handlePincodeCheck = (e) => {
    e.preventDefault();
    if (setPincode(inputPincode)) {
      setPincodeErrorMsg(null);
    } else {
      setPincodeErrorMsg('Please enter a valid 6-digit postal code');
    }
  };

  const handleNotifyMe = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } });
      return;
    }
    try {
      await notifyMe(book.id);
      setNotifySuccess(true);
    } catch {
      // Handled
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError || !book) {
    return (
      <ErrorState
        title="Book not found"
        message={error?.message || 'The requested book details could not be loaded.'}
        onRetry={refetch}
      />
    );
  }

  const authorName = book.author?.name || book.authorName || '';
  const authorSlug = book.author?.slug || book.authorSlug;
  const authorLink = authorSlug ? `/writers/${authorSlug}` : `/writers?search=${encodeURIComponent(authorName)}`;
  const authorBio = book.writer?.bio || book.authorBio || '';
  const authorImage = book.writer?.imageUrl || (authorSlug ? `/covers/authors/${authorSlug}.svg` : '');
  const publisherName = book.brand?.name || book.publisher || '';
  const publisherLink = book.brand?.id ? `/?brandId=${encodeURIComponent(book.brand.id)}` : null;
  const coverSrc = book.coverImageUrl || `/covers/${book.slug}.svg`;

  return (
    <div className="space-y-10">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-sm text-muted">
        <Link to="/" className="hover:text-text transition-colors">
          Home
        </Link>
        {book.category?.name && (
          <>
            <span aria-hidden="true">/</span>
            <Link to={`/?category=${encodeURIComponent(book.category.slug)}`} className="hover:text-text transition-colors">
              {book.category.name}
            </Link>
          </>
        )}
        <span aria-hidden="true">/</span>
        <span aria-current="page" className="text-text">
          {book.title}
        </span>
      </nav>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_22rem] gap-10">
        <div className="space-y-12 min-w-0">
          {/* Covers + details */}
          <div className="grid grid-cols-1 lg:grid-cols-[auto_minmax(0,1fr)] gap-8">
            <div className="flex items-start gap-4 justify-center lg:justify-start">
              <div className="relative w-40 sm:w-48 shrink-0">
                <div className="aspect-[2/3] w-full rounded-md overflow-hidden bg-surface border border-border shadow-md">
                  <img src={coverSrc} alt={book.title} className="w-full h-full object-cover" />
                </div>
                {isOutOfStock && (
                  <div className="absolute bottom-2 right-2">
                    <Badge variant="dangerSolid" size="md">
                      Out of Stock
                    </Badge>
                  </div>
                )}
              </div>
              <div className="w-40 sm:w-48 shrink-0">
                <BackCover book={book} authorName={authorName} authorBio={authorBio} />
              </div>
            </div>

            <div className="space-y-3 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-text tracking-tight">{book.title}</h1>

              <p className="text-sm text-text">
                by{' '}
                <Link to={authorLink} className="text-primary underline underline-offset-2">
                  {authorName}
                </Link>
              </p>

              {book.description && <p className="text-sm text-muted line-clamp-2">{firstSentence(book.description)}</p>}

              {publisherName && (
                <p className="text-sm text-text">
                  Published by:{' '}
                  {publisherLink ? (
                    <Link to={publisherLink} className="text-primary underline underline-offset-2">
                      {publisherName}
                    </Link>
                  ) : (
                    <span className="font-medium">{publisherName}</span>
                  )}
                </p>
              )}

              <p className="text-sm text-text">{FORMAT_LABELS[book.format] || book.format}</p>

              {book.category?.name && (
                <p className="text-sm">
                  <Link to={`/?category=${encodeURIComponent(book.category.slug)}`} className="text-primary underline underline-offset-2">
                    {book.category.name}
                  </Link>
                </p>
              )}

              {/* Price */}
              <div className="flex flex-wrap items-baseline gap-3 pt-1">
                <span className="text-4xl font-bold text-text">{rupees(book.unitPrice || book.price)}</span>
                {hasDiscount && (
                  <>
                    <span className="text-base text-muted line-through">{rupees(book.price)}</span>
                    <span className="text-sm font-semibold text-success">{book.discountPercent}% OFF</span>
                  </>
                )}
              </div>

              {!isDigital ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted flex items-center gap-2">
                    <Truck className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                    <span>
                      Delivery by{' '}
                      <span className="font-bold text-text">
                        {book.deliveryDate ? formatDeliveryDate(book.deliveryDate) : '3-5 business days'}
                      </span>
                    </span>
                  </p>
                  <form onSubmit={handlePincodeCheck} className="flex items-center gap-2 max-w-xs">
                    <Input
                      placeholder="Enter 6-digit pincode"
                      value={inputPincode}
                      onChange={(e) => setInputPincode(e.target.value)}
                      maxLength={6}
                      error={pincodeErrorMsg}
                      className="text-xs py-1.5"
                      aria-label="Delivery Pincode"
                    />
                    <Button type="submit" variant="secondary" size="sm" className="shrink-0">
                      Check
                    </Button>
                  </form>
                </div>
              ) : (
                <p className="flex items-center gap-2 text-xs text-success font-medium">
                  <Check className="w-4 h-4" aria-hidden="true" />
                  <span>Instant Digital Delivery to your E-Library upon purchase</span>
                </p>
              )}

              {/* Actions: Add to Cart / Notify Me + Wishlist */}
              <div className="flex flex-wrap items-start gap-3 pt-2">
                {isOutOfStock ? (
                  notifySuccess ? (
                    <div className="p-3 bg-success/10 border border-success/20 rounded-md text-xs text-success font-semibold flex items-center gap-2">
                      <Check className="w-4 h-4" /> You will be notified when this book is back in stock.
                    </div>
                  ) : (
                    <Button variant="primary" size="lg" onClick={handleNotifyMe} loading={isNotifying}>
                      <Bell className="w-4 h-4 mr-2" /> Notify Me When Available
                    </Button>
                  )
                ) : (
                  <div className="w-48">
                    <CartControl book={book} size="lg" />
                  </div>
                )}
                <WishlistButton bookId={book.id} inWishlist={Boolean(book.inWishlist)} showLabel className="h-11" />
              </div>

              {/* Language / Rating / Sells */}
              <dl className="grid grid-cols-3 gap-4 pt-4 border-t border-border text-sm">
                <div>
                  <dt className="text-muted">Language:</dt>
                  <dd className="mt-0.5">
                    <Link to={`/?language=${encodeURIComponent(book.language)}`} className="text-primary underline underline-offset-2">
                      {book.language}
                    </Link>
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">Rating:</dt>
                  <dd className="mt-0.5 flex items-center gap-1">
                    <Stars value={book.rating} />
                    {book.reviewCount > 0 && <span className="sr-only">{Number(book.rating).toFixed(1)} out of 5</span>}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">Sells:</dt>
                  <dd className="mt-0.5 text-text">{book.soldCount ?? 0} copies sold</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Overview */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-text">Overview & Description</h2>
            <p className="text-sm text-muted leading-relaxed whitespace-pre-line">
              {book.description || 'No detailed description available for this title.'}
            </p>
          </section>

          {/* About the writer */}
          {authorName && (
            <section aria-labelledby="writer-heading" className="space-y-3">
              <h2 id="writer-heading" className="text-xl font-bold text-text">
                About the writer
              </h2>
              <div className="flex items-start gap-4">
                {authorImage && (
                  <img
                    src={authorImage}
                    alt={authorName}
                    className="w-20 h-20 rounded-full object-cover bg-surface border border-border shrink-0"
                  />
                )}
                <div className="min-w-0">
                  <Link to={authorLink} className="font-semibold text-text hover:text-primary transition-colors">
                    {authorName}
                  </Link>
                  <p className="text-sm text-muted leading-relaxed mt-1">
                    {authorBio || 'Read more works and explore the complete collection by this writer.'}
                  </p>
                  <Link to={authorLink} className="inline-block mt-2 text-xs font-semibold text-primary hover:underline">
                    View all books by {authorName} &rarr;
                  </Link>
                </div>
              </div>
            </section>
          )}

          {/* Reviews */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start pt-6 border-t border-border">
            <ReviewForm bookId={book.id} />
            <ReviewList bookId={book.id} averageRating={book.rating} reviewCount={book.reviewCount} />
          </section>
        </div>

        {/* Related Reads rail */}
        {relatedBooks.length > 0 && (
          <aside aria-labelledby="related-heading" className="space-y-5 xl:border-l xl:border-border xl:pl-8">
            <h2 id="related-heading" className="text-xl font-bold text-text">
              Related Reads
            </h2>
            <div className="space-y-6">
              {relatedBooks.slice(0, 6).map((relBook) => (
                <BookTile key={relBook.id} book={relBook} variant="row" showCartControl={false} />
              ))}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
