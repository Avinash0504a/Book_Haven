import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../test/setup.js';
import { renderWithProviders } from '../test/renderWithProviders.jsx';
import { DefaultAddressPincode } from './DefaultAddressPincode.jsx';
import { usePincode } from './PincodeProvider.jsx';

const auth = {
  token: 'mock-jwt-token',
  member: { id: 'm-1', fullName: 'Demo Reader', email: 'reader@bookhaven.local' }
};

const address = (id, postalCode, isDefault) => ({
  id,
  label: 'HOME',
  recipientName: 'Demo Reader',
  phone: '9876543210',
  line1: '1 Main Road',
  line2: '',
  city: 'Bengaluru',
  state: 'Karnataka',
  postalCode,
  country: 'India',
  isDefault
});

function addressesAre(items) {
  server.use(
    http.get('/api/addresses', () =>
      HttpResponse.json({ success: true, data: items, message: null, code: null })
    )
  );
}

function Shell() {
  const { pincode } = usePincode();
  return (
    <>
      <DefaultAddressPincode />
      <span data-testid="pincode">{pincode}</span>
    </>
  );
}

describe('DefaultAddressPincode', () => {
  beforeEach(() => localStorage.clear());

  it('uses the default address pincode for a signed-in member', async () => {
    addressesAre([address('a1', '400001', false), address('a2', '560001', true)]);
    renderWithProviders(<Shell />, { auth });

    await waitFor(() => expect(screen.getByTestId('pincode')).toHaveTextContent('560001'));
  });

  it('falls back to the first address when none is marked default', async () => {
    addressesAre([address('a1', '700001', false)]);
    renderWithProviders(<Shell />, { auth });

    await waitFor(() => expect(screen.getByTestId('pincode')).toHaveTextContent('700001'));
  });

  it('keeps the standard pincode for a guest', async () => {
    addressesAre([address('a1', '560001', true)]);
    renderWithProviders(<Shell />);

    expect(screen.getByTestId('pincode')).toHaveTextContent('110001');
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(screen.getByTestId('pincode')).toHaveTextContent('110001');
  });
});
