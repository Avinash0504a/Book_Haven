import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useBooks, useCategories, useBook, useRelated } from './useCatalog.js';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PincodeProvider } from '../../../providers/PincodeProvider.jsx';

describe('useCatalog Hooks', () => {
  const createWrapper = () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } }
    });
    function TestWrapper({ children }) {
      return (
        <QueryClientProvider client={queryClient}>
          <PincodeProvider>{children}</PincodeProvider>
        </QueryClientProvider>
      );
    }
    return TestWrapper;
  };

  it('fetches books list with pagination', async () => {
    const { result } = renderHook(() => useBooks(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data.items).toHaveLength(2);
    expect(result.current.data.items[0].title).toBe('The Guide');
  });

  it('fetches categories', async () => {
    const { result } = renderHook(() => useCategories(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(3);
    expect(result.current.data[0].name).toBe('Fiction');
  });

  it('fetches single book details and related books', async () => {
    const { result: bookRes } = renderHook(() => useBook('book-1'), { wrapper: createWrapper() });
    await waitFor(() => expect(bookRes.current.isSuccess).toBe(true));
    expect(bookRes.current.data.title).toBe('The Guide');

    const { result: relatedRes } = renderHook(() => useRelated('book-1'), { wrapper: createWrapper() });
    await waitFor(() => expect(relatedRes.current.isSuccess).toBe(true));
    expect(relatedRes.current.data[0].title).toBe('Godan');
  });
});
