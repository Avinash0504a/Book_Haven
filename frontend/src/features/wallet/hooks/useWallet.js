import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { walletApi } from '../api/walletApi';

export function useWallet() {
  return useQuery({
    queryKey: ['wallet'],
    queryFn: walletApi.getWallet
  });
}

export function useTopUp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: walletApi.topUpWallet,
    onSuccess: (data) => {
      queryClient.setQueryData(['wallet'], data);
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    }
  });
}

export function usePointsHistory() {
  return useQuery({
    queryKey: ['points-history'],
    queryFn: walletApi.getPointsHistory
  });
}
