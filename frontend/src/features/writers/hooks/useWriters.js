import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { writersApi } from '../api/writersApi';
import { useAuth } from '../../auth/hooks/useAuth';

export function useAuthors() {
  return useQuery({
    queryKey: ['authors'],
    queryFn: writersApi.listAuthors
  });
}

export function useAuthor(slug, pincode) {
  return useQuery({
    queryKey: ['author', slug, pincode || ''],
    queryFn: () => writersApi.getAuthor(slug, pincode),
    enabled: Boolean(slug)
  });
}

export function useFollowing() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['following'],
    queryFn: writersApi.listFollowing,
    enabled: isAuthenticated
  });
}

export function useToggleFollow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ slug, following }) => {
      if (following) {
        return writersApi.unfollowAuthor(slug);
      } else {
        return writersApi.followAuthor(slug);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['following'] });
      queryClient.invalidateQueries({ queryKey: ['authors'] });
      queryClient.invalidateQueries({ queryKey: ['author'] });
    }
  });
}
