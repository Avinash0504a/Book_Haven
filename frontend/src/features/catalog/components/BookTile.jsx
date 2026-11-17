import React from 'react';
import { Link } from 'react-router-dom';
import { Truck } from 'lucide-react';
import { formatRupees, formatDate, formatDeliveryDate } from '../../../lib/format.js';
import { Badge } from '../../../components/ui/Badge.jsx';
import { Card } from '../../../components/ui/Card.jsx';
import { CartControl } from '../../cart/components/CartControl.jsx';
import WishlistButton from '../../wishlist/components/WishlistButton.jsx';

const FORMAT_LABELS = {
  PAPERBACK: 'Paperback',
  HARDCOVER: 'Hardcover',
  EBOOK: 'E-Book',
  AUDIOBOOK: 'Audiobook'
};

// Whole rupees read cleaner on the home page ("₹399"); keep paise when there are any.
function rupees(amount) {
  const value = Number(amount);
  return formatRupees(amount, { decimals: Number.isInteger(value) ? 0 : 2 });
}

export function BookTile({ book, showCartControl = true, variant = 'card' }) {
  if (!book) return null;

  const authorName = book.author?.name || book.authorName || '';
  const authorSlug = book.author?.slug || book.authorSlug;
  const authorLink = authorSlug ? `/writers/${authorSlug}` : `/writers?search=${encodeURIComponent(authorName)}`;
  const isDigital = book.format === 'EBOOK' || book.format === 'AUDIOBOOK';
  const hasDiscount = book.discountPercent > 0;

  if (variant === 'row') {
    return (
      <article className="flex gap-4 group" aria-label={book.title}>
        {/* Cover on the left */}
        <Link
          to={`/products/${book.id}`}
          className="block relative w-28 sm:w-32 shrink-0 self-start aspect-[2/3] rounded-sm overflow-hidden bg-surface"
        >
          <img
            src={book.coverImageUrl || `/covers/${book.slug}.svg`}
            alt={book.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {!book.inStock && (
            <div className="absolute top-1.5 left-1.5">
              <Badge variant="danger" size="sm">
                Out of Stock
              </Badge>
            </div>
          )}
        </Link>

        {/* Details on the right */}
        <div className="flex flex-col min-w-0 flex-1">
          <Link to={`/products/${book.id}`} className="hover:text-primary transition-colors">
            <h3 className="text-base sm:text-lg font-normal text-text leading-snug line-clamp-2">{book.title}</h3>
          </Link>

          <p className="text-sm text-text mt-1">
            by{' '}
            <Link to={authorLink} className="text-primary underline underline-offset-2">
              {authorName || 'Unknown Author'}
            </Link>
          </p>

          {book.description && (
            <p className="text-xs text-muted mt-2 line-clamp-2" data-testid="tile-description">
              {book.description}
            </p>
          )}

          <p className="text-xs text-text mt-3">{FORMAT_LABELS[book.format] || book.format}</p>
          {book.category?.name && (
            <p className="text-xs mt-1">
              <Link to={`/?category=${book.category.slug}`} className="text-primary underline underline-offset-2">
                {book.category.name}
              </Link>
            </p>
          )}

          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-lg font-bold text-text">{rupees(book.unitPrice || book.price)}</span>
            {hasDiscount && (
              <>
                <span className="text-xs text-muted line-through">{rupees(book.price)}</span>
                <span className="text-xs font-semibold text-success">{book.discountPercent}% OFF</span>
              </>
            )}
          </div>

          {!isDigital && book.deliveryDate && (
            <p className="text-xs text-muted mt-0.5" data-testid="delivery-date">
              Delivery by <span className="font-bold text-text">{formatDeliveryDate(book.deliveryDate)}</span>
            </p>
          )}

          {showCartControl && (
            <div className="mt-3 flex items-center gap-2">
              <div className="w-36 max-w-full">
                <CartControl book={book} size="sm" />
              </div>
              <WishlistButton bookId={book.id} inWishlist={Boolean(book.inWishlist)} />
            </div>
          )}
        </div>
      </article>
    );
  }

  return (
    <Card className="flex flex-col h-full overflow-hidden hover:border-primary/40 transition-all p-3 sm:p-4 group">
      {/* Cover Image */}
      <Link to={`/products/${book.id}`} className="block relative aspect-[2/3] w-full rounded-lg overflow-hidden bg-bg mb-3">
        <img
          src={book.coverImageUrl || `/covers/${book.slug}.svg`}
          alt={book.title}
          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
          loading="lazy"
        />
        {!book.inStock && (
          <div className="absolute top-2 left-2">
            <Badge variant="danger" size="sm">
              Out of Stock
            </Badge>
          </div>
        )}
        {hasDiscount && (
          <div className="absolute top-2 right-2">
            <Badge variant="success" size="sm">
              {book.discountPercent}% OFF
            </Badge>
          </div>
        )}
      </Link>

      {/* Book Metadata */}
      <div className="flex flex-col flex-1 justify-between space-y-2">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] text-muted mb-1">
            <span>{FORMAT_LABELS[book.format] || book.format}</span>
            <span>&bull;</span>
            <span>{book.language}</span>
          </div>

          <Link to={`/products/${book.id}`} className="block group-hover:text-primary transition-colors">
            <h3 className="font-semibold text-sm text-text line-clamp-2 leading-snug">{book.title}</h3>
          </Link>

          <p className="text-xs text-muted truncate mt-0.5">
            by{' '}
            <Link
              to={authorSlug ? `/writers/${authorSlug}` : `/writers?search=${encodeURIComponent(authorName)}`}
              className="hover:underline"
            >
              {authorName || 'Unknown Author'}
            </Link>
          </p>
        </div>

        <div>
          {/* Price */}
          <div className="flex items-baseline gap-1.5 my-1.5">
            <span className="text-base font-bold text-text">
              {formatRupees(book.unitPrice || book.price)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-muted line-through">
                {formatRupees(book.price)}
              </span>
            )}
          </div>

          {/* Delivery Date (Physical items only) */}
          {!isDigital && book.deliveryDate ? (
            <div className="flex items-center gap-1 text-[11px] text-muted mb-3" data-testid="delivery-date">
              <Truck className="w-3 h-3 text-primary shrink-0" aria-hidden="true" />
              <span>Get it by <span className="font-semibold text-text">{formatDate(book.deliveryDate)}</span></span>
            </div>
          ) : (
            <div className="h-4 mb-2" />
          )}

          {/* Cart Control */}
          {showCartControl && (
            <div className="pt-1 flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <CartControl book={book} size="sm" />
              </div>
              <WishlistButton bookId={book.id} inWishlist={Boolean(book.inWishlist)} />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
