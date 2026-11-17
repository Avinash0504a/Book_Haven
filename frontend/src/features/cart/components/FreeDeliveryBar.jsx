import React from 'react';
import { formatRupees } from '../../../lib/format.js';

export function FreeDeliveryBar({ freeShippingRemaining = '0.00', subtotal = '0.00' }) {
  const remaining = Number(freeShippingRemaining);
  const subtotalNum = Number(subtotal);
  const isFree = remaining <= 0 || subtotalNum >= 500;
  const progressPercent = Math.min(100, Math.max(0, (subtotalNum / 500) * 100));

  return (
    <div className="bg-surface border border-border rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between text-sm mb-2">
        {isFree ? (
          <span className="font-semibold text-success flex items-center gap-1.5">
            <span>✓</span> You qualify for FREE Delivery!
          </span>
        ) : (
          <span className="text-text font-medium">
            Add <span className="font-bold text-primary">{formatRupees(remaining)}</span> more for <span className="font-semibold text-success">FREE Delivery</span>
          </span>
        )}
        <span className="text-xs text-muted">{Math.round(progressPercent)}%</span>
      </div>

      <div
        role="progressbar"
        aria-label="Free delivery progress"
        aria-valuenow={Math.min(500, subtotalNum)}
        aria-valuemin={0}
        aria-valuemax={500}
        className="w-full bg-border rounded-full h-2.5 overflow-hidden"
      >
        <div
          className={`h-full transition-all duration-300 rounded-full ${
            isFree ? 'bg-success' : 'bg-primary'
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}
export default FreeDeliveryBar;
