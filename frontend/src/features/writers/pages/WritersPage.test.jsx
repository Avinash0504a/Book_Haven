import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import React from 'react';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/setup.js';
import { renderWithProviders } from '../../../test/renderWithProviders.jsx';
import WritersPage from './WritersPage';

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

describe('WritersPageTest', () => {
  it('listsFollowed: displays followed writers and all writers', async () => {
    renderWithProviders(<WritersPage />, { auth });

    expect(await screen.findByText('Featured Writers')).toBeInTheDocument();
    expect(await screen.findByText('Writers You Follow')).toBeInTheDocument();
    expect(screen.getAllByText('R. K. Narayan').length).toBeGreaterThan(0);
  });

  it('shows the About the writer bio on each writer card', async () => {
    renderWithProviders(<WritersPage />);

    expect(await screen.findByText('About the writer')).toBeInTheDocument();
    expect(screen.getByText('Celebrated Indian novelist known for Malgudi stories.')).toBeInTheDocument();
  });

  it('emptyFollowedState: shows a hint when no writer is followed', async () => {
    server.use(
      http.get('/api/following', () =>
        HttpResponse.json({ success: true, data: [], message: null, code: null })
      )
    );
    renderWithProviders(<WritersPage />, { auth });

    expect(await screen.findByText('You are not following any writers yet.')).toBeInTheDocument();
  });

  it('guest sees all writers and no followed section', async () => {
    renderWithProviders(<WritersPage />);

    expect(await screen.findByText('Browse All Writers')).toBeInTheDocument();
    expect(screen.queryByText('Writers You Follow')).not.toBeInTheDocument();
  });
});
