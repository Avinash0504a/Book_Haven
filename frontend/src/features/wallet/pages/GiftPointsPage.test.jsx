import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import React from 'react';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/setup.js';
import { renderWithProviders } from '../../../test/renderWithProviders.jsx';
import GiftPointsPage from './GiftPointsPage';

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

describe('GiftPointsPageTest', () => {
  it('listsEntriesAndBalance: displays gift points balance and transaction list', async () => {
    renderWithProviders(<GiftPointsPage />, { auth });

    expect(await screen.findByText('Gift Points')).toBeInTheDocument();
    expect(await screen.findByText('Points Earned on Purchase')).toBeInTheDocument();
    expect(screen.getByText('+50 pts')).toBeInTheDocument();
    expect(screen.getByText('Balance: 120 pts')).toBeInTheDocument();
  });

  it('emptyState: shows an empty state when there is no history', async () => {
    server.use(
      http.get('/api/auth/points-history', () =>
        HttpResponse.json({ success: true, data: [], message: null, code: null })
      )
    );
    renderWithProviders(<GiftPointsPage />, { auth });

    expect(await screen.findByText('No points history yet')).toBeInTheDocument();
  });
});
