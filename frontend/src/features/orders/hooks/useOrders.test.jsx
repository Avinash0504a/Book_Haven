import { describe, it, expect } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/setup.js';
import {
  useOrders,
  useOrder,
  useBuyAgain,
  useCancelPreview,
  useCancelOrder
} from './useOrders.js';

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
  Wrapper.displayName = 'OrdersTestWrapper';
  return Wrapper;
}

describe('useOrders hooks', () => {
  it('useOrders fetches order history', async () => {
    server.use(
      http.get('/api/orders', () => {
        return HttpResponse.json({
          success: true,
          data: [
            { id: 'ord-1', orderNumber: 'BH-001', status: 'CONFIRMED' },
            { id: 'ord-2', orderNumber: 'BH-002', status: 'SHIPPED' }
          ],
          message: null,
          code: null
        });
      })
    );

    const { result } = renderHook(() => useOrders(), {
      wrapper: createWrapper()
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(2);
    expect(result.current.data[0].id).toBe('ord-1');
  });

  it('useOrder fetches single order details', async () => {
    server.use(
      http.get('/api/orders/ord-1', () => {
        return HttpResponse.json({
          success: true,
          data: { id: 'ord-1', orderNumber: 'BH-001', status: 'DELIVERED' },
          message: null,
          code: null
        });
      })
    );

    const { result } = renderHook(() => useOrder('ord-1'), {
      wrapper: createWrapper()
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data.status).toBe('DELIVERED');
  });

  it('useBuyAgain, useCancelPreview and useCancelOrder execute correctly', async () => {
    server.use(
      http.post('/api/orders/ord-1/buy-again', () => {
        return HttpResponse.json({
          success: true,
          data: { added: ['book-1'], unavailable: [] },
          message: null,
          code: null
        });
      }),
      http.get('/api/orders/ord-1/cancel-preview', () => {
        return HttpResponse.json({
          success: true,
          data: {
            cancellable: true,
            feeRate: 0,
            cancellationFee: 0,
            refundAmount: 299.0,
            pointsRestored: 20
          },
          message: null,
          code: null
        });
      }),
      http.post('/api/orders/ord-1/cancel', () => {
        return HttpResponse.json({
          success: true,
          data: { id: 'ord-1', status: 'CANCELLED' },
          message: null,
          code: null
        });
      })
    );

    const { result: buyAgainHook } = renderHook(() => useBuyAgain(), {
      wrapper: createWrapper()
    });
    const { result: previewHook } = renderHook(() => useCancelPreview(), {
      wrapper: createWrapper()
    });
    const { result: cancelHook } = renderHook(() => useCancelOrder(), {
      wrapper: createWrapper()
    });

    await act(async () => {
      const res = await buyAgainHook.current.mutateAsync('ord-1');
      expect(res.added).toContain('book-1');
    });

    await act(async () => {
      const res = await previewHook.current.mutateAsync({ orderId: 'ord-1' });
      expect(res.refundAmount).toBe(299.0);
    });

    await act(async () => {
      const res = await cancelHook.current.mutateAsync({
        orderId: 'ord-1',
        data: { reason: 'Found better price', refundMethod: 'WALLET' }
      });
      expect(res.status).toBe('CANCELLED');
    });
  });
});
