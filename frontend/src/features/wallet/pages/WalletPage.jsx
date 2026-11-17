import { useState } from 'react';
import { useWallet } from '../hooks/useWallet';
import TopUpForm from '../components/TopUpForm';
import { Card } from '../../../components/ui/Card.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { Spinner } from '../../../components/ui/Spinner.jsx';
import { EmptyState } from '../../../components/ui/EmptyState.jsx';
import { ErrorState } from '../../../components/ui/ErrorState.jsx';

export default function WalletPage() {
  const { data: wallet, isLoading, isError, refetch } = useWallet();
  const [showTopUp, setShowTopUp] = useState(false);

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

  const transactions = wallet?.transactions || [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Book Haven Wallet</h1>
          <p className="text-muted text-sm mt-1">
            Manage your wallet balance, transactions, and add funds instantly.
          </p>
        </div>
        <Button
          type="button"
          variant="primary"
          onClick={() => setShowTopUp(!showTopUp)}
        >
          {showTopUp ? 'Close Add Money' : 'Add Money'}
        </Button>
      </div>

      <Card className="p-6 bg-surface border border-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted font-medium">
              Available Balance
            </p>
            <p className="text-3xl font-extrabold text-primary mt-1">
              ₹{(wallet?.balance || 0).toFixed(2)}
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-bg flex items-center justify-center text-primary font-bold text-xl">
            ₹
          </div>
        </div>
      </Card>

      {showTopUp && (
        <TopUpForm onSuccess={() => setShowTopUp(false)} />
      )}

      <div>
        <h2 className="text-lg font-semibold text-text mb-4">Transaction History</h2>

        {transactions.length === 0 ? (
          <EmptyState
            title="No transactions yet"
            message="Your wallet transaction history will appear here once you top up or use your wallet."
            actionLabel="Add Money"
            onAction={() => setShowTopUp(true)}
          />
        ) : (
          <Card className="divide-y divide-border overflow-hidden">
            {transactions.map((txn) => {
              const isCredit = txn.type === 'CREDIT';
              return (
                <div
                  key={txn.id}
                  className="p-4 flex items-center justify-between hover:bg-bg transition-colors"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-text">
                      {txn.description || (isCredit ? 'Credit Transaction' : 'Debit Transaction')}
                    </p>
                    <p className="text-xs text-muted">
                      {new Date(txn.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}{' '}
                      • Source: {txn.source}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-bold ${
                        isCredit ? 'text-success' : 'text-danger'
                      }`}
                    >
                      {isCredit ? '+' : '-'}₹{(txn.amount || 0).toFixed(2)}
                    </p>
                    <span className="text-xs text-muted uppercase">{txn.type}</span>
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
