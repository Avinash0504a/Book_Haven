import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { addressApi } from '../api/addressApi.js';

export function useAddresses({ enabled = true } = {}) {
  return useQuery({
    queryKey: ['addresses'],
    enabled,
    queryFn: async () => {
      const data = await addressApi.getAddresses();
      return data || [];
    }
  });
}

export function useCreateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => addressApi.createAddress(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    }
  });
}

export function useUpdateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => addressApi.updateAddress(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    }
  });
}

export function useDeleteAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => addressApi.deleteAddress(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    }
  });
}
