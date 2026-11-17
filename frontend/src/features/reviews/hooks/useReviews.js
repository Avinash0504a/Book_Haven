import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewsApi } from '../api/reviewsApi';

export function useReviews(bookId) {
  return useQuery({
    queryKey: ['reviews', bookId],
    queryFn: () => reviewsApi.listReviews(bookId),
    enabled: Boolean(bookId)
  });
}

export function useCreateReview(bookId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => reviewsApi.createReview(bookId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', bookId] });
      queryClient.invalidateQueries({ queryKey: ['book', bookId] });
    }
  });
}
