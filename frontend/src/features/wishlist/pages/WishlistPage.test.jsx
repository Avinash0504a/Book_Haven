import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/setup.js';
import { renderWithProviders } from '../../../test/renderWithProviders.jsx';
import WishlistPage from './WishlistPage';

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

describe('WishlistPageTest', () => {
  it('renders wishlist books and actions', async () => {
    renderWithProviders(<WishlistPage />, { auth });

    expect(await screen.findByText('My Wishlist')).toBeInTheDocument();
    expect(await screen.findByText('The Guide')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Move to Cart' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove' })).toBeInTheDocument();
  });

  it('removeDisappears: Remove calls the API for that book', async () => {
    const user = userEvent.setup();
    let removedId = null;
    server.use(
      http.delete('/api/wishlist/:id', ({ params }) => {
        removedId = params.id;
        return HttpResponse.json({ success: true, data: null, message: null, code: null });
      })
    );
    renderWithProviders(<WishlistPage />, { auth });

    await user.click(await screen.findByRole('button', { name: 'Remove' }));

    await waitFor(() => expect(removedId).toBe('book-1'));
  });

  it('moveToCartAddsAndRemoves: adds one copy to the cart then removes the wishlist entry', async () => {
    const user = userEvent.setup();
    const calls = [];
    server.use(
      http.post('/api/cart/items', async ({ request }) => {
        calls.push(['cart', await request.json()]);
        return HttpResponse.json({
          success: true,
          data: {
            items: [],
            subtotal: '0.00',
            shippingAmount: '0.00',
            freeShippingRemaining: '500.00',
            total: '0.00',
            pointsToEarn: 0,
            hasPhysical: false,
            hasDigital: false,
            itemCount: 1
          },
          message: null,
          code: null
        });
      }),
      http.delete('/api/wishlist/:id', ({ params }) => {
        calls.push(['wishlist-remove', params.id]);
        return HttpResponse.json({ success: true, data: null, message: null, code: null });
      })
    );
    renderWithProviders(<WishlistPage />, { auth });

    await user.click(await screen.findByRole('button', { name: 'Move to Cart' }));

    await waitFor(() => expect(calls).toHaveLength(2));
    expect(calls[0]).toEqual(['cart', { bookId: 'book-1', quantity: 1 }]);
    expect(calls[1]).toEqual(['wishlist-remove', 'book-1']);
  });

  it('outOfStockShowsNotifyMe: an out-of-stock book offers Notify Me instead of Move to Cart', async () => {
    server.use(
      http.get('/api/wishlist', () =>
        HttpResponse.json({
          success: true,
          data: [
            {
              id: 'book-9',
              title: 'Sold Out Story',
              slug: 'sold-out-story',
              author: { name: 'A. Writer', slug: 'a-writer' },
              format: 'PAPERBACK',
              language: 'English',
              price: 100.0,
              discountPercent: 0,
              unitPrice: 100.0,
              inStock: false
            }
          ],
          message: null,
          code: null
        })
      )
    );
    renderWithProviders(<WishlistPage />, { auth });

    expect(await screen.findByRole('button', { name: 'Notify Me' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Move to Cart' })).not.toBeInTheDocument();
  });

  it('emptyState: shows an empty state when nothing is saved', async () => {
    server.use(
      http.get('/api/wishlist', () =>
        HttpResponse.json({ success: true, data: [], message: null, code: null })
      )
    );
    renderWithProviders(<WishlistPage />, { auth });

    expect(await screen.findByText('Your wishlist is empty')).toBeInTheDocument();
  });
});
