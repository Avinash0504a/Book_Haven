import React from 'react';
import { CheckCircle2, Clock, Truck, Package, XCircle } from 'lucide-react';

const STEPS = [
  { key: 'CONFIRMED', label: 'Confirmed', icon: CheckCircle2 },
  { key: 'PROCESSING', label: 'Processing', icon: Package },
  { key: 'SHIPPED', label: 'Shipped', icon: Truck },
  { key: 'DELIVERED', label: 'Delivered', icon: CheckCircle2 }
];

export function OrderTracker({ status = 'CONFIRMED' }) {
  if (status === 'CANCELLED') {
    return (
      <div className="flex items-center gap-2 p-3 bg-danger/10 border border-danger/20 rounded-xl text-sm text-danger font-medium">
        <XCircle className="w-5 h-5 shrink-0" />
        <span>This order was cancelled</span>
      </div>
    );
  }

  const currentIdx = STEPS.findIndex((s) => s.key === status);
  const activeIdx = currentIdx >= 0 ? currentIdx : 0;

  return (
    <div className="py-2" data-testid="order-tracker">
      <div className="flex items-center justify-between relative">
        <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 h-0.5 bg-border -z-0" />
        <div
          className="absolute top-1/2 left-4 -translate-y-1/2 h-0.5 bg-primary transition-all duration-300 -z-0"
          style={{ width: `${(activeIdx / (STEPS.length - 1)) * 100}%` }}
        />

        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isDone = idx <= activeIdx;
          const isCurrent = idx === activeIdx;

          return (
            <div key={step.key} className="flex flex-col items-center gap-1.5 z-10 bg-surface px-1">
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-colors ${
                  isDone
                    ? 'bg-primary text-primary-fg shadow-xs'
                    : 'bg-bg border border-border text-muted'
                }`}
              >
                {isDone ? (
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                ) : (
                  <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                )}
              </div>
              <span
                className={`text-[10px] sm:text-xs font-medium text-center ${
                  isCurrent ? 'text-primary font-bold' : isDone ? 'text-text' : 'text-muted'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
