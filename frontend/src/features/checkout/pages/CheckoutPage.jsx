import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, MapPin, AlertCircle } from 'lucide-react';
import { useCart } from '../../cart/hooks/useCart.js';
import { useAddresses } from '../../profile/hooks/useAddresses.js';
import { useAuth } from '../../../providers/AuthProvider.jsx';
import { PointsRedeem } from '../components/PointsRedeem.jsx';
import { PaymentTabs } from '../components/PaymentTabs.jsx';
import {
  useApplyPoints,
  useCreateOrder,
  useConfirmPayment,
  useFailPayment
} from '../hooks/useCheckout.js';
import { Spinner } from '../../../components/ui/Spinner.jsx';
import { Card } from '../../../components/ui/Card.jsx';

export function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart, isLoading: isLoadingCart } = useCart();
  const { data: addresses = [], isLoading: isLoadingAddresses } = useAddresses();
  const { giftPoints, walletBalance, refreshMember } = useAuth();

  const [selectedAddressId, setSelectedAddressId] = useState(
    location.state?.addressId || null
  );
  const [appliedPoints, setAppliedPoints] = useState(0);
  const [discountAmount, setDiscountAmount] = useState('0.00');
  const [serverErrors, setServerErrors] = useState([]);
  const [generalError, setGeneralError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const applyPointsMutation = useApplyPoints();
  const createOrderMutation = useCreateOrder();
  const confirmPaymentMutation = useConfirmPayment();
  const failPaymentMutation = useFailPayment();

  // Set default address if not set
  useEffect(() => {
    if (!selectedAddressId && addresses.length > 0) {
      const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0];
      setSelectedAddressId(defaultAddr.id);
    }
  }, [addresses, selectedAddressId]);

  if (isLoadingCart || isLoadingAddresses) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-4">
        <h2 className="text-xl font-bold text-text">Your cart is empty</h2>
        <p className="text-sm text-muted">You have no items in your cart to checkout.</p>
        <Link
          to="/"
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary text-primary-fg font-medium text-sm hover:opacity-90 transition-opacity"
        >
          Explore Books
        </Link>
      </div>
    );
  }

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);
  const rawTotal = parseFloat(cart.total) || 0;
  const numDiscount = parseFloat(discountAmount) || 0;
  const payableAmount = Math.max(0, rawTotal - numDiscount).toFixed(2);

  const handleApplyPoints = async (pointsToRedeem, callback) => {
    try {
      const result = await applyPointsMutation.mutateAsync({ points: pointsToRedeem });
      setAppliedPoints(result.pointsApplied);
      setDiscountAmount(result.discountAmount);
      callback(null);
    } catch (err) {
      callback(err);
    }
  };

  const handleRemovePoints = () => {
    setAppliedPoints(0);
    setDiscountAmount('0.00');
  };

  const handlePaymentSubmit = async ({ method, details }) => {
    setGeneralError(null);
    setServerErrors([]);
    setIsProcessing(true);

    try {
      // 1. Create PENDING Order (the payment method is part of the order)
      const order = await createOrderMutation.mutateAsync({
        addressId: cart.hasPhysical ? selectedAddressId : null,
        paymentMethod: method,
        giftPointsToUse: appliedPoints
      });

      // 2. Confirm the payment. COD and Wallet take no details; the server confirms the order.
      try {
        const confirmedOrder = await confirmPaymentMutation.mutateAsync({
          orderId: order.id,
          payment: details
        });
        createOrderMutation.resetIdempotencyKey();
        await refreshMember?.();
        navigate('/checkout/confirmation', {
          state: { order: confirmedOrder, success: true },
          replace: true
        });
      } catch (paymentErr) {
        // If payment was rejected or declined, release stock and points
        try {
          await failPaymentMutation.mutateAsync({ orderId: order.id });
        } catch {
          // Ignore fail error
        }
        // The released order must not be reused by a retry with another method
        createOrderMutation.resetIdempotencyKey();
        await refreshMember?.();

        if (paymentErr.fieldErrors && paymentErr.fieldErrors.length > 0) {
          setServerErrors(paymentErr.fieldErrors);
        } else {
          setGeneralError(
            paymentErr.message ||
              'Payment was declined. Your stock and redeemed points have been restored. Please retry with another payment method.'
          );
        }
      }
    } catch (err) {
      if (err.fieldErrors && err.fieldErrors.length > 0) {
        setServerErrors(err.fieldErrors);
      } else if (err.code === 'INSUFFICIENT_STOCK') {
        setGeneralError('One or more items in your cart is out of stock. Please update your cart.');
      } else {
        setGeneralError(err.message || 'Failed to place order. Please try again.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-6 sm:py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/cart"
          className="p-2 rounded-lg border border-border text-muted hover:text-text hover:bg-surface transition-colors"
          aria-label="Back to Cart"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-2xl font-bold text-text">Checkout</h1>
      </div>

      {generalError && (
        <div className="p-4 bg-danger/10 border border-danger/30 rounded-xl flex items-start gap-3 text-sm text-danger">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Checkout Alert</p>
            <p className="mt-0.5">{generalError}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main payment section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Delivery Address Snapshot (for physical goods) */}
          {cart.hasPhysical && (
            <Card className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold text-text">Delivering to</h3>
                </div>
                <Link
                  to="/cart"
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Change Address
                </Link>
              </div>

              {selectedAddress ? (
                <div className="text-sm text-muted space-y-1">
                  <p className="font-medium text-text">{selectedAddress.recipientName} ({selectedAddress.phone})</p>
                  <p>{selectedAddress.line1}{selectedAddress.line2 ? `, ${selectedAddress.line2}` : ''}</p>
                  <p>{selectedAddress.city}, {selectedAddress.state} - {selectedAddress.postalCode}</p>
                </div>
              ) : (
                <p className="text-xs text-danger font-medium">
                  Please select a delivery address in your cart before checkout.
                </p>
              )}
            </Card>
          )}

          {/* Gift points redemption */}
          <PointsRedeem
            availablePoints={giftPoints}
            appliedPoints={appliedPoints}
            discountAmount={discountAmount}
            onApply={handleApplyPoints}
            onRemove={handleRemovePoints}
            isLoading={applyPointsMutation.isPending}
          />

          {/* Payment Tabs */}
          <PaymentTabs
            payableAmount={payableAmount}
            walletBalance={walletBalance}
            hasDigital={cart.hasDigital}
            onSubmit={handlePaymentSubmit}
            isSubmitting={isProcessing}
            serverErrors={serverErrors}
          />
        </div>

        {/* Order Summary Sidebar */}
        <div className="space-y-4">
          <Card className="p-4 sm:p-5 sticky top-20 space-y-4">
            <h3 className="text-base font-semibold text-text">Order Summary</h3>

            <div className="divide-y divide-border text-sm">
              <div className="py-2.5 flex justify-between text-muted">
                <span>Items ({cart.itemCount})</span>
                <span className="font-medium text-text">₹{cart.subtotal}</span>
              </div>
              <div className="py-2.5 flex justify-between text-muted">
                <span>Delivery Charge</span>
                <span className="font-medium text-text">
                  {cart.shippingAmount === '0.00' ? (
                    <span className="text-success font-semibold">FREE</span>
                  ) : (
                    `₹${cart.shippingAmount}`
                  )}
                </span>
              </div>
              {appliedPoints > 0 && (
                <div className="py-2.5 flex justify-between text-success">
                  <span>Gift Points ({appliedPoints} pts)</span>
                  <span className="font-semibold">-₹{discountAmount}</span>
                </div>
              )}
              <div className="pt-3 flex justify-between text-base font-bold text-text">
                <span>Payable Amount</span>
                <span>₹{payableAmount}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-border flex items-center gap-2 text-xs text-muted">
              <ShieldCheck className="w-4 h-4 text-success shrink-0" />
              <span>Safe & Secure 256-bit encrypted checkout</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
