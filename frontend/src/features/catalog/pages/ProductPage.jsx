import React, { useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Truck,
  ShieldCheck,
  Bell,
  BookOpen,
  Feather,
  Building,
  Globe,
  Layers,
  ArrowLeft,
  Check,
  Star,
  ShoppingBag
} from 'lucide-react';
import { useBook, useRelated, useNotifyMe } from '../hooks/useCatalog.js';
import { usePincode } from '../../../providers/PincodeProvider.jsx';
import { useAuth } from '../../../providers/AuthProvider.jsx';
import { formatRupees, formatDate } from '../../../lib/format.js';
import { Badge } from '../../../components/ui/Badge.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { Input } from '../../../components/ui/Input.jsx';
import { Card, CardContent } from '../../../components/ui/Card.jsx';
import { Spinner } from '../../../components/ui/Spinner.jsx';
import { ErrorState } from '../../../components/ui/ErrorState.jsx';
import { CartControl } from '../../cart/components/CartControl.jsx';
import { BookTile } from '../components/BookTile.jsx';
import WishlistButton from '../../wishlist/components/WishlistButton.jsx';
import ReviewForm from '../../reviews/components/ReviewForm.jsx';
import ReviewList from '../../reviews/components/ReviewList.jsx';

const FORMAT_LABELS = {
  PAPERBACK: 'Paperback (Physical)',
  HARDCOVER: 'Hardcover (Physical)',
  EBOOK: 'E-Book (Digital Instant Access)',
  AUDIOBOOK: 'Audiobook (Digital Streaming)'
};

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
  const publisherName = book.brand?.name || book.publisher || '';

  return (
    <div className="space-y-12">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
        <Link to="/" className="inline-flex items-center gap-1 hover:text-text transition-colors">
          <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Home
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
        <span aria-current="page" className="text-text">{book.title}</span>
      </nav>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
        {/* Cover Image Column */}
        <div className="md:col-span-5 lg:col-span-4">
          <div className="sticky top-24 space-y-4">
            <div className="aspect-[2/3] w-full rounded-2xl overflow-hidden bg-surface border border-border shadow-md">
              <img
                src={book.coverImageUrl || `/covers/${book.slug}.svg`}
                alt={book.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-muted">
              <ShieldCheck className="w-4 h-4 text-success" />
              <span>100% Genuine Publisher Edition</span>
            </div>
          </div>
        </div>

        {/* Info & Purchase Column */}
        <div className="md:col-span-7 lg:col-span-8 space-y-6">
          {/* Header & Badges */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={isOutOfStock ? 'danger' : 'success'}>
                {isOutOfStock ? 'Out of Stock' : 'In Stock'}
              </Badge>
              <Badge variant="primary">
                {FORMAT_LABELS[book.format] || book.format}
              </Badge>
              <Badge variant="default">
                {book.language}
              </Badge>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-text tracking-tight">
              {book.title}
            </h1>

            <p className="text-sm text-muted">
              Written by{' '}
              <Link to={authorLink} className="font-semibold text-primary hover:underline">
                {authorName}
              </Link>
              {publisherName && <span> &bull; Published by <span className="text-text font-medium">{publisherName}</span></span>}
            </p>
          </div>

          {/* Pricing Section */}
          <div className="bg-surface p-5 rounded-2xl border border-border space-y-3">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-extrabold text-text">
                {formatRupees(book.unitPrice || book.price)}
              </span>
              {hasDiscount && (
                <>
                  <span className="text-base text-muted line-through">
                    {formatRupees(book.price)}
                  </span>
                  <Badge variant="success" size="lg">
                    {book.discountPercent}% OFF
                  </Badge>
                </>
              )}
            </div>

            {/* Delivery Estimation / Digital Access */}
            {!isDigital ? (
              <div className="pt-2 border-t border-border space-y-2">
                <div className="flex items-center gap-2 text-sm text-text font-medium">
                  <Truck className="w-4 h-4 text-primary shrink-0" />
                  <span>
                    Estimated Delivery:{' '}
                    <span className="font-bold text-text">
                      {book.deliveryDate ? formatDate(book.deliveryDate) : '3-5 business days'}
                    </span>
                  </span>
                </div>

                <form onSubmit={handlePincodeCheck} className="flex items-center gap-2 max-w-xs pt-1">
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
              <div className="pt-2 border-t border-border flex items-center gap-2 text-xs text-success font-medium">
                <Check className="w-4 h-4" />
                <span>Instant Digital Delivery to your E-Library upon purchase</span>
              </div>
            )}

            {/* Action: Add to Cart or Notify Me */}
            <div className="pt-3">
              {isOutOfStock ? (
                <div>
                  {notifySuccess ? (
                    <div className="p-3 bg-success/10 border border-success/20 rounded-xl text-xs text-success font-semibold flex items-center gap-2">
                      <Check className="w-4 h-4" /> You will be notified when this book is back in stock.
                    </div>
                  ) : (
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={handleNotifyMe}
                      loading={isNotifying}
                      className="w-full sm:w-auto"
                    >
                      <Bell className="w-4 h-4 mr-2" /> Notify Me When Available
                    </Button>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3 max-w-xs">
                  <CartControl book={book} size="lg" />
                  <WishlistButton bookId={book.id} inWishlist={Boolean(book.inWishlist)} />
                </div>
              )}
            </div>
          </div>

          {/* Book Synopsis & Details */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-text">Overview & Description</h2>
            <p className="text-sm text-muted leading-relaxed whitespace-pre-line">
              {book.description || 'No detailed description available for this title.'}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              <div className="bg-surface p-3 rounded-xl border border-border">
                <span className="text-[11px] text-muted flex items-center gap-1 mb-1">
                  <Layers className="w-3.5 h-3.5" /> Format
                </span>
                <p className="text-xs font-semibold text-text">{book.format}</p>
              </div>
              <div className="bg-surface p-3 rounded-xl border border-border">
                <span className="text-[11px] text-muted flex items-center gap-1 mb-1">
                  <Globe className="w-3.5 h-3.5" /> Language
                </span>
                <p className="text-xs font-semibold text-text">{book.language}</p>
              </div>
              <div className="bg-surface p-3 rounded-xl border border-border">
                <span className="text-[11px] text-muted flex items-center gap-1 mb-1">
                  <Building className="w-3.5 h-3.5" /> Publisher
                </span>
                <p className="text-xs font-semibold text-text truncate">{publisherName || 'Independent'}</p>
              </div>
              <div className="bg-surface p-3 rounded-xl border border-border">
                <span className="text-[11px] text-muted flex items-center gap-1 mb-1">
                  <Star className="w-3.5 h-3.5" aria-hidden="true" /> Rating
                </span>
                <p className="text-xs font-semibold text-text">
                  {book.reviewCount > 0 ? `${Number(book.rating).toFixed(1)} / 5 (${book.reviewCount})` : 'No ratings yet'}
                </p>
              </div>
              <div className="bg-surface p-3 rounded-xl border border-border">
                <span className="text-[11px] text-muted flex items-center gap-1 mb-1">
                  <ShoppingBag className="w-3.5 h-3.5" aria-hidden="true" /> Sells
                </span>
                <p className="text-xs font-semibold text-text">{book.soldCount ?? 0} copies sold</p>
              </div>
            </div>
          </div>

          {/* About the Writer */}
          {authorName && (
            <Card className="border border-border p-5">
              <CardContent className="p-0 space-y-2">
                <div className="flex items-center gap-2">
                  <Feather className="w-4 h-4 text-primary" />
                  <h2 className="text-sm font-bold text-text">About the Author: {authorName}</h2>
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  {book.writer?.bio || book.authorBio || 'Read more works and explore the complete collection by this writer.'}
                </p>
                <div className="pt-1">
                  <Link to={authorLink} className="text-xs font-semibold text-primary hover:underline">
                    View all books by {authorName} &rarr;
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Related Books Section */}
      {relatedBooks.length > 0 && (
        <section aria-labelledby="related-heading" className="space-y-4 pt-6 border-t border-border">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <h2 id="related-heading" className="text-lg font-bold text-text">
              Readers Also Explored
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {relatedBooks.slice(0, 4).map((relBook) => (
              <BookTile key={relBook.id} book={relBook} />
            ))}
          </div>
        </section>
      )}

      {/* Reviews Section */}
      <section className="space-y-6 pt-6 border-t border-border">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <ReviewList
            bookId={book.id}
            averageRating={book.rating}
            reviewCount={book.reviewCount}
          />
          <ReviewForm bookId={book.id} />
        </div>
      </section>
    </div>
  );
}
