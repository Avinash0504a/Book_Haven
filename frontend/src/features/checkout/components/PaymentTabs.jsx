import React, { useState } from 'react';
import { CreditCard, Landmark, Smartphone, Wallet, Truck } from 'lucide-react';
import { Button } from '../../../components/ui/Button.jsx';
import { Input } from '../../../components/ui/Input.jsx';
import { Select } from '../../../components/ui/Select.jsx';
import { useBanks } from '../hooks/useCheckout.js';
import { validatePaymentDetails } from '../../../lib/schemas.js';

export const PAYMENT_METHODS = [
  { id: 'CREDIT_CARD', label: 'Credit Card', icon: CreditCard },
  { id: 'DEBIT_CARD', label: 'Debit Card', icon: CreditCard },
  { id: 'UPI', label: 'UPI', icon: Smartphone },
  { id: 'NET_BANKING', label: 'Net Banking', icon: Landmark },
  { id: 'WALLET', label: 'Book Haven Wallet', icon: Wallet },
  { id: 'COD', label: 'Cash on Delivery', icon: Truck }
];

export function PaymentTabs({
  payableAmount = '0.00',
  walletBalance = '0.00',
  hasDigital = false,
  onSubmit,
  isSubmitting = false,
  serverErrors = []
}) {
  const [selectedMethod, setSelectedMethod] = useState('CREDIT_CARD');
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    cardName: '',
    expiry: '',
    cvv: ''
  });
  const [upiDetails, setUpiDetails] = useState({ upiId: '' });
  const [netBankingDetails, setNetBankingDetails] = useState({ bankCode: '' });
  const [clientErrors, setClientErrors] = useState({});

  const { data: banks = [], isLoading: isLoadingBanks } = useBanks();

  const numPayable = parseFloat(payableAmount) || 0;
  const numWallet = parseFloat(walletBalance) || 0;
  const isWalletInsufficient = numWallet < numPayable;

  const getFieldError = (fieldName) => {
    if (clientErrors[fieldName]) return clientErrors[fieldName];
    const serverErr = serverErrors.find((err) => err.field === fieldName || err.field === `payment.${fieldName}`);
    return serverErr?.message || null;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setClientErrors({});

    let details = {};
    if (selectedMethod === 'CREDIT_CARD' || selectedMethod === 'DEBIT_CARD') {
      details = cardDetails;
    } else if (selectedMethod === 'UPI') {
      details = upiDetails;
    } else if (selectedMethod === 'NET_BANKING') {
      details = netBankingDetails;
    }

    if (selectedMethod === 'WALLET' && isWalletInsufficient) {
      setClientErrors({ wallet: 'Insufficient wallet balance to complete this order.' });
      return;
    }

    if (selectedMethod === 'COD' && hasDigital) {
      setClientErrors({ cod: 'Cash on Delivery is not available for orders with digital items.' });
      return;
    }

    const validation = validatePaymentDetails(selectedMethod, details);
    if (!validation.isValid) {
      const errMap = {};
      validation.errors.forEach((err) => {
        const shortField = err.field.replace('payment.', '');
        errMap[shortField] = err.message;
      });
      setClientErrors(errMap);
      return;
    }

    onSubmit({
      method: selectedMethod,
      details
    });
  };

  return (
    <div className="bg-surface border border-border rounded-xl p-4 sm:p-6">
      <h2 className="text-lg font-semibold text-text mb-4">Payment Method</h2>

      {/* Tabs list */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6" role="tablist">
        {PAYMENT_METHODS.map((method) => {
          const Icon = method.icon;
          const isSelected = selectedMethod === method.id;
          const isCodDisabled = method.id === 'COD' && hasDigital;

          return (
            <button
              key={method.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              disabled={isCodDisabled}
              onClick={() => {
                if (!isCodDisabled) {
                  setSelectedMethod(method.id);
                  setClientErrors({});
                }
              }}
              className={`flex items-center gap-2 p-3 rounded-lg border text-xs sm:text-sm font-medium transition-all text-left cursor-pointer ${
                isCodDisabled
                  ? 'opacity-40 cursor-not-allowed bg-bg/50 border-border text-muted'
                  : isSelected
                  ? 'bg-primary/10 border-primary text-primary shadow-sm'
                  : 'bg-bg border-border text-muted hover:text-text hover:border-border/80'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{method.label}</span>
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Credit / Debit Card Form */}
        {(selectedMethod === 'CREDIT_CARD' || selectedMethod === 'DEBIT_CARD') && (
          <div className="space-y-4">
            <Input
              label="Card Number"
              placeholder="1234 5678 9012 3456"
              maxLength={19}
              value={cardDetails.cardNumber}
              onChange={(e) => setCardDetails({ ...cardDetails, cardNumber: e.target.value })}
              error={getFieldError('cardNumber')}
              autoComplete="cc-number"
            />
            <Input
              label="Name on Card"
              placeholder="e.g. John Doe"
              maxLength={50}
              value={cardDetails.cardName}
              onChange={(e) => setCardDetails({ ...cardDetails, cardName: e.target.value })}
              error={getFieldError('cardName')}
              autoComplete="cc-name"
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Expiry Date"
                placeholder="MM/YYYY"
                maxLength={7}
                value={cardDetails.expiry}
                onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                error={getFieldError('expiry')}
                autoComplete="cc-exp"
              />
              <Input
                label="CVV"
                placeholder="123"
                maxLength={3}
                type="password"
                value={cardDetails.cvv}
                onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                error={getFieldError('cvv')}
                autoComplete="cc-csc"
              />
            </div>
          </div>
        )}

        {/* UPI Form */}
        {selectedMethod === 'UPI' && (
          <div className="space-y-4">
            <Input
              label="UPI ID"
              placeholder="e.g. username@okhdfcbank"
              value={upiDetails.upiId}
              onChange={(e) => setUpiDetails({ upiId: e.target.value })}
              error={getFieldError('upiId')}
            />
            <p className="text-xs text-muted">
              Enter your Virtual Payment Address (VPA) / UPI ID to receive a payment request.
            </p>
          </div>
        )}

        {/* Net Banking Form */}
        {selectedMethod === 'NET_BANKING' && (
          <div className="space-y-4">
            <Select
              label="Select Bank"
              value={netBankingDetails.bankCode}
              onChange={(e) => setNetBankingDetails({ bankCode: e.target.value })}
              error={getFieldError('bankCode')}
              options={[
                { value: '', label: isLoadingBanks ? 'Loading banks...' : 'Choose a bank' },
                ...banks.map((b) => ({ value: b.code, label: b.name }))
              ]}
            />
          </div>
        )}

        {/* Book Haven Wallet */}
        {selectedMethod === 'WALLET' && (
          <div className="p-4 bg-bg border border-border rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Book Haven Wallet Balance:</span>
              <span className="text-base font-bold text-text">₹{walletBalance}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted">
              <span>Payable Amount:</span>
              <span className="font-semibold text-text">₹{payableAmount}</span>
            </div>
            {isWalletInsufficient ? (
              <p className="text-xs text-danger font-medium mt-2">
                Insufficient wallet balance. Please choose another payment method or top up your wallet.
              </p>
            ) : (
              <p className="text-xs text-success font-medium mt-2">
                Your wallet balance is sufficient for this order.
              </p>
            )}
            {clientErrors.wallet && (
              <p className="text-xs text-danger font-medium">{clientErrors.wallet}</p>
            )}
          </div>
        )}

        {/* Cash on Delivery */}
        {selectedMethod === 'COD' && (
          <div className="p-4 bg-bg border border-border rounded-lg space-y-2">
            <h4 className="text-sm font-semibold text-text">Cash on Delivery</h4>
            <p className="text-xs text-muted">
              Pay in cash or digital payment when your order is delivered to your doorstep.
            </p>
            {hasDigital && (
              <p className="text-xs text-danger font-medium mt-1">
                COD is disabled because your cart contains digital items (eBooks / Audiobooks).
              </p>
            )}
            {clientErrors.cod && (
              <p className="text-xs text-danger font-medium">{clientErrors.cod}</p>
            )}
          </div>
        )}

        {/* Submit button */}
        <div className="pt-4 border-t border-border">
          <Button
            type="submit"
            className="w-full"
            size="lg"
            isLoading={isSubmitting}
            disabled={
              isSubmitting ||
              (selectedMethod === 'WALLET' && isWalletInsufficient) ||
              (selectedMethod === 'COD' && hasDigital)
            }
          >
            {selectedMethod === 'COD' ? 'Place Order (COD)' : `Pay ₹${payableAmount}`}
          </Button>
        </div>
      </form>
    </div>
  );
}
