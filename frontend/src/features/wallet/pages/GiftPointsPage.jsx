import { usePointsHistory } from '../hooks/useWallet';
import { useAuth } from '../../auth/hooks/useAuth';
import { Card } from '../../../components/ui/Card.jsx';
import { Spinner } from '../../../components/ui/Spinner.jsx';
import { EmptyState } from '../../../components/ui/EmptyState.jsx';
import { ErrorState } from '../../../components/ui/ErrorState.jsx';
import { useNavigate } from 'react-router-dom';

const REASON_LABELS = {
  EARNED: 'Points Earned on Purchase',
  REDEEMED: 'Points Redeemed at Checkout',
  RESTORED_ON_FAILURE: 'Points Restored after Payment Failure',
  RESTORED_ON_CANCEL: 'Points Restored after Order Cancellation'
};

export default function GiftPointsPage() {
  const { member } = useAuth();
  const { data: entries = [], isLoading, isError, refetch } = usePointsHistory();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Spinner />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <ErrorState onRetry={refetch} />
      </div>
    );
  }

  const currentBalance = member?.giftPoints ?? (entries[0]?.balanceAfter ?? 0);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-text">Gift Points</h1>
        <p className="text-muted text-sm mt-1">
          Earn 1 point for every ₹10 spent. Redeem 10 points for ₹1 discount at checkout.
        </p>
      </div>

      <Card className="p-6 bg-surface border border-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted font-medium">
              Current Points Balance
            </p>
            <p className="text-3xl font-extrabold text-primary mt-1">
              {currentBalance} <span className="text-base font-normal text-muted">pts</span>
            </p>
            <p className="text-xs text-muted mt-1">
              Worth ₹{(currentBalance / 10).toFixed(2)} on your next purchase
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-bg flex items-center justify-center text-primary font-bold text-xl">
            ★
          </div>
        </div>
      </Card>

      <div>
        <h2 className="text-lg font-semibold text-text mb-4">Points History</h2>

        {entries.length === 0 ? (
          <EmptyState
            title="No points history yet"
            message="You will earn gift points on every confirmed order you place."
            actionLabel="Start Browsing"
            onAction={() => navigate('/')}
          />
        ) : (
          <Card className="divide-y divide-border overflow-hidden">
            {entries.map((entry) => {
              const isPositive = entry.points > 0;
              const label = REASON_LABELS[entry.reason] || entry.reason;

              return (
                <div
                  key={entry.id}
                  className="p-4 flex items-center justify-between hover:bg-bg transition-colors"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-text">{label}</p>
                    <p className="text-xs text-muted">
                      {new Date(entry.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                      {entry.orderId && ` • Order: ${entry.orderId.slice(0, 8)}...`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-bold ${
                        isPositive ? 'text-success' : 'text-danger'
                      }`}
                    >
                      {isPositive ? '+' : ''}{entry.points} pts
                    </p>
                    {entry.balanceAfter !== undefined && (
                      <span className="text-xs text-muted">
                        Balance: {entry.balanceAfter} pts
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </Card>
        )}
      </div>
    </div>
  );
}
