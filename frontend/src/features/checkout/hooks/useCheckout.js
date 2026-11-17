import { useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { checkoutApi } from '../api/checkoutApi.js';

export function useBanks() {
  return useQuery({
    queryKey: ['checkout', 'banks'],
    queryFn: checkoutApi.listBanks,
    staleTime: 1000 * 60 * 60 // 1 hour
  });
}

export function useValidateCheckout() {
  return useMutation({
    mutationFn: checkoutApi.validateCheckout
  });
}

export function useApplyPoints() {
  return useMutation({
    mutationFn: checkoutApi.applyPoints
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  const idempotencyKeyRef = useRef(null);

  const getOrCreateIdempotencyKey = useCallback(() => {
    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `key-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }
    return idempotencyKeyRef.current;
  }, []);

  const resetIdempotencyKey = useCallback(() => {
    idempotencyKeyRef.current = null;
  }, []);

  const mutation = useMutation({
    mutationFn: (variables) => {
      const key = variables?.idempotencyKey || getOrCreateIdempotencyKey();
      return checkoutApi.createOrder(variables, key);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    }
  });

  return {
    ...mutation,
    getIdempotencyKey: getOrCreateIdempotencyKey,
    resetIdempotencyKey
  };
}

export function useConfirmPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: checkoutApi.confirmPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    }
  });
}

export function useFailPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: checkoutApi.failPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    }
  });
}
