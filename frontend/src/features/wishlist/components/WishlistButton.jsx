import { useAuth } from '../../auth/hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToggleWishlist } from '../hooks/useWishlist';

export default function WishlistButton({ bookId, inWishlist = false, className = '', showLabel = false }) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toggleMutation = useToggleWishlist();

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } });
      return;
    }

    toggleMutation.mutate({ bookId, inWishlist });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={toggleMutation.isPending}
      aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
      title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
      className={`${
        showLabel ? 'px-4 py-2 rounded-md gap-2 text-sm font-medium border border-border' : 'p-2 rounded-full'
      } transition-colors flex items-center justify-center ${
        inWishlist
          ? 'text-danger bg-danger/10 hover:bg-surface'
          : 'text-text hover:text-primary bg-surface/80 hover:bg-surface shadow-sm'
      } ${className}`}
    >
      <svg
        className="w-5 h-5"
        fill={inWishlist ? 'currentColor' : 'none'}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
      {showLabel && <span aria-hidden="true">{inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}</span>}
    </button>
  );
}
