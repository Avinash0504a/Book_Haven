import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/setup.js';
import { renderWithProviders } from '../../../test/renderWithProviders.jsx';
import WishlistButton from './WishlistButton';

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

describe('WishlistButton', () => {
  it('showsSavedState: displays correct label based on inWishlist prop', () => {
    const { unmount } = renderWithProviders(<WishlistButton bookId="book-1" inWishlist={false} />);
    expect(screen.getByRole('button', { name: 'Add to wishlist' })).toBeInTheDocument();
    unmount();

    renderWithProviders(<WishlistButton bookId="book-1" inWishlist={true} />);
    expect(screen.getByRole('button', { name: 'Remove from wishlist' })).toBeInTheDocument();
  });

  it('guestRedirect: sends an unauthenticated user to login on click', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <Routes>
        <Route path="/" element={<WishlistButton bookId="book-1" inWishlist={false} />} />
        <Route path="/login" element={<div>Login page</div>} />
      </Routes>
    );

    await user.click(screen.getByRole('button', { name: 'Add to wishlist' }));

    expect(await screen.findByText('Login page')).toBeInTheDocument();
  });

  it('toggleCallsApi: adds when not saved and removes when saved', async () => {
    const user = userEvent.setup();
    const calls = [];
    server.use(
      http.post('/api/wishlist', async ({ request }) => {
        calls.push({ method: 'POST', body: await request.json() });
        return HttpResponse.json({ success: true, data: null, message: null, code: null });
      }),
      http.delete('/api/wishlist/:id', ({ params }) => {
        calls.push({ method: 'DELETE', id: params.id });
        return HttpResponse.json({ success: true, data: null, message: null, code: null });
      })
    );

    const { unmount } = renderWithProviders(<WishlistButton bookId="book-1" inWishlist={false} />, { auth });
    await user.click(screen.getByRole('button', { name: 'Add to wishlist' }));
    await waitFor(() => expect(calls).toContainEqual({ method: 'POST', body: { bookId: 'book-1' } }));
    unmount();

    renderWithProviders(<WishlistButton bookId="book-1" inWishlist={true} />, { auth });
    await user.click(screen.getByRole('button', { name: 'Remove from wishlist' }));
    await waitFor(() => expect(calls).toContainEqual({ method: 'DELETE', id: 'book-1' }));
  });
});
