import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { topUpSchema, validatePaymentDetails, SUPPORTED_BANK_CODES } from '../../../lib/schemas';
import { getErrorMessage, getFieldErrors } from '../../../lib/errors';
import { useAuth } from '../../auth/hooks/useAuth';
import { useTopUp } from '../hooks/useWallet';
import { useBanks } from '../../checkout/hooks/useCheckout';
import { Button } from '../../../components/ui/Button.jsx';
import { Input } from '../../../components/ui/Input.jsx';
import { Card } from '../../../components/ui/Card.jsx';

export default function TopUpForm({ onSuccess }) {
  const [method, setMethod] = useState('CREDIT_CARD');
  const [cardDetails, setCardDetails] = useState({ cardNumber: '', cardName: '', cvv: '', expiry: '' });
  const [upiDetails, setUpiDetails] = useState({ upiId: '' });
  const [netBankingDetails, setNetBankingDetails] = useState({ bankCode: '' });
  const [paymentErrors, setPaymentErrors] = useState([]);
  const [serverError, setServerError] = useState(null);

  const { refreshMember } = useAuth();
  const { data: banks = [] } = useBanks();
  const topUpMutation = useTopUp();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(topUpSchema),
    defaultValues: { amount: '' }
  });

  const onSubmit = (formData) => {
    setServerError(null);
    setPaymentErrors([]);

    let details = {};
    if (method === 'CREDIT_CARD' || method === 'DEBIT_CARD') {
      details = cardDetails;
    } else if (method === 'UPI') {
      details = upiDetails;
    } else if (method === 'NET_BANKING') {
      details = netBankingDetails;
    }

    const validation = validatePaymentDetails(method, details);
    if (!validation.isValid) {
      setPaymentErrors(validation.errors);
      return;
    }

    topUpMutation.mutate(
      {
        amount: Number(formData.amount),
        paymentMethod: method,
        payment: details
      },
      {
        onSuccess: async () => {
          reset();
          setCardDetails({ cardNumber: '', cardName: '', cvv: '', expiry: '' });
          setUpiDetails({ upiId: '' });
          setNetBankingDetails({ bankCode: '' });
          await refreshMember();
          if (onSuccess) onSuccess();
        },
        onError: (err) => {
          const fieldErrors = Object.values(getFieldErrors(err));
          setServerError(fieldErrors.length > 0 ? fieldErrors.join(' ') : getErrorMessage(err));
        }
      }
    );
  };

  const getFieldError = (fieldName) => {
    const error = paymentErrors.find((e) => e.field === fieldName);
    return error ? error.message : null;
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold text-text mb-4">Add Money to Wallet</h2>

      {serverError && (
        <div className="mb-4 p-3 rounded bg-danger/10 text-danger text-sm">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label htmlFor="topup-amount" className="block text-sm font-medium text-text mb-1">
            Amount (₹)
          </label>
          <Input
            id="topup-amount"
            type="number"
            step="1"
            placeholder="Enter amount between 1 and 100,000"
            error={errors.amount?.message}
            {...register('amount')}
          />
        </div>

        <div>
          <span className="block text-sm font-medium text-text mb-2">
            Payment Method
          </span>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
            {[
              { id: 'CREDIT_CARD', label: 'Credit Card' },
              { id: 'DEBIT_CARD', label: 'Debit Card' },
              { id: 'UPI', label: 'UPI' },
              { id: 'NET_BANKING', label: 'Net Banking' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setMethod(tab.id);
                  setPaymentErrors([]);
                }}
                className={`py-2 px-3 text-sm font-medium rounded border transition-colors ${
                  method === tab.id
                    ? 'bg-primary text-primary-fg border-primary'
                    : 'bg-surface text-muted border-border hover:border-primary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {(method === 'CREDIT_CARD' || method === 'DEBIT_CARD') && (
            <div className="space-y-4 p-4 rounded bg-bg border border-border">
              <div>
                <label htmlFor="topup-card-number" className="block text-xs font-medium text-muted mb-1">
                  Card Number
                </label>
                <Input
                  id="topup-card-number"
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  value={cardDetails.cardNumber}
                  onChange={(e) => setCardDetails({ ...cardDetails, cardNumber: e.target.value })}
                  error={getFieldError('payment.cardNumber')}
                />
              </div>
              <div>
                <label htmlFor="topup-card-name" className="block text-xs font-medium text-muted mb-1">
                  Name on Card
                </label>
                <Input
                  id="topup-card-name"
                  type="text"
                  placeholder="Full Name"
                  value={cardDetails.cardName}
                  onChange={(e) => setCardDetails({ ...cardDetails, cardName: e.target.value })}
                  error={getFieldError('payment.cardName')}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="topup-card-expiry" className="block text-xs font-medium text-muted mb-1">
                    Expiry (MM/YYYY)
                  </label>
                  <Input
                    id="topup-card-expiry"
                    type="text"
                    placeholder="12/2028"
                    maxLength={7}
                    value={cardDetails.expiry}
                    onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                    error={getFieldError('payment.expiry')}
                  />
                </div>
                <div>
                  <label htmlFor="topup-card-cvv" className="block text-xs font-medium text-muted mb-1">
                    CVV
                  </label>
                  <Input
                    id="topup-card-cvv"
                    type="password"
                    placeholder="123"
                    maxLength={3}
                    value={cardDetails.cvv}
                    onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                    error={getFieldError('payment.cvv')}
                  />
                </div>
              </div>
            </div>
          )}

          {method === 'UPI' && (
            <div className="p-4 rounded bg-bg border border-border">
              <label htmlFor="topup-upi-id" className="block text-xs font-medium text-muted mb-1">
                UPI ID (Virtual Payment Address)
              </label>
              <Input
                id="topup-upi-id"
                type="text"
                placeholder="username@bank"
                value={upiDetails.upiId}
                onChange={(e) => setUpiDetails({ upiId: e.target.value })}
                error={getFieldError('payment.upiId')}
              />
            </div>
          )}

          {method === 'NET_BANKING' && (
            <div className="p-4 rounded bg-bg border border-border">
              <label htmlFor="topup-bank-code" className="block text-xs font-medium text-muted mb-1">
                Select Bank
              </label>
              <select
                id="topup-bank-code"
                className="w-full px-3 py-2 rounded border border-border bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                value={netBankingDetails.bankCode}
                onChange={(e) => setNetBankingDetails({ bankCode: e.target.value })}
              >
                <option value="">-- Choose your bank --</option>
                {(banks.length > 0
                  ? banks
                  : SUPPORTED_BANK_CODES.map((code) => ({ code, name: code }))
                ).map((b) => (
                  <option key={b.code} value={b.code}>
                    {b.name || b.code}
                  </option>
                ))}
              </select>
              {getFieldError('payment.bankCode') && (
                <p className="mt-1 text-xs text-danger">
                  {getFieldError('payment.bankCode')}
                </p>
              )}
            </div>
          )}
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full"
          loading={topUpMutation.isPending}
        >
          Proceed to Add Money
        </Button>
      </form>
    </Card>
  );
}
