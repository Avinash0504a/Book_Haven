import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useWallet, usePointsHistory } from './useWallet';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });
  function QueryWrapper({ children }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return QueryWrapper;
}

describe('useWallet hooks', () => {
  it('useWallet fetches wallet balance and transactions', async () => {
    const { result } = renderHook(() => useWallet(), {
      wrapper: createWrapper()
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data.balance).toBe(250);
    expect(result.current.data.transactions).toHaveLength(1);
  });

  it('usePointsHistory fetches points transactions', async () => {
    const { result } = renderHook(() => usePointsHistory(), {
      wrapper: createWrapper()
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data[0].reason).toBe('EARNED');
  });
});
