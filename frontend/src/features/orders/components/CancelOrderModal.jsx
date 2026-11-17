import React, { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Button } from '../../../components/ui/Button.jsx';
import { Input } from '../../../components/ui/Input.jsx';
import { Select } from '../../../components/ui/Select.jsx';
import { useCancelPreview, useCancelOrder } from '../hooks/useOrders.js';
import { useAuth } from '../../../providers/AuthProvider.jsx';
import { bankDetailsSchema } from '../../../lib/schemas.js';
import { getErrorMessage } from '../../../lib/errors.js';

export function CancelOrderModal({ order, isOpen, onClose, onCancelled }) {
  const [selectedItems, setSelectedItems] = useState({});
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [refundMethod, setRefundMethod] = useState('WALLET');
  const [bankDetails, setBankDetails] = useState({
    accountHolder: '',
    accountNumber: '',
    ifsc: ''
  });
  const [clientErrors, setClientErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);

  const { refreshMember } = useAuth();
  const previewMutation = useCancelPreview();
  const cancelMutation = useCancelOrder();

  const items = order?.items || [];
  // Physical items only
  const physicalItems = items.filter(
    (item) => item.format !== 'EBOOK' && item.format !== 'AUDIOBOOK'
  );

  // Reset only when the dialog opens or another order is shown. A refetch of the same order (which
  // happens right after a successful cancel) hands in a new object and must not wipe the result.
  const orderId = order?.id;
  useEffect(() => {
    if (isOpen && order) {
      // Default: select all physical items with their remaining quantity
      const initSelected = {};
      const phys = (order.items || []).filter(
        (item) => item.format !== 'EBOOK' && item.format !== 'AUDIOBOOK'
      );
      phys.forEach((item) => {
        initSelected[item.id || item.orderItemId || item.bookId] = item.quantity;
      });
      setSelectedItems(initSelected);
      setReason('');
      setNote('');
      setRefundMethod('WALLET');
      setBankDetails({ accountHolder: '', accountNumber: '', ifsc: '' });
      setClientErrors({});
      setServerError(null);
      setPreview(null);
      setResult(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, orderId]);

  if (!isOpen || !order) return null;

  const handleQuantityChange = (itemId, qty) => {
    setPreview(null);
    setSelectedItems((prev) => ({
      ...prev,
      [itemId]: qty
    }));
  };

  const handleRequestPreview = async (e) => {
    e?.preventDefault();
    setClientErrors({});
    setServerError(null);

    if (!reason || !reason.trim()) {
      setClientErrors({ reason: 'Please provide a cancellation reason' });
      return;
    }

    if (refundMethod === 'BANK') {
      const bankResult = bankDetailsSchema.safeParse(bankDetails);
      if (!bankResult.success) {
        const errMap = {};
        bankResult.error.issues.forEach((issue) => {
          errMap[issue.path[0]] = issue.message;
        });
        setClientErrors(errMap);
        return;
      }
    }

    const cancelLines = Object.entries(selectedItems)
      .filter(([, qty]) => qty > 0)
      .map(([itemId, qty]) => ({
        orderItemId: itemId,
        quantity: qty
      }));

    if (cancelLines.length === 0) {
      setServerError('Please select at least one physical item to cancel.');
      return;
    }

    try {
      const res = await previewMutation.mutateAsync({
        orderId: order.id,
        items: cancelLines
      });
      setPreview(res);
    } catch (err) {
      setServerError(getErrorMessage(err));
    }
  };

  const handleConfirmCancel = async () => {
    setServerError(null);

    const cancelLines = Object.entries(selectedItems)
      .filter(([, qty]) => qty > 0)
      .map(([itemId, qty]) => ({
        orderItemId: itemId,
        quantity: qty
      }));

    const payload = {
      reason,
      note: note || null,
      items: cancelLines,
      refundMethod,
      bank: refundMethod === 'BANK' ? bankDetails : null,
      expectedRefund: preview?.refundAmount ?? null
    };

    try {
      const res = await cancelMutation.mutateAsync({
        orderId: order.id,
        data: payload
      });
      setResult(res);
      // The refund lands in the wallet and points may be restored: update the navbar balance.
      await refreshMember?.();
      onCancelled?.(res);
    } catch (err) {
      setServerError(getErrorMessage(err));
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cancel-order-title"
    >
      <div className="bg-surface border border-border rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2 text-danger font-semibold">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <h2 id="cancel-order-title" className="text-base text-text font-bold">
              Cancel Order #{order.orderNumber || order.id?.substring(0, 8)}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-muted hover:text-text hover:bg-bg transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {result ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 rounded-full bg-success/10 text-success mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-text">Cancellation Processed</h3>
              <p className="text-sm text-muted">
                Refund of <span className="font-bold text-text">₹{preview?.refundAmount ?? result.refundAmount ?? '0.00'}</span> has been processed to your{' '}
                {refundMethod === 'WALLET' ? 'Book Haven Wallet' : `bank account (${result.maskedBankAccount || 'XXXX' + (bankDetails.accountNumber.slice(-4) || '****')})`}.
              </p>
              {preview?.pointsRestored > 0 && (
                <p className="text-xs text-success font-medium">
                  {preview.pointsRestored} gift points were restored to your balance.
                </p>
              )}
              <div className="pt-2">
                <Button variant="primary" onClick={onClose} className="w-full">
                  Done
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {serverError && (
                <div className="p-3 bg-danger/10 border border-danger/20 rounded-lg text-xs text-danger font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{serverError}</span>
                </div>
              )}

              {/* Items selection */}
              <div>
                <p className="block text-xs font-semibold text-text uppercase tracking-wider mb-2">
                  Select Items to Cancel (Physical items only)
                </p>
                {physicalItems.length === 0 ? (
                  <p className="text-xs text-muted">This order contains no cancellable physical items.</p>
                ) : (
                  <div className="space-y-2 border border-border rounded-lg p-3 bg-bg">
                    {items.map((item) => {
                      const isDigital = item.format === 'EBOOK' || item.format === 'AUDIOBOOK';
                      const itemId = item.id || item.orderItemId || item.bookId;
                      const selectedQty = selectedItems[itemId] || 0;

                      return (
                        <div
                          key={itemId}
                          className={`flex items-center justify-between gap-3 text-sm py-1.5 ${
                            isDigital ? 'opacity-50' : ''
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="font-medium text-text truncate">{item.title}</p>
                            <p className="text-xs text-muted">
                              {item.format} • ₹{item.unitPrice || item.price} each
                              {isDigital && ' (Digital - Not cancellable)'}
                            </p>
                          </div>

                          {!isDigital && (
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-xs text-muted">Qty:</span>
                              <select
                                value={selectedQty}
                                onChange={(e) =>
                                  handleQuantityChange(itemId, parseInt(e.target.value, 10))
                                }
                                className="bg-surface border border-border rounded px-2 py-1 text-xs text-text focus:outline-none focus:ring-1 focus:ring-primary"
                                aria-label={`Quantity to cancel for ${item.title}`}
                              >
                                {[...Array(item.quantity + 1).keys()].map((q) => (
                                  <option key={q} value={q}>
                                    {q}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Reason */}
              <div>
                <Input
                  label="Cancellation Reason (Required)"
                  placeholder="e.g. Ordered by mistake, found better price"
                  value={reason}
                  onChange={(e) => {
                    setReason(e.target.value);
                    setPreview(null);
                  }}
                  error={clientErrors.reason}
                  required
                />
              </div>

              {/* Refund Method */}
              <div>
                <Select
                  label="Refund Destination"
                  value={refundMethod}
                  onChange={(e) => {
                    setRefundMethod(e.target.value);
                    setPreview(null);
                  }}
                  options={[
                    { value: 'WALLET', label: 'Book Haven Wallet (Instant)' },
                    { value: 'BANK', label: 'Bank Account' }
                  ]}
                />
              </div>

              {/* Bank Form */}
              {refundMethod === 'BANK' && (
                <div className="p-3 border border-border rounded-lg bg-bg space-y-3">
                  <Input
                    label="Account Holder Name"
                    placeholder="e.g. John Doe"
                    value={bankDetails.accountHolder}
                    onChange={(e) =>
                      setBankDetails({ ...bankDetails, accountHolder: e.target.value })
                    }
                    error={clientErrors.accountHolder}
                  />
                  <Input
                    label="Account Number"
                    placeholder="9 to 18 digits"
                    type="password"
                    value={bankDetails.accountNumber}
                    onChange={(e) =>
                      setBankDetails({ ...bankDetails, accountNumber: e.target.value })
                    }
                    error={clientErrors.accountNumber}
                  />
                  <Input
                    label="IFSC Code"
                    placeholder="e.g. HDFC0001234"
                    value={bankDetails.ifsc}
                    onChange={(e) =>
                      setBankDetails({ ...bankDetails, ifsc: e.target.value.toUpperCase() })
                    }
                    error={clientErrors.ifsc}
                  />
                </div>
              )}

              {/* Server Preview Box */}
              {preview && (
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-2 text-sm">
                  <div className="flex justify-between text-muted">
                    <span>Cancellation Fee ({((preview.feeRate || 0) * 100).toFixed(0)}%):</span>
                    <span className="font-medium text-text">₹{preview.cancellationFee || '0.00'}</span>
                  </div>
                  {preview.pointsRestored > 0 && (
                    <div className="flex justify-between text-success">
                      <span>Points Restored:</span>
                      <span className="font-semibold">{preview.pointsRestored} pts</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold text-text pt-2 border-t border-border">
                    <span>Net Refund Amount:</span>
                    <span className="text-primary">₹{preview.refundAmount}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!result && (
          <div className="p-4 border-t border-border flex justify-end gap-3 bg-bg">
            <Button variant="ghost" onClick={onClose}>
              Back
            </Button>
            {!preview ? (
              <Button
                variant="primary"
                onClick={handleRequestPreview}
                isLoading={previewMutation.isPending}
                disabled={physicalItems.length === 0}
              >
                Preview Refund
              </Button>
            ) : (
              <Button
                variant="danger"
                onClick={handleConfirmCancel}
                isLoading={cancelMutation.isPending}
              >
                Confirm Cancellation
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
