import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/setup.js';
import { renderWithProviders } from '../../../test/renderWithProviders.jsx';
import LibraryPage from './LibraryPage';

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

describe('LibraryPageTest', () => {
  it('listsPurchased: displays purchased digital books with Read and Download actions', async () => {
    renderWithProviders(<LibraryPage />, { auth });

    expect(await screen.findByText('E-Library')).toBeInTheDocument();
    expect(await screen.findByText('Godan')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Read Online' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Download' })).toBeInTheDocument();
  });

  it('emptyStateLinksToDigital: an empty library offers a way to browse digital books', async () => {
    server.use(
      http.get('/api/library', () =>
        HttpResponse.json({ success: true, data: [], message: null, code: null })
      )
    );
    renderWithProviders(<LibraryPage />, { auth });

    expect(await screen.findByText('Your E-Library is empty')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Browse Digital Books' })).toBeInTheDocument();
  });

  it('downloadSendsToken: the download request carries the bearer token', async () => {
    const user = userEvent.setup();
    let authorization = null;
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    server.use(
      http.get('/api/library/:id/download', ({ request }) => {
        authorization = request.headers.get('authorization');
        return new HttpResponse('epub-bytes', {
          headers: { 'Content-Type': 'application/octet-stream' }
        });
      })
    );
    URL.createObjectURL = () => 'blob:mock';
    URL.revokeObjectURL = () => {};
    renderWithProviders(<LibraryPage />, { auth });

    await user.click(await screen.findByRole('button', { name: 'Download' }));

    await waitFor(() => expect(authorization).toBe('Bearer mock-jwt-token'));
    await waitFor(() => expect(clickSpy).toHaveBeenCalled());
    clickSpy.mockRestore();
  });
});
