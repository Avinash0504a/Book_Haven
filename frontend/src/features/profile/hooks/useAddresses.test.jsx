import { describe, it, expect } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import React from 'react';
import { QueryProvider } from '../../../providers/QueryProvider.jsx';
import {
  useAddresses,
  useCreateAddress,
  useUpdateAddress,
  useDeleteAddress
} from './useAddresses.js';

function wrapper({ children }) {
  return <QueryProvider>{children}</QueryProvider>;
}

describe('useAddresses hooks', () => {
  it('fetches addresses successfully', async () => {
    const { result } = renderHook(() => useAddresses(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data[0].recipientName).toBe('Demo Reader');
    expect(result.current.data[0].isDefault).toBe(true);
  });

  it('creates, updates and deletes address', async () => {
    const { result: createHook } = renderHook(() => useCreateAddress(), { wrapper });
    let created;
    await act(async () => {
      created = await createHook.current.mutateAsync({
        label: 'OFFICE',
        recipientName: 'Work User',
        phone: '9876543211',
        line1: '456 Business Park',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400001'
      });
    });
    expect(created.recipientName).toBe('Work User');

    const { result: updateHook } = renderHook(() => useUpdateAddress(), { wrapper });
    let updated;
    await act(async () => {
      updated = await updateHook.current.mutateAsync({
        id: 'addr-new',
        data: { isDefault: true }
      });
    });
    expect(updated.isDefault).toBe(true);

    const { result: deleteHook } = renderHook(() => useDeleteAddress(), { wrapper });
    await act(async () => {
      await deleteHook.current.mutateAsync('addr-new');
    });
    expect(deleteHook.current.isSuccess).toBe(true);
  });
});
