import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/setup.js';
import { renderWithProviders } from '../../../test/renderWithProviders.jsx';
import ProfilePage from './ProfilePage';

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

describe('ProfilePageTest', () => {
  it('showsNameEmailWalletPoints: renders member name, email, wallet and points summary', async () => {
    renderWithProviders(<ProfilePage />, { auth });

    expect(await screen.findByText('My Profile')).toBeInTheDocument();
    expect(screen.getByText('Demo Reader')).toBeInTheDocument();
    expect(screen.getByText('reader@bookhaven.local')).toBeInTheDocument();
    expect(screen.getByText('₹250.00')).toBeInTheDocument();
    expect(screen.getByText('120 pts')).toBeInTheDocument();
  });

  it('editNameSaves: a new name is sent and the form closes', async () => {
    const user = userEvent.setup();
    let sent = null;
    server.use(
      http.patch('/api/auth/me', async ({ request }) => {
        sent = await request.json();
        return HttpResponse.json({
          success: true,
          data: { ...auth.member, fullName: sent.fullName },
          message: null,
          code: null
        });
      })
    );
    renderWithProviders(<ProfilePage />, { auth });

    await user.click(await screen.findByRole('button', { name: 'Edit Name' }));
    const input = screen.getByLabelText('Full Name');
    await user.clear(input);
    await user.type(input, 'Asha Reader');
    await user.click(screen.getByRole('button', { name: 'Save Name' }));

    await waitFor(() => expect(sent).toEqual({ fullName: 'Asha Reader' }));
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Save Name' })).not.toBeInTheDocument());
  });

  it('nameTooShortBlocked: a one-character name is refused and nothing is sent', async () => {
    const user = userEvent.setup();
    let patched = false;
    server.use(
      http.patch('/api/auth/me', () => {
        patched = true;
        return HttpResponse.json({ success: true, data: auth.member, message: null, code: null });
      })
    );
    renderWithProviders(<ProfilePage />, { auth });

    await user.click(await screen.findByRole('button', { name: 'Edit Name' }));
    const input = screen.getByLabelText('Full Name');
    await user.clear(input);
    await user.type(input, 'A');
    await user.click(screen.getByRole('button', { name: 'Save Name' }));

    expect(await screen.findByText('Full name must be at least 2 characters')).toBeInTheDocument();
    expect(patched).toBe(false);
  });

  it('serverNameError: a server field error is shown', async () => {
    const user = userEvent.setup();
    server.use(
      http.patch('/api/auth/me', () =>
        HttpResponse.json(
          {
            success: false,
            data: { fieldErrors: [{ field: 'fullName', message: 'fullName is not allowed' }] },
            message: 'Validation failed',
            code: 'VALIDATION_ERROR'
          },
          { status: 400 }
        )
      )
    );
    renderWithProviders(<ProfilePage />, { auth });

    await user.click(await screen.findByRole('button', { name: 'Edit Name' }));
    await user.click(screen.getByRole('button', { name: 'Save Name' }));

    expect(await screen.findByText('fullName is not allowed')).toBeInTheDocument();
  });
});
