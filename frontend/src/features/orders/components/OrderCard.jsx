import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, ChevronRight, RotateCcw, XCircle } from 'lucide-react';
import { Card } from '../../../components/ui/Card.jsx';
import { Badge } from '../../../components/ui/Badge.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { OrderTracker } from './OrderTracker.jsx';
import { CancelOrderModal } from './CancelOrderModal.jsx';
import { useBuyAgain } from '../hooks/useOrders.js';
import { isDigitalOnly } from '../../../lib/orderHelpers.js';

export function OrderCard({ order }) {
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [buyAgainMsg, setBuyAgainMsg] = useState(null);
  const buyAgainMutation = useBuyAgain();
  const navigate = useNavigate();

  const items = order.items || [];
  const digitalOnly = isDigitalOnly(items);
  const status = order.status || 'CONFIRMED';
  const cancellable = Boolean(order.cancellable);

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

  const getStatusBadgeVariant = (st) => {
    switch (st) {
      case 'DELIVERED':
        return 'success';
      case 'CANCELLED':
        return 'danger';
      case 'SHIPPED':
      case 'PROCESSING':
        return 'primary';
      default:
        return 'outline';
    }
  };

  return (
    <>
      <Card className="p-4 sm:p-6 space-y-4">
        {/* Order Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border text-sm">
          <div className="space-y-0.5">
            <span className="text-xs text-muted">Order</span>
            <p className="font-bold text-text">#{order.orderNumber || order.id?.substring(0, 8)}</p>
          </div>
          {order.createdAt && (
            <div className="text-right sm:text-left space-y-0.5">
              <span className="text-xs text-muted">Date</span>
              <p className="text-xs font-medium text-text">{new Date(order.createdAt).toLocaleDateString()}</p>
            </div>
          )}
          <div className="space-y-0.5">
            <span className="text-xs text-muted">Total</span>
            <p className="font-bold text-text">₹{order.grandTotal || order.payableAmount || order.total}</p>
          </div>
          <div>
            <Badge variant={getStatusBadgeVariant(status)}>{status}</Badge>
          </div>
        </div>

        {/* Tracker */}
        <OrderTracker status={status} />

        {/* Items Preview */}
        <div className="space-y-2 pt-2">
          {items.map((item, idx) => (
            <div key={item.bookId || idx} className="flex items-center justify-between text-sm py-1">
              <div className="flex items-center gap-3 min-w-0">
                {item.coverImageUrl && (
                  <img
                    src={item.coverImageUrl}
                    alt={item.title}
                    className="w-10 h-14 object-cover rounded bg-surface shrink-0"
                  />
                )}
                <div className="min-w-0">
                  <p className="font-medium text-text truncate">{item.title}</p>
                  <p className="text-xs text-muted truncate">
                    {item.format} • Qty: {item.quantity}
                  </p>
                </div>
              </div>
              <span className="font-semibold text-text text-xs shrink-0">₹{item.lineTotal || item.price}</span>
            </div>
          ))}
        </div>

        {buyAgainMsg && (
          <p className="text-xs text-primary font-medium p-2 bg-primary/10 rounded-lg">{buyAgainMsg}</p>
        )}

        {/* Actions Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border">
          <Link
            to={`/orders/${order.id}`}
            className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-primary hover:underline"
          >
            <span>View Order Details</span>
            <ChevronRight className="w-4 h-4" />
          </Link>

          <div className="flex items-center gap-2">
            {cancellable && (
              <Button
                variant="outline"
                size="sm"
                className="text-danger border-danger/30 hover:bg-danger/10"
                onClick={() => setIsCancelOpen(true)}
              >
                <XCircle className="w-3.5 h-3.5 mr-1" />
                Cancel
              </Button>
            )}

            {digitalOnly ? (
              <Button variant="secondary" size="sm" onClick={() => navigate('/library')}>
                <BookOpen className="w-3.5 h-3.5 mr-1" />
                View Book
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleBuyAgain}
                isLoading={buyAgainMutation.isPending}
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                Buy Again
              </Button>
            )}
          </div>
        </div>
      </Card>

      <CancelOrderModal
        order={order}
        isOpen={isCancelOpen}
        onClose={() => setIsCancelOpen(false)}
      />
    </>
  );
}
