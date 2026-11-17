import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { reviewSchema } from '../../../lib/schemas';
import { getErrorMessage } from '../../../lib/errors';
import { useCreateReview } from '../hooks/useReviews';
import { useAuth } from '../../auth/hooks/useAuth';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '../../../components/ui/Button.jsx';

export default function ReviewForm({ bookId }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const [serverError, setServerError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [selectedRating, setSelectedRating] = useState(0);

  const createReviewMutation = useCreateReview(bookId);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 0,
      body: ''
    }
  });

  const bodyValue = watch('body', '');

  if (!isAuthenticated) {
    return (
      <div className="p-4 rounded-xl bg-bg border border-border text-center space-y-2">
        <p className="text-sm text-muted">
          Have you read this book? Log in to leave a customer review.
        </p>
        <div>
          <Link
            to="/login"
            state={{ from: location }}
            className="inline-block text-xs font-semibold text-primary hover:underline"
          >
            Log in to write a review &rarr;
          </Link>
        </div>
      </div>
    );
  }

  const onSubmit = (data) => {
    setServerError(null);
    setSuccessMessage(null);

    createReviewMutation.mutate(
      {
        rating: Number(data.rating),
        body: data.body
      },
      {
        onSuccess: () => {
          reset({ rating: 0, body: '' });
          setSelectedRating(0);
          setSuccessMessage('Thank you for submitting your review!');
        },
        onError: (err) => {
          setServerError(getErrorMessage(err));
        }
      }
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-5 rounded-xl bg-surface border border-border">
      <h3 className="text-base font-semibold text-text">Write a Customer Review</h3>

      {serverError && (
        <div className="p-3 rounded bg-danger/10 text-danger text-xs">
          {serverError}
        </div>
      )}

      {successMessage && (
        <div className="p-3 rounded bg-success/10 text-success text-xs">
          {successMessage}
        </div>
      )}

      <div>
        <span className="block text-xs font-medium text-muted mb-1">
          Your Rating
        </span>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
              onClick={() => {
                setSelectedRating(star);
                setValue('rating', star, { shouldValidate: true });
              }}
              className="text-2xl rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-transform hover:scale-110"
            >
              <span className={star <= selectedRating ? 'text-warning' : 'text-muted'}>
                ★
              </span>
            </button>
          ))}
          <span className="ml-2 text-xs font-semibold text-text">
            {selectedRating > 0 ? `${selectedRating} / 5 Stars` : 'Select a rating'}
          </span>
        </div>
        {errors.rating && (
          <p className="mt-1 text-xs text-danger">{errors.rating.message}</p>
        )}
      </div>

      <div>
        <div className="flex justify-between items-center mb-1">
          <label htmlFor="review-body" className="block text-xs font-medium text-muted">
            Review (max 100 characters)
          </label>
          <span
            className={`text-xs ${
              bodyValue.length > 100 ? 'text-danger font-bold' : 'text-muted'
            }`}
          >
            {bodyValue.length}/100
          </span>
        </div>
        <textarea
          id="review-body"
          rows={3}
          maxLength={100}
          placeholder="Share your thoughts on the story, characters, and writing style..."
          className="w-full px-3 py-2 text-sm rounded border border-border bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          {...register('body')}
        />
        {errors.body && (
          <p className="mt-1 text-xs text-danger">{errors.body.message}</p>
        )}
      </div>

      <Button
        type="submit"
        variant="primary"
        size="sm"
        loading={createReviewMutation.isPending}
      >
        Submit Review
      </Button>
    </form>
  );
}
