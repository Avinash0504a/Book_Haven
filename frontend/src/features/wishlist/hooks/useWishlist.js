import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { wishlistApi } from '../api/wishlistApi';

export function useWishlist(pincode) {
  return useQuery({
    queryKey: ['wishlist', pincode || ''],
    queryFn: () => wishlistApi.listWishlist(pincode)
  });
}

export function useToggleWishlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bookId, inWishlist }) => {
      if (inWishlist) {
        return wishlistApi.removeWishlistItem(bookId);
      } else {
        return wishlistApi.addWishlistItem(bookId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['book'] });
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
      queryClient.invalidateQueries({ queryKey: ['bestsellers'] });
      queryClient.invalidateQueries({ queryKey: ['newLaunches'] });
      queryClient.invalidateQueries({ queryKey: ['relatedBooks'] });
      queryClient.invalidateQueries({ queryKey: ['author'] });
    }
  });
}
