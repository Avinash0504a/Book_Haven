import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertCircle, ShoppingBag, ArrowRight, Gift, Calendar, MapPin } from 'lucide-react';
import { Button } from '../../../components/ui/Button.jsx';
import { Card } from '../../../components/ui/Card.jsx';
import { Badge } from '../../../components/ui/Badge.jsx';
import { isDigitalOnly } from '../../../lib/orderHelpers.js';

export function ConfirmationPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const order = location.state?.order;
  const isSuccess = location.state?.success ?? Boolean(order && order.status !== 'FAILED');
  const failureMessage = location.state?.failureMessage || 'Payment could not be completed.';

  if (!order && !location.state?.failed) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
          <ShoppingBag className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-text">No Recent Order</h2>
        <p className="text-sm text-muted">You have no active confirmation to display.</p>
        <Link
          to="/"
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary text-primary-fg font-medium text-sm hover:opacity-90 transition-opacity"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  // Failed payment state with Retry
  if (!isSuccess || location.state?.failed) {
    return (
      <div className="max-w-xl mx-auto py-12 space-y-6">
        <Card className="p-6 text-center space-y-4 border-danger/30 bg-danger/5">
          <div className="w-12 h-12 rounded-full bg-danger/10 text-danger mx-auto flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-text">Payment Failed</h2>
          <p className="text-sm text-muted max-w-md mx-auto">
            {failureMessage} Any reserved stock and redeemed points have been restored to your account.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="primary"
              onClick={() => navigate('/checkout', { replace: true })}
            >
              Retry Payment
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigate('/cart')}
            >
              Return to Cart
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const items = order.items || [];
  const digitalOnly = isDigitalOnly(items);
  const pointsEarned = order.pointsEarned ?? 0;
  const deliveryDate = order.estimatedDeliveryDate || order.deliveryEstimate;

  return (
    <div className="max-w-3xl mx-auto py-8 sm:py-12 space-y-8">
      {/* Success Banner */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-full bg-success/10 text-success mx-auto flex items-center justify-center shadow-sm">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-text tracking-tight">
          Order Placed Successfully!
        </h1>
        <p className="text-sm text-muted">
          Thank you for your purchase. We have received your order{' '}
          <span className="font-semibold text-text">#{order.id?.substring(0, 8) || order.orderNumber}</span>.
        </p>
      </div>

      {/* Points Earned Pill (Server computed) */}
      {pointsEarned > 0 && (
        <div className="flex items-center justify-center gap-2 p-3 bg-primary/10 border border-primary/20 rounded-xl text-sm text-primary font-medium">
          <Gift className="w-4 h-4 shrink-0" />
          <span>
            You earned <span className="font-bold">{pointsEarned} Gift Points</span> with this order!
          </span>
        </div>
      )}

      {/* Order Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {deliveryDate && (
          <Card className="p-4 flex items-start gap-3">
            <Calendar className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-muted">Estimated Delivery</p>
              <p className="text-sm font-semibold text-text mt-0.5">{deliveryDate}</p>
            </div>
          </Card>
        )}

        {order.shippingAddress && (
          <Card className="p-4 flex items-start gap-3">
            <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-muted">Delivery Address</p>
              <p className="text-sm font-semibold text-text mt-0.5">
                {order.shippingAddress.recipientName} ({order.shippingAddress.postalCode})
              </p>
            </div>
          </Card>
        )}
      </div>

      {/* Order Items */}
      <Card className="p-4 sm:p-6 space-y-4">
        <h3 className="text-base font-semibold text-text">Purchased Books</h3>
        <div className="divide-y divide-border">
          {items.map((item, idx) => (
            <div key={item.bookId || idx} className="py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                {item.coverImageUrl && (
                  <img
                    src={item.coverImageUrl}
                    alt={item.title}
                    className="w-12 h-16 object-cover rounded shadow-xs bg-surface shrink-0"
                  />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text truncate">{item.title}</p>
                  <p className="text-xs text-muted truncate">{item.authorName}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" size="sm">{item.format}</Badge>
                    <span className="text-xs text-muted">Qty: {item.quantity}</span>
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-text">₹{item.lineTotal || item.price}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="pt-4 border-t border-border space-y-1.5 text-sm">
          <div className="flex justify-between text-muted">
            <span>Subtotal:</span>
            <span className="font-medium text-text">₹{order.subtotal}</span>
          </div>
          <div className="flex justify-between text-muted">
            <span>Delivery:</span>
            <span className="font-medium text-text">
              {order.shippingAmount === '0.00' ? (
                <span className="text-success font-semibold">FREE</span>
              ) : (
                `₹${order.shippingAmount}`
              )}
            </span>
          </div>
          {order.pointsDiscountAmount && order.pointsDiscountAmount !== '0.00' && (
            <div className="flex justify-between text-success">
              <span>Points Discount:</span>
              <span className="font-semibold">-₹{order.pointsDiscountAmount}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold text-text pt-2 border-t border-border">
            <span>Grand Total Paid:</span>
            <span>₹{order.grandTotal || order.payableAmount || order.total}</span>
          </div>
        </div>
      </Card>

      {/* Navigation Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link to="/" className="w-full sm:w-auto">
          <Button variant="primary" size="lg" className="w-full sm:w-auto gap-2">
            <span>Continue Shopping</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
        {digitalOnly ? (
          <Link to="/library" className="w-full sm:w-auto">
            <Button variant="secondary" size="lg" className="w-full sm:w-auto">
              View Book
            </Button>
          </Link>
        ) : (
          <Link to="/orders" className="w-full sm:w-auto">
            <Button variant="secondary" size="lg" className="w-full sm:w-auto">
              View My Orders
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
