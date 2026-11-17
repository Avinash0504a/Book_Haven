import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, MapPin, CreditCard, Gift, Calendar, RotateCcw, XCircle, ShieldAlert } from 'lucide-react';
import { useOrder, useBuyAgain } from '../hooks/useOrders.js';
import { OrderTracker } from '../components/OrderTracker.jsx';
import { CancelOrderModal } from '../components/CancelOrderModal.jsx';
import { Spinner } from '../../../components/ui/Spinner.jsx';
import { Card } from '../../../components/ui/Card.jsx';
import { Badge } from '../../../components/ui/Badge.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { ErrorState } from '../../../components/ui/ErrorState.jsx';
import { isDigitalOnly } from '../../../lib/orderHelpers.js';

export function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: order, isLoading, isError, error, refetch } = useOrder(id);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [buyAgainMsg, setBuyAgainMsg] = useState(null);

  const buyAgainMutation = useBuyAgain();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24" data-testid="order-detail-loading">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError || !order) {
    const isNotFound = error?.response?.status === 404 || error?.status === 404;
    return (
      <div className="max-w-xl mx-auto py-16">
        <ErrorState
          title={isNotFound ? 'Order Not Found' : 'Could not load order'}
          message={
            isNotFound
              ? 'This order does not exist or you do not have permission to view it.'
              : 'Failed to load order details. Please try again.'
          }
          onRetry={refetch}
          action={
            <Link
              to="/orders"
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-surface border border-border text-text font-medium text-sm hover:bg-border/30 transition-colors"
            >
              Back to My Orders
            </Link>
          }
        />
      </div>
    );
  }

  const items = order.items || [];
  const digitalOnly = isDigitalOnly(items);
  const status = order.status || 'CONFIRMED';
  const cancellable = Boolean(order.cancellable);
  const cancellations = order.cancellations || [];

  const handleBuyAgain = async () => {
    try {
      const res = await buyAgainMutation.mutateAsync(order.id);
      if (res.unavailable && res.unavailable.length > 0) {
        setBuyAgainMsg(`Added available items. Note: ${res.unavailable.join(', ')} is currently unavailable.`);
      } else {
        navigate('/cart');
      }
    } catch {
      setBuyAgainMsg('Could not add items to cart.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/orders"
            className="p-2 rounded-lg border border-border text-muted hover:text-text hover:bg-surface transition-colors"
            aria-label="Back to Orders"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-text">
              Order #{order.orderNumber || order.id?.substring(0, 8)}
            </h1>
            {order.createdAt && (
              <p className="text-xs text-muted">
                Placed on {new Date(order.createdAt).toLocaleDateString()} at{' '}
                {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {cancellable && (
            <Button
              variant="outline"
              size="sm"
              className="text-danger border-danger/30 hover:bg-danger/10"
              onClick={() => setIsCancelOpen(true)}
            >
              <XCircle className="w-4 h-4 mr-1.5" />
              Cancel Order
            </Button>
          )}

          {digitalOnly ? (
            <Button variant="secondary" size="sm" onClick={() => navigate('/library')}>
              <BookOpen className="w-4 h-4 mr-1.5" />
              View Book
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleBuyAgain}
              isLoading={buyAgainMutation.isPending}
            >
              <RotateCcw className="w-4 h-4 mr-1.5" />
              Buy Again
            </Button>
          )}
        </div>
      </div>

      {buyAgainMsg && (
        <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl text-xs text-primary font-medium">
          {buyAgainMsg}
        </div>
      )}

      {/* Tracker Card */}
      <Card className="p-4 sm:p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text">Order Status</h2>
          <Badge variant={status === 'DELIVERED' ? 'success' : status === 'CANCELLED' ? 'danger' : 'primary'}>
            {status}
          </Badge>
        </div>
        <OrderTracker status={status} />
      </Card>

      {/* Grid: Delivery & Payment Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {order.shippingAddress && (
          <Card className="p-4 sm:p-5 space-y-2">
            <div className="flex items-center gap-2 text-primary font-semibold text-sm">
              <MapPin className="w-4 h-4" />
              <h3>Delivery Address</h3>
            </div>
            <div className="text-sm text-muted space-y-0.5 pt-1">
              <p className="font-medium text-text">{order.shippingAddress.recipientName} ({order.shippingAddress.phone})</p>
              <p>{order.shippingAddress.line1}{order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ''}</p>
              <p>{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.postalCode}</p>
            </div>
          </Card>
        )}

        <Card className="p-4 sm:p-5 space-y-2">
          <div className="flex items-center gap-2 text-primary font-semibold text-sm">
            <CreditCard className="w-4 h-4" />
            <h3>Payment Information</h3>
          </div>
          <div className="text-sm text-muted space-y-1 pt-1">
            <p className="text-text font-medium">Method: {order.paymentMethod || 'Online Payment'}</p>
            {order.pointsEarned > 0 && (
              <p className="text-xs text-success flex items-center gap-1">
                <Gift className="w-3.5 h-3.5" />
                <span>Points Earned: +{order.pointsEarned} pts</span>
              </p>
            )}
            {order.estimatedDeliveryDate && (
              <p className="text-xs text-muted flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Estimated: {order.estimatedDeliveryDate}</span>
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* Items Table */}
      <Card className="p-4 sm:p-6 space-y-4">
        <h3 className="text-base font-semibold text-text">Items in this Order</h3>

        <div className="divide-y divide-border">
          {items.map((item, idx) => (
            <div key={item.bookId || idx} className="py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                {item.coverImageUrl && (
                  <img
                    src={item.coverImageUrl}
                    alt={item.title}
                    className="w-12 h-16 object-cover rounded bg-surface shadow-2xs shrink-0"
                  />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text truncate">{item.title}</p>
                  <p className="text-xs text-muted truncate">{item.authorName}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" size="sm">{item.format}</Badge>
                    <span className="text-xs text-muted">Qty: {item.quantity}</span>
                    <span className="text-xs text-muted">@ ₹{item.unitPrice || item.price}</span>
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-text">₹{item.lineTotal || item.price}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Pricing Summary */}
        <div className="pt-4 border-t border-border space-y-2 text-sm">
          <div className="flex justify-between text-muted">
            <span>Subtotal:</span>
            <span className="font-medium text-text">₹{order.subtotal}</span>
          </div>
          <div className="flex justify-between text-muted">
            <span>Delivery Charge:</span>
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
              <span>Points Redeemed ({order.pointsRedeemed || 0} pts):</span>
              <span className="font-semibold">-₹{order.pointsDiscountAmount}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold text-text pt-2 border-t border-border">
            <span>Grand Total:</span>
            <span>₹{order.grandTotal || order.payableAmount || order.total}</span>
          </div>
        </div>
      </Card>

      {/* Cancellations Log (if any) */}
      {cancellations.length > 0 && (
        <Card className="p-4 sm:p-6 space-y-3 border-danger/30">
          <div className="flex items-center gap-2 text-danger font-semibold text-sm">
            <ShieldAlert className="w-4 h-4" />
            <h3>Cancellation History</h3>
          </div>
          <div className="divide-y divide-border text-xs sm:text-sm text-muted">
            {cancellations.map((c) => (
              <div key={c.id} className="py-2.5 space-y-1">
                <div className="flex justify-between font-medium text-text">
                  <span>Reason: {c.reason}</span>
                  <span className="text-danger">Refund: ₹{c.refundAmount}</span>
                </div>
                <div className="flex justify-between text-xs text-muted">
                  <span>Method: {c.refundMethod} ({c.refundDestination})</span>
                  {c.pointsRestored > 0 && (
                    <span className="text-success font-medium">+{c.pointsRestored} pts restored</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <CancelOrderModal
        order={order}
        isOpen={isCancelOpen}
        onClose={() => setIsCancelOpen(false)}
        onCancelled={() => refetch()}
      />
    </div>
  );
}
