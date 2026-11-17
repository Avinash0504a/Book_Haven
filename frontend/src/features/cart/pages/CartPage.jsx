import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../hooks/useCart.js';
import { Button, Card, Badge, EmptyState, Spinner } from '../../../components/ui/index.js';
import { FreeDeliveryBar } from '../components/FreeDeliveryBar.jsx';
import { AddressSelector } from '../components/AddressSelector.jsx';
import { formatRupees } from '../../../lib/format.js';
import { Trash2, ArrowRight, ShoppingBag, ShieldCheck } from 'lucide-react';

export function CartPage() {
  const { cart, isLoading, updateItem, removeItem, isUpdating, isRemoving } = useCart();
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const items = cart.items || [];

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <EmptyState
          icon={ShoppingBag}
          title="Your Cart is Empty"
          description="Looks like you haven't added any books to your cart yet. Explore our curated collection!"
          actionLabel="Explore Books"
          onAction={() => navigate('/')}
        />
      </div>
    );
  }

  const handleQuantityChange = async (itemId, newQty) => {
    if (newQty <= 0) {
      await removeItem(itemId);
    } else {
      await updateItem({ itemId, quantity: newQty });
    }
  };

  const handleCheckout = () => {
    if (cart.hasPhysical && !selectedAddressId) {
      return;
    }
    navigate('/checkout', { state: { addressId: selectedAddressId } });
  };

  const canProceed = !cart.hasPhysical || !!selectedAddressId;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-text">Shopping Cart</h1>
        <p className="text-sm text-muted mt-1">
          {cart.itemCount} {cart.itemCount === 1 ? 'item' : 'items'} in your cart
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Items & Delivery Details */}
        <div className="lg:col-span-2 space-y-6">
          {cart.hasPhysical && (
            <FreeDeliveryBar
              freeShippingRemaining={cart.freeShippingRemaining}
              subtotal={cart.subtotal}
            />
          )}

          {/* Cart Items List */}
          <div className="space-y-4">
            {items.map((item) => (
              <Card key={item.itemId} className="p-4 sm:p-5">
                <div className="flex gap-4">
                  <Link
                    to={`/products/${item.slug || item.bookId}`}
                    className="shrink-0 w-20 sm:w-24 h-28 sm:h-32 bg-surface rounded-lg overflow-hidden border border-border flex items-center justify-center"
                  >
                    <img
                      src={item.coverImageUrl || '/covers/default.svg'}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </Link>

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          to={`/products/${item.slug || item.bookId}`}
                          className="font-semibold text-text hover:text-primary transition-colors line-clamp-1"
                        >
                          {item.title}
                        </Link>
                        <button
                          type="button"
                          onClick={() => removeItem(item.itemId)}
                          disabled={isRemoving}
                          aria-label={`Remove ${item.title} from cart`}
                          className="text-muted hover:text-danger p-1 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <p className="text-xs text-muted mt-0.5">{item.authorName}</p>

                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" size="sm">
                          {item.format}
                        </Badge>
                        {item.format === 'EBOOK' || item.format === 'AUDIOBOOK' ? (
                          <Badge variant="primary" size="sm">
                            Instant Access
                          </Badge>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-end justify-between gap-4 mt-4 pt-3 border-t border-border">
                      {/* Quantity Stepper */}
                      <div className="flex items-center gap-1.5 border border-border rounded-lg p-1 bg-bg">
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          disabled={isUpdating || item.quantity <= 1}
                          onClick={() => handleQuantityChange(item.itemId, item.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center rounded text-text hover:bg-surface disabled:opacity-40"
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-sm font-semibold text-text" aria-label={`Quantity: ${item.quantity}`}>
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          disabled={isUpdating || item.quantity >= 10}
                          onClick={() => handleQuantityChange(item.itemId, item.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center rounded text-text hover:bg-surface disabled:opacity-40"
                        >
                          +
                        </button>
                      </div>

                      {/* Prices */}
                      <div className="text-right">
                        <div className="text-base font-bold text-text">
                          {formatRupees(item.lineTotal || item.unitPrice * item.quantity)}
                        </div>
                        {item.discountPercent > 0 && (
                          <div className="text-xs text-muted">
                            <span className="line-through mr-1">
                              {formatRupees(item.price * item.quantity)}
                            </span>
                            <span className="text-success font-medium">
                              {item.discountPercent}% OFF
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Delivery Address Selector (Physical/Mixed Carts Only) */}
          {cart.hasPhysical && (
            <AddressSelector
              selectedAddressId={selectedAddressId}
              onSelectAddress={setSelectedAddressId}
            />
          )}
        </div>

        {/* Right Column: Order Summary */}
        <div className="lg:col-span-1">
          <Card className="p-6 sticky top-20 space-y-5">
            <h2 className="text-lg font-bold text-text border-b border-border pb-3">
              Order Summary
            </h2>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between text-muted">
                <span>Items Subtotal ({cart.itemCount})</span>
                <span className="font-semibold text-text">{formatRupees(cart.subtotal)}</span>
              </div>

              <div className="flex items-center justify-between text-muted">
                <span>Delivery Charge</span>
                <span className="font-semibold text-text">
                  {cart.shippingAmount === '0.00' || Number(cart.shippingAmount) === 0 ? (
                    <span className="text-success">FREE</span>
                  ) : (
                    formatRupees(cart.shippingAmount)
                  )}
                </span>
              </div>

              <div className="border-t border-border pt-3 flex items-center justify-between text-base font-bold text-text">
                <span>Grand Total</span>
                <span className="text-lg text-primary">{formatRupees(cart.total)}</span>
              </div>
            </div>

            {/* Gift Points Hint */}
            {cart.pointsToEarn > 0 && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-xs text-text">
                <span className="font-semibold text-primary">🎁 Reward:</span> You will earn{' '}
                <span className="font-bold text-primary">{cart.pointsToEarn} Gift Points</span> on this order!
              </div>
            )}

            {/* Address missing alert for physical items */}
            {cart.hasPhysical && !selectedAddressId && (
              <p className="text-xs text-danger font-medium text-center">
                Please select or add a delivery address to continue.
              </p>
            )}

            <Button
              type="button"
              variant="primary"
              size="lg"
              className="w-full gap-2 text-base font-semibold"
              disabled={!canProceed}
              onClick={handleCheckout}
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-5 h-5" aria-hidden="true" />
            </Button>

            <div className="flex items-center justify-center gap-1.5 text-xs text-muted pt-2 border-t border-border">
              <ShieldCheck className="w-4 h-4 text-success" aria-hidden="true" />
              <span>100% Safe & Secure Checkout</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
export default CartPage;
