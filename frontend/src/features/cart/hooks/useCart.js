import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cartApi } from '../api/cartApi.js';
import { useAuth } from '../../../providers/AuthProvider.jsx';

const EMPTY_CART = {
  items: [],
  subtotal: '0.00',
  shippingAmount: '0.00',
  freeShippingRemaining: '500.00',
  total: '0.00',
  pointsToEarn: 0,
  hasPhysical: false,
  hasDigital: false,
  itemCount: 0
};

export function useCart() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const cartQuery = useQuery({
    queryKey: ['cart'],
    queryFn: cartApi.getCart,
    enabled: isAuthenticated,
    staleTime: 1000 * 30 // 30 seconds
  });

  const cart = isAuthenticated ? cartQuery.data || EMPTY_CART : EMPTY_CART;

  const addItemMutation = useMutation({
    mutationFn: cartApi.addItem,
    onSuccess: (data) => {
      queryClient.setQueryData(['cart'], data);
    }
  });

  const updateItemMutation = useMutation({
    mutationFn: cartApi.updateItem,
    onSuccess: (data) => {
      queryClient.setQueryData(['cart'], data);
    }
  });

  const removeItemMutation = useMutation({
    mutationFn: cartApi.removeItem,
    onSuccess: (data) => {
      queryClient.setQueryData(['cart'], data);
    }
  });

  const clearCartMutation = useMutation({
    mutationFn: cartApi.clearCart,
    onSuccess: () => {
      queryClient.setQueryData(['cart'], EMPTY_CART);
    }
  });

  return {
    cart,
    isLoading: cartQuery.isLoading,
    isError: cartQuery.isError,
    error: cartQuery.error,
    itemCount: cart.itemCount || 0,
    addItem: addItemMutation.mutateAsync,
    updateItem: updateItemMutation.mutateAsync,
    removeItem: removeItemMutation.mutateAsync,
    clearCart: clearCartMutation.mutateAsync,
    isAdding: addItemMutation.isPending,
    isUpdating: updateItemMutation.isPending,
    isRemoving: removeItemMutation.isPending,
    isClearing: clearCartMutation.isPending
  };
}
