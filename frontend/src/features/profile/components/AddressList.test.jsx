import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/setup.js';
import { renderWithProviders } from '../../../test/renderWithProviders.jsx';
import AddressList from './AddressList';

const auth = {
  token: 'mock-jwt-token',
  member: {
    id: '00000000-0000-0000-0000-000000000001',
    fullName: 'Demo Reader',
    email: 'reader@bookhaven.local',
    giftPoints: 120,
    walletBalance: '250.00'
  }
};

const home = {
  id: 'addr-1',
  label: 'HOME',
  recipientName: 'Demo Reader',
  phone: '9876543210',
  line1: '123 Baker Street',
  line2: '',
  city: 'New Delhi',
  state: 'Delhi',
  postalCode: '110001',
  country: 'India',
  isDefault: true
};
const office = { ...home, id: 'addr-2', label: 'OFFICE', recipientName: 'Work User', isDefault: false };

function listOf(items) {
  return http.get('/api/addresses', () =>
    HttpResponse.json({ success: true, data: items, message: null, code: null })
  );
}

describe('AddressListTest', () => {
  it('setDefaultClearsOld: Set as Default sends isDefault true for the chosen address', async () => {
    const user = userEvent.setup();
    let patched = null;
    server.use(
      listOf([home, office]),
      http.patch('/api/addresses/:id', async ({ params, request }) => {
        patched = { id: params.id, body: await request.json() };
        return HttpResponse.json({ success: true, data: { ...office, isDefault: true }, message: null, code: null });
      })
    );
    renderWithProviders(<AddressList />, { auth });

    await user.click(await screen.findByRole('button', { name: 'Set as Default' }));

    await waitFor(() => expect(patched).not.toBeNull());
    expect(patched.id).toBe('addr-2');
    expect(patched.body.isDefault).toBe(true);
  });

  it('deleteLeavesNoneSelected: deleting the default leaves no default badge', async () => {
    const user = userEvent.setup();
    let items = [home];
    server.use(
      http.get('/api/addresses', () =>
        HttpResponse.json({ success: true, data: items, message: null, code: null })
      ),
      http.delete('/api/addresses/:id', () => {
        items = [];
        return HttpResponse.json({ success: true, data: null, message: null, code: null });
      })
    );
    renderWithProviders(<AddressList />, { auth });

    expect(await screen.findByText('Default')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(screen.queryByText('Default')).not.toBeInTheDocument());
  });

  it('invalidPincodeBlocked: a bad PIN code is refused and nothing is sent', async () => {
    const user = userEvent.setup();
    let posted = false;
    server.use(
      listOf([]),
      http.post('/api/addresses', () => {
        posted = true;
        return HttpResponse.json({ success: true, data: home, message: null, code: null });
      })
    );
    renderWithProviders(<AddressList />, { auth });

    await user.click(await screen.findByRole('button', { name: '+ Add Address' }));
    await user.type(screen.getByLabelText(/Recipient Name/i), 'Demo Reader');
    await user.type(screen.getByLabelText(/Phone Number/i), '9876543210');
    await user.type(screen.getByLabelText(/PIN Code/i), '12345');
    await user.type(screen.getByLabelText(/Address Line 1/i), '1 Main Road');
    await user.type(screen.getByLabelText(/^City/), 'Delhi');
    await user.type(screen.getByLabelText(/^State/), 'Delhi');
    await user.click(screen.getByRole('button', { name: 'Add Address' }));

    await waitFor(() => expect(screen.getByLabelText(/PIN Code/i)).toHaveAttribute('aria-invalid', 'true'));
    expect(posted).toBe(false);
  });

  it('addSaves: a valid address is sent and the form closes', async () => {
    const user = userEvent.setup();
    let sent = null;
    server.use(
      listOf([]),
      http.post('/api/addresses', async ({ request }) => {
        sent = await request.json();
        return HttpResponse.json({ success: true, data: { ...home, ...sent, id: 'addr-new' }, message: null, code: null });
      })
    );
    renderWithProviders(<AddressList />, { auth });

    await user.click(await screen.findByRole('button', { name: '+ Add Address' }));
    await user.type(screen.getByLabelText(/Recipient Name/i), 'Demo Reader');
    await user.type(screen.getByLabelText(/Phone Number/i), '9876543210');
    await user.type(screen.getByLabelText(/PIN Code/i), '110001');
    await user.type(screen.getByLabelText(/Address Line 1/i), '1 Main Road');
    await user.type(screen.getByLabelText(/^City/), 'Delhi');
    await user.type(screen.getByLabelText(/^State/), 'Delhi');
    await user.click(screen.getByRole('button', { name: 'Add Address' }));

    await waitFor(() => expect(sent).not.toBeNull());
    expect(sent.postalCode).toBe('110001');
    await waitFor(() => expect(screen.queryByText('Add New Address')).not.toBeInTheDocument());
  });
});
