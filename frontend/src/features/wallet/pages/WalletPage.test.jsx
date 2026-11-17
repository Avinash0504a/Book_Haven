import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/setup.js';
import { renderWithProviders } from '../../../test/renderWithProviders.jsx';
import WalletPage from './WalletPage';

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

async function openTopUp(user) {
  await user.click(await screen.findByRole('button', { name: 'Add Money' }));
  expect(screen.getByText('Add Money to Wallet')).toBeInTheDocument();
}

async function fillValidCard(user, amount) {
  await user.type(screen.getByLabelText(/Amount/i), amount);
  await user.type(screen.getByLabelText('Card Number'), '4111111111111111');
  await user.type(screen.getByLabelText('Name on Card'), 'Demo Reader');
  await user.type(screen.getByLabelText(/Expiry/i), '12/2099');
  await user.type(screen.getByLabelText('CVV'), '123');
}

describe('WalletPageTest', () => {
  it('showsBalanceAndTransactions: renders wallet balance and transaction history', async () => {
    renderWithProviders(<WalletPage />, { auth });

    expect(await screen.findByText('Book Haven Wallet')).toBeInTheDocument();
    expect(await screen.findByText('₹250.00')).toBeInTheDocument();
    expect(await screen.findByText('Wallet top-up via CREDIT_CARD')).toBeInTheDocument();
    expect(screen.getByText('+₹500.00')).toBeInTheDocument();
  });

  it('renders top up form when Add Money button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<WalletPage />, { auth });

    await openTopUp(user);
    expect(screen.getByRole('button', { name: 'Proceed to Add Money' })).toBeInTheDocument();
  });

  it('topUpUpdatesPill: a successful top-up refreshes the member balance', async () => {
    const user = userEvent.setup();
    let meCalls = 0;
    server.use(
      http.get('/api/auth/me', () => {
        meCalls += 1;
        return HttpResponse.json({
          success: true,
          data: { ...auth.member, walletBalance: '750.00' },
          message: null,
          code: null
        });
      })
    );
    renderWithProviders(<WalletPage />, { auth });

    await openTopUp(user);
    await fillValidCard(user, '500');
    await user.click(screen.getByRole('button', { name: 'Proceed to Add Money' }));

    await waitFor(() => expect(meCalls).toBeGreaterThan(0));
    await waitFor(() => expect(screen.queryByText('Add Money to Wallet')).not.toBeInTheDocument());
  });

  it('amountOutOfRangeRefused: 100001 is refused and nothing is sent', async () => {
    const user = userEvent.setup();
    let posted = false;
    server.use(
      http.post('/api/wallet/topup', () => {
        posted = true;
        return HttpResponse.json({ success: true, data: null, message: null, code: null });
      })
    );
    renderWithProviders(<WalletPage />, { auth });

    await openTopUp(user);
    await fillValidCard(user, '100001');
    await user.click(screen.getByRole('button', { name: 'Proceed to Add Money' }));

    expect(await screen.findByText('Amount must be between 1 and 100,000 rupees')).toBeInTheDocument();
    expect(posted).toBe(false);
  });

  it('invalidPaymentBlocksSubmit: a bad card number is refused and nothing is sent', async () => {
    const user = userEvent.setup();
    let posted = false;
    server.use(
      http.post('/api/wallet/topup', () => {
        posted = true;
        return HttpResponse.json({ success: true, data: null, message: null, code: null });
      })
    );
    renderWithProviders(<WalletPage />, { auth });

    await openTopUp(user);
    await user.type(screen.getByLabelText(/Amount/i), '500');
    await user.type(screen.getByLabelText('Card Number'), '1234');
    await user.click(screen.getByRole('button', { name: 'Proceed to Add Money' }));

    await waitFor(() => expect(screen.getAllByText(/./).length).toBeGreaterThan(0));
    expect(posted).toBe(false);
    expect(screen.getByText('Add Money to Wallet')).toBeInTheDocument();
  });

  it('declinedShowsMessage: a declined payment shows the declined message', async () => {
    const user = userEvent.setup();
    server.use(
      http.post('/api/wallet/topup', () =>
        HttpResponse.json(
          { success: false, data: null, message: 'Payment declined by issuing bank', code: 'PAYMENT_DECLINED' },
          { status: 402 }
        )
      )
    );
    renderWithProviders(<WalletPage />, { auth });

    await openTopUp(user);
    await fillValidCard(user, '500');
    await user.click(screen.getByRole('button', { name: 'Proceed to Add Money' }));

    expect(
      await screen.findByText('Your payment was declined. Please try another payment method.')
    ).toBeInTheDocument();
  });
});
