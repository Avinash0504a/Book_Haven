import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderApi } from '../api/orderApi.js';

export function useOrders() {
  return useQuery({
    queryKey: ['orders'],
    queryFn: orderApi.listOrders,
    staleTime: 1000 * 30 // 30 seconds
  });
}

export function useOrder(id) {
  return useQuery({
    queryKey: ['orders', id],
    queryFn: () => orderApi.getOrder(id),
    enabled: Boolean(id),
    staleTime: 1000 * 30
  });
}

export function useBuyAgain() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId) => orderApi.buyAgain(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    }
  });
}

export function useCancelPreview() {
  return useMutation({
    mutationFn: ({ orderId, items }) => orderApi.getCancelPreview(orderId, items)
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, data }) => orderApi.cancelOrder(orderId, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders', variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
    }
  });
}
