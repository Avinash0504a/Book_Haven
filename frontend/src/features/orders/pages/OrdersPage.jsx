import React from 'react';
import { Link } from 'react-router-dom';
import { Package, ShoppingBag } from 'lucide-react';
import { useOrders } from '../hooks/useOrders.js';
import { OrderCard } from '../components/OrderCard.jsx';
import { Spinner } from '../../../components/ui/Spinner.jsx';
import { EmptyState } from '../../../components/ui/EmptyState.jsx';
import { ErrorState } from '../../../components/ui/ErrorState.jsx';

export function OrdersPage() {
  const { data: orders = [], isLoading, isError, refetch } = useOrders();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24" data-testid="orders-loading">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-xl mx-auto py-12">
        <ErrorState
          title="Could not load orders"
          message="We encountered an issue fetching your order history. Please try again."
          onRetry={refetch}
        />
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <EmptyState
          icon={ShoppingBag}
          title="No Orders Found"
          message="You have not placed any orders yet. Discover your next favorite read in our catalogue!"
          action={
            <Link
              to="/"
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary text-primary-fg font-medium text-sm hover:opacity-90 transition-opacity"
            >
              Browse Books
            </Link>
          }
        />
      </div>
    );
  }

  // Newest first
  const sortedOrders = [...orders].sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <Package className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text">My Orders</h1>
          <p className="text-xs text-muted">View tracking, history, and manage your orders</p>
        </div>
      </div>

      <div className="space-y-4">
        {sortedOrders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>
    </div>
  );
}
