import { useState } from 'react';
import { getFieldErrors } from '../../../lib/errors';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateProfileSchema } from '../../../lib/schemas';
import { useAuth } from '../../auth/hooks/useAuth';
import { authApi } from '../../auth/api/authApi';
import AddressList from '../components/AddressList';
import { Card } from '../../../components/ui/Card.jsx';
import { Input } from '../../../components/ui/Input.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { Spinner } from '../../../components/ui/Spinner.jsx';
import { Link } from 'react-router-dom';

export default function ProfilePage() {
  const { member, loading: isLoading, refreshMember } = useAuth();
  const [isEditingName, setIsEditingName] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(updateProfileSchema),
    values: { fullName: member?.fullName || '' }
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Spinner />
      </div>
    );
  }

  const onSubmitName = async (formData) => {
    setServerError(null);
    setIsSaving(true);
    try {
      await authApi.updateProfile({ fullName: formData.fullName });
      await refreshMember();
      setIsEditingName(false);
    } catch (err) {
      setServerError(getFieldErrors(err).fullName || err.message || 'Failed to update profile name');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-text">My Profile</h1>
        <p className="text-muted text-sm mt-1">
          Manage your personal details, default settings, and delivery addresses.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Personal Details */}
        <Card className="p-6 md:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <h2 className="text-base font-bold text-text">Personal Details</h2>
            {!isEditingName && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  reset({ fullName: member?.fullName || '' });
                  setIsEditingName(true);
                }}
              >
                Edit Name
              </Button>
            )}
          </div>

          {serverError && (
            <div className="p-3 rounded bg-danger/10 text-danger text-xs">
              {serverError}
            </div>
          )}

          {isEditingName ? (
            <form onSubmit={handleSubmit(onSubmitName)} className="space-y-4">
              <div>
                <label htmlFor="fullName" className="block text-xs font-medium text-muted mb-1">
                  Full Name
                </label>
                <Input
                  id="fullName"
                  type="text"
                  error={errors.fullName?.message}
                  {...register('fullName')}
                />
              </div>

              <div className="flex items-center gap-2">
                <Button type="submit" variant="primary" size="sm" loading={isSaving}>
                  Save Name
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingName(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <div>
                <span className="text-xs text-muted">Full Name</span>
                <p className="text-sm font-semibold text-text">{member?.fullName}</p>
              </div>
              <div>
                <span className="text-xs text-muted">Email Address (Login ID)</span>
                <p className="text-sm font-semibold text-text">{member?.email}</p>
              </div>
            </div>
          )}
        </Card>

        {/* Wallet & Points Quick Glance */}
        <div className="space-y-4">
          <Card className="p-5 flex flex-col justify-between space-y-2">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted font-medium">Wallet Balance</p>
              <p className="text-2xl font-bold text-primary mt-1">
                ₹{Number(member?.walletBalance || 0).toFixed(2)}
              </p>
            </div>
            <Link to="/wallet" className="text-xs font-semibold text-primary hover:underline pt-2">
              View Wallet &rarr;
            </Link>
          </Card>

          <Card className="p-5 flex flex-col justify-between space-y-2">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted font-medium">Gift Points</p>
              <p className="text-2xl font-bold text-primary mt-1">
                {member?.giftPoints || 0} pts
              </p>
            </div>
            <Link to="/gift-points" className="text-xs font-semibold text-primary hover:underline pt-2">
              Points History &rarr;
            </Link>
          </Card>
        </div>
      </div>

      {/* Address Management */}
      <AddressList />
    </div>
  );
}
