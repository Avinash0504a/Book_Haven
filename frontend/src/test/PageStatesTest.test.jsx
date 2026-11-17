import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from './setup.js';
import { renderWithProviders } from './renderWithProviders.jsx';
import { pages } from './pages.js';
import { HomePage } from '../features/catalog/pages/HomePage.jsx';
import { CartPage } from '../features/cart/pages/CartPage.jsx';
import { OrdersPage } from '../features/orders/pages/OrdersPage.jsx';
import { OrderDetailPage } from '../features/orders/pages/OrderDetailPage.jsx';
import WalletPage from '../features/wallet/pages/WalletPage.jsx';
import GiftPointsPage from '../features/wallet/pages/GiftPointsPage.jsx';
import WishlistPage from '../features/wishlist/pages/WishlistPage.jsx';
import LibraryPage from '../features/library/pages/LibraryPage.jsx';
import WritersPage from '../features/writers/pages/WritersPage.jsx';
import AuthorPage from '../features/writers/pages/AuthorPage.jsx';

const mockAuth = {
  token: 'mock-jwt-token',
  member: {
    id: '00000000-0000-0000-0000-000000000001',
    fullName: 'Demo Reader',
    email: 'reader@bookhaven.local'
  }
};

describe('PageStatesTest', () => {
  it('registryCoversEveryRoute: asserts all primary routes are present in registry', () => {
    const requiredKeys = [
      'home', 'login', 'register', 'cart', 'checkout', 'orders', 'orderDetail',
      'wishlist', 'wallet', 'giftPoints', 'profile', 'help', 'library', 'reader', 'writers', 'author'
    ];
    requiredKeys.forEach((key) => {
      expect(pages[key], `Missing ${key} in page registry`).toBeDefined();
    });
  });

  describe('OrdersPage states', () => {
    it('shows empty state with call to action when no orders exist', async () => {
      server.use(
        http.get('/api/orders', () => {
          return HttpResponse.json({
            success: true,
            data: [],
            message: null,
            code: null
          });
        })
      );

      renderWithProviders(<OrdersPage />, { auth: mockAuth });
      expect(await screen.findByText(/No Orders Found/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Browse Books/i })).toBeInTheDocument();
    });

    it('shows error state with generic message and retry on 500 error', async () => {
      server.use(
        http.get('/api/orders', () => {
          return HttpResponse.json(
            { success: false, data: null, message: 'Internal Server Error' },
            { status: 500 }
          );
        })
      );

      renderWithProviders(<OrdersPage />, { auth: mockAuth });
      expect(await screen.findByText(/Could not load orders/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument();
    });
  });

  describe('OrderDetailPage states', () => {
    it('shows error state with retry on 500 error', async () => {
      server.use(
        http.get('/api/orders/ord-1', () => {
          return HttpResponse.json(
            { success: false, data: null, message: 'Internal Server Error' },
            { status: 500 }
          );
        })
      );

      renderWithProviders(
        <Routes>
          <Route path="/orders/:id" element={<OrderDetailPage />} />
        </Routes>,
        { initialEntries: ['/orders/ord-1'], auth: mockAuth }
      );

      expect(await screen.findByText(/Could not load order/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument();
    });
  });

  describe('CartPage states', () => {
    it('shows empty state with explore action when cart has no items', async () => {
      server.use(
        http.get('/api/cart', () => {
          return HttpResponse.json({
            success: true,
            data: { items: [], total: '0.00', itemCount: 0 },
            message: null,
            code: null
          });
        })
      );

      renderWithProviders(<CartPage />, { auth: mockAuth });
      expect(await screen.findByText(/Your Cart is Empty/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Explore Books/i })).toBeInTheDocument();
    });
  });

  describe('Tier 2 page states', () => {
    const serverError = () =>
      HttpResponse.json({ success: false, data: null, message: 'Internal Server Error' }, { status: 500 });
    const emptyList = () => HttpResponse.json({ success: true, data: [], message: null, code: null });

    const errorCases = [
      ['WalletPage', '/api/wallet', <WalletPage key="w" />],
      ['GiftPointsPage', '/api/auth/points-history', <GiftPointsPage key="g" />],
      ['WishlistPage', '/api/wishlist', <WishlistPage key="wl" />],
      ['LibraryPage', '/api/library', <LibraryPage key="l" />],
      ['WritersPage', '/api/authors', <WritersPage key="wr" />]
    ];

    errorCases.forEach(([name, endpoint, page]) => {
      it(`${name} shows a generic error with retry on 500`, async () => {
        server.use(http.get(endpoint, serverError));
        renderWithProviders(page, { auth: mockAuth });
        expect(await screen.findByRole('alert')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument();
        expect(screen.queryByText(/Internal Server Error/i)).not.toBeInTheDocument();
      });
    });

    const emptyCases = [
      ['WishlistPage', '/api/wishlist', <WishlistPage key="wl" />, /Your wishlist is empty/i],
      ['LibraryPage', '/api/library', <LibraryPage key="l" />, /Your E-Library is empty/i],
      ['GiftPointsPage', '/api/auth/points-history', <GiftPointsPage key="g" />, /No points history yet/i]
    ];

    emptyCases.forEach(([name, endpoint, page, text]) => {
      it(`${name} shows an empty state`, async () => {
        server.use(http.get(endpoint, emptyList));
        renderWithProviders(page, { auth: mockAuth });
        expect(await screen.findByText(text)).toBeInTheDocument();
      });
    });

    it('AuthorPage shows not-found state for an unknown slug', async () => {
      server.use(http.get('/api/authors/nobody', () =>
        HttpResponse.json({ success: false, data: null, message: 'Not found', code: 'NOT_FOUND' }, { status: 404 })
      ));
      renderWithProviders(
        <Routes>
          <Route path="/writers/:slug" element={<AuthorPage />} />
        </Routes>,
        { initialEntries: ['/writers/nobody'], auth: mockAuth }
      );
      expect(await screen.findByText(/Writer Not Found/i)).toBeInTheDocument();
    });
  });

  describe('HomePage and ProductPage states', () => {
    it('shows empty state when search/filter returns zero books', async () => {
      server.use(
        http.get('/api/products', () => {
          return HttpResponse.json({
            success: true,
            data: { items: [], total: 0, totalPages: 0, page: 1, limit: 12 },
            message: null,
            code: null
          });
        })
      );

      renderWithProviders(<HomePage />, { initialEntries: ['/?search=nonexistent'] });
      expect(await screen.findByText(/No books found/i)).toBeInTheDocument();
    });
  });
});
