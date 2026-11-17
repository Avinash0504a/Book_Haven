import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Plus, Minus, ShoppingCart, Check } from 'lucide-react';
import { useAuth } from '../../../providers/AuthProvider.jsx';
import { useCart } from '../hooks/useCart.js';
import { Button } from '../../../components/ui/Button.jsx';

export function CartControl({ book, size = 'md', className = '' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { cart, addItem, updateItem, isAdding, isUpdating } = useCart();
  const [stockMessage, setStockMessage] = useState(null);

  if (!book) return null;

  const isOutOfStock = !book.inStock || (book.format !== 'EBOOK' && book.format !== 'AUDIOBOOK' && book.stockQuantity <= 0);

  // Find item in cart
  const cartItem = cart.items?.find((item) => item.bookId === book.id);
  const quantity = cartItem?.quantity || 0;

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } });
      return;
    }

    setStockMessage(null);
    try {
      await addItem({ bookId: book.id, quantity: 1 });
    } catch (err) {
      setStockMessage(err.message || 'Could not add item to cart');
    }
  };

  const handleIncrement = async () => {
    setStockMessage(null);
    const maxStock = (book.format === 'EBOOK' || book.format === 'AUDIOBOOK') ? 10 : Math.min(10, book.stockQuantity || 10);
    if (quantity >= maxStock) {
      setStockMessage(`Max available stock limit (${maxStock}) reached`);
      return;
    }

    try {
      await updateItem({ itemId: cartItem.itemId, quantity: quantity + 1 });
    } catch (err) {
      setStockMessage(err.message || 'Cannot increase quantity');
    }
  };

  const handleDecrement = async () => {
    setStockMessage(null);
    try {
      await updateItem({ itemId: cartItem.itemId, quantity: quantity - 1 });
    } catch (err) {
      setStockMessage(err.message || 'Cannot decrease quantity');
    }
  };

  if (isOutOfStock) {
    return (
      <div className={`text-xs text-muted font-medium py-1.5 ${className}`}>
        Out of Stock
      </div>
    );
  }

  if (quantity === 0) {
    return (
      <div className={className}>
        <Button
          variant="primary"
          size={size}
          onClick={handleAddToCart}
          loading={isAdding}
          className="w-full"
          aria-label={`Add ${book.title} to cart`}
        >
          <ShoppingCart className="w-4 h-4 mr-1.5" />
          <span>Add to Cart</span>
        </Button>
        {stockMessage && (
          <p className="mt-1 text-[11px] text-danger" role="alert">
            {stockMessage}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between border border-primary/30 bg-primary/5 rounded-lg p-1">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={isUpdating}
          className="w-7 h-7 rounded-md bg-surface text-text hover:bg-border/50 flex items-center justify-center transition-colors disabled:opacity-50 cursor-pointer"
          aria-label="Decrease quantity"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        <span className="text-xs font-bold text-text px-2" aria-label={`Quantity in cart: ${quantity}`}>
          {quantity}
        </span>

        <button
          type="button"
          onClick={handleIncrement}
          disabled={isUpdating}
          className="w-7 h-7 rounded-md bg-surface text-text hover:bg-border/50 flex items-center justify-center transition-colors disabled:opacity-50 cursor-pointer"
          aria-label="Increase quantity"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center justify-between text-[11px]">
        <span className="text-success font-medium flex items-center gap-1">
          <Check className="w-3 h-3" /> Added
        </span>
        <Link to="/cart" className="text-primary font-semibold hover:underline">
          Go to Cart &rarr;
        </Link>
      </div>

      {stockMessage && (
        <p className="text-[11px] text-danger" role="alert">
          {stockMessage}
        </p>
      )}
    </div>
  );
}
