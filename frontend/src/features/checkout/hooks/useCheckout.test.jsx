import { describe, it, expect } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/setup.js';
import {
  useBanks,
  useValidateCheckout,
  useApplyPoints,
  useCreateOrder,
  useConfirmPayment,
  useFailPayment
} from './useCheckout.js';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });
  const Wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = 'TestWrapper';
  return Wrapper;
}

describe('useCheckout hooks', () => {
  it('useBanks fetches bank list', async () => {
    server.use(
      http.get('/api/checkout/banks', () => {
        return HttpResponse.json({
          success: true,
          data: [
            { code: 'HDFC', name: 'HDFC Bank' },
            { code: 'SBI', name: 'State Bank of India' }
          ],
          message: null,
          code: null
        });
      })
    );

    const { result } = renderHook(() => useBanks(), {
      wrapper: createWrapper()
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(2);
    expect(result.current.data[0].code).toBe('HDFC');
  });

  it('useCreateOrder reuses same idempotency key on retry and passes in header', async () => {
    const receivedKeys = [];

    server.use(
      http.post('/api/checkout/order', async ({ request }) => {
        const key = request.headers.get('Idempotency-Key');
        receivedKeys.push(key);
        return HttpResponse.json({
          success: true,
          data: {
            id: 'order-123',
            status: 'PENDING',
            grandTotal: '500.00'
          },
          message: null,
          code: null
        });
      })
    );

    const { result } = renderHook(() => useCreateOrder(), {
      wrapper: createWrapper()
    });

    const key1 = result.current.getIdempotencyKey();
    expect(key1).toBeTruthy();

    await act(async () => {
      await result.current.mutateAsync({ addressId: 'addr-1', paymentMethod: 'UPI', giftPointsToUse: 0 });
    });

    // Retry without resetting key
    const key2 = result.current.getIdempotencyKey();
    expect(key2).toBe(key1);

    await act(async () => {
      await result.current.mutateAsync({ addressId: 'addr-1', paymentMethod: 'UPI', giftPointsToUse: 0 });
    });

    expect(receivedKeys).toHaveLength(2);
    expect(receivedKeys[0]).toBe(key1);
    expect(receivedKeys[1]).toBe(key1);

    // Resetting creates new key
    act(() => {
      result.current.resetIdempotencyKey();
    });
    const key3 = result.current.getIdempotencyKey();
    expect(key3).not.toBe(key1);
  });

  it('useValidateCheckout, useApplyPoints, useConfirmPayment and useFailPayment execute calls', async () => {
    server.use(
      http.post('/api/checkout/validate', () => {
        return HttpResponse.json({
          success: true,
          data: { itemCount: 1 },
          message: null,
          code: null
        });
      })
    );

    const { result: validateHook } = renderHook(() => useValidateCheckout(), {
      wrapper: createWrapper()
    });

    await act(async () => {
      const res = await validateHook.current.mutateAsync();
      expect(res.itemCount).toBe(1);
    });
    server.use(
      http.post('/api/checkout/apply-points', async ({ request }) => {
        const body = await request.json();
        return HttpResponse.json({
          success: true,
          data: {
            pointsApplied: body.points,
            discountAmount: '10.00',
            payableAmount: '290.00'
          },
          message: null,
          code: null
        });
      }),
      http.post('/api/checkout/confirm-payment', async () => {
        return HttpResponse.json({
          success: true,
          data: { id: 'order-123', status: 'CONFIRMED' },
          message: null,
          code: null
        });
      }),
      http.post('/api/checkout/fail-payment', async () => {
        return HttpResponse.json({
          success: true,
          data: { id: 'order-123', status: 'FAILED' },
          message: null,
          code: null
        });
      })
    );

    const { result: applyPointsHook } = renderHook(() => useApplyPoints(), {
      wrapper: createWrapper()
    });
    const { result: confirmPaymentHook } = renderHook(() => useConfirmPayment(), {
      wrapper: createWrapper()
    });
    const { result: failPaymentHook } = renderHook(() => useFailPayment(), {
      wrapper: createWrapper()
    });

    await act(async () => {
      const res = await applyPointsHook.current.mutateAsync({ points: 100 });
      expect(res.discountAmount).toBe('10.00');
    });

    await act(async () => {
      const res = await confirmPaymentHook.current.mutateAsync({
        orderId: 'order-123',
        payment: { upiId: 'test@upi' }
      });
      expect(res.status).toBe('CONFIRMED');
    });

    await act(async () => {
      const res = await failPaymentHook.current.mutateAsync({ orderId: 'order-123' });
      expect(res.status).toBe('FAILED');
    });
  });
});
