import React from 'react';
import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useCart } from './useCart.js';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../../../providers/AuthProvider.jsx';

describe('useCart', () => {
  it('returns empty cart for guest', () => {
    const queryClient = new QueryClient();
    const wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    );

    const { result } = renderHook(() => useCart(), { wrapper });
    expect(result.current.itemCount).toBe(0);
    expect(result.current.cart.items).toEqual([]);
  });
});
