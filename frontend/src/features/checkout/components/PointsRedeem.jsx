import React, { useState } from 'react';
import { Gift, Check, X } from 'lucide-react';
import { Button } from '../../../components/ui/Button.jsx';
import { Input } from '../../../components/ui/Input.jsx';

export function PointsRedeem({
  availablePoints = 0,
  appliedPoints = 0,
  discountAmount = '0.00',
  onApply,
  onRemove,
  isLoading = false
}) {
  const [pointsInput, setPointsInput] = useState('');
  const [error, setError] = useState(null);

  const handleApply = (e) => {
    e.preventDefault();
    setError(null);
    const pts = parseInt(pointsInput, 10);

    if (isNaN(pts) || pts <= 0) {
      setError('Please enter a valid positive number of points');
      return;
    }

    if (pts > availablePoints) {
      setError(`You only have ${availablePoints} gift points available`);
      return;
    }

    onApply(pts, (err) => {
      if (err) {
        setError(err.message || 'Failed to apply points');
      } else {
        setPointsInput('');
      }
    });
  };

  const handleRemove = () => {
    setError(null);
    setPointsInput('');
    onRemove();
  };

  return (
    <div className="bg-surface border border-border rounded-xl p-4 sm:p-5">
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Gift className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-text">Book Haven Gift Points</h3>
          <p className="text-xs text-muted">
            Available balance: <span className="font-semibold text-text">{availablePoints} points</span> (10 points = ₹1.00)
          </p>
        </div>
      </div>

      {appliedPoints > 0 ? (
        <div className="flex items-center justify-between p-3 bg-success/10 border border-success/30 rounded-lg text-sm text-success">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-success" />
            <span>
              Applied <span className="font-bold">{appliedPoints} points</span> (-₹{discountAmount})
            </span>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="text-muted hover:text-danger p-1 rounded transition-colors"
            aria-label="Remove redeemed points"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <form onSubmit={handleApply} className="space-y-2">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                type="number"
                min="1"
                max={availablePoints}
                placeholder="Enter points to redeem"
                value={pointsInput}
                onChange={(e) => {
                  setPointsInput(e.target.value);
                  setError(null);
                }}
                disabled={availablePoints <= 0 || isLoading}
                aria-label="Gift points to redeem"
              />
            </div>
            <Button
              type="submit"
              variant="secondary"
              onClick={handleApply}
              disabled={!pointsInput || availablePoints <= 0 || isLoading}
              isLoading={isLoading}
            >
              Apply
            </Button>
          </div>
          {error && <p className="text-xs text-danger font-medium mt-1">{error}</p>}
        </form>
      )}
    </div>
  );
}
