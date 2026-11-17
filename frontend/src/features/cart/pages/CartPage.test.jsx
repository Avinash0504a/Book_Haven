import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import React from 'react';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/setup.js';
import { renderWithProviders } from '../../../test/renderWithProviders.jsx';
import { CartPage } from './CartPage.jsx';

const mockAuth = {
  token: 'mock-jwt-token',
  member: {
    id: '00000000-0000-0000-0000-000000000001',
    fullName: 'Demo Reader',
    email: 'reader@bookhaven.local',
    giftPoints: 120,
    walletBalance: '250.00'
  }
};

const mockPhysicalCart = {
  items: [
    {
      id: 'item-1',
      book: {
        id: 'book-1',
        slug: 'the-guide',
        title: 'The Guide',
        author: { name: 'R. K. Narayan', slug: 'author-1' },
        format: 'PAPERBACK',
        price: '299.00',
        discountPercent: 10,
        unitPrice: '269.10',
        coverImageUrl: '/covers/the-guide.svg'
      },
      quantity: 1,
      maxQuantity: 10,
      lineTotal: '269.10'
    }
  ],
  subtotal: '269.10',
  shippingAmount: '49.00',
  freeShippingRemaining: '230.90',
  total: '318.10',
  pointsToEarn: 26,
  hasPhysical: true,
  hasDigital: false,
  itemCount: 1
};

const mockFreeShippingCart = {
  items: [
    {
      id: 'item-2',
      book: {
        id: 'book-1',
        slug: 'the-guide',
        title: 'The Guide',
        author: { name: 'R. K. Narayan', slug: 'author-2' },
        format: 'PAPERBACK',
        price: '299.00',
        discountPercent: 10,
        unitPrice: '269.10',
        coverImageUrl: '/covers/the-guide.svg'
      },
      quantity: 2,
      maxQuantity: 10,
      lineTotal: '538.20'
    }
  ],
  subtotal: '538.20',
  shippingAmount: '0.00',
  freeShippingRemaining: '0.00',
  total: '538.20',
  pointsToEarn: 53,
  hasPhysical: true,
  hasDigital: false,
  itemCount: 2
};

const mockDigitalCart = {
  items: [
    {
      id: 'item-3',
      book: {
        id: 'book-2',
        slug: 'godan',
        title: 'Godan',
        author: { name: 'Munshi Premchand', slug: 'author-3' },
        format: 'EBOOK',
        price: '149.00',
        discountPercent: 0,
        unitPrice: '149.00',
        coverImageUrl: '/covers/godan.svg'
      },
      quantity: 1,
      maxQuantity: 10,
      lineTotal: '149.00'
    }
  ],
  subtotal: '149.00',
  shippingAmount: '0.00',
  freeShippingRemaining: '0.00',
  total: '149.00',
  pointsToEarn: 14,
  hasPhysical: false,
  hasDigital: true,
  itemCount: 1
};

describe('CartPage', () => {
  it('renders empty state when cart has no items', async () => {
    server.use(
      http.get('/api/cart', () => {
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
            itemCount: 0
          },
          message: null,
          code: null
        });
      })
    );

    renderWithProviders(<CartPage />);

    expect(await screen.findByText(/Your Cart is Empty/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Explore Books/i })).toBeInTheDocument();
  });

  it('renders sub-500 cart with ₹49 shipping, progress bar and preselected default address', async () => {
    server.use(
      http.get('/api/cart', () => {
        return HttpResponse.json({
          success: true,
          data: mockPhysicalCart,
          message: null,
          code: null
        });
      })
    );

    renderWithProviders(<CartPage />, { auth: mockAuth });

    expect(await screen.findByText('The Guide')).toBeInTheDocument();
    expect(screen.getByText(/₹230.90/i)).toBeInTheDocument();
    expect(screen.getByText(/₹49.00/i)).toBeInTheDocument();
    expect(screen.getByText(/₹318.10/i)).toBeInTheDocument();
    expect(await screen.findByText(/Demo Reader/i)).toBeInTheDocument();
    expect(screen.getByText(/Deliver to this address/i)).toBeInTheDocument();
  });

  it('renders at/above 500 cart with FREE delivery', async () => {
    server.use(
      http.get('/api/cart', () => {
        return HttpResponse.json({
          success: true,
          data: mockFreeShippingCart,
          message: null,
          code: null
        });
      })
    );

    renderWithProviders(<CartPage />, { auth: mockAuth });

    expect(await screen.findByText('The Guide')).toBeInTheDocument();
    expect(screen.getByText(/You qualify for FREE Delivery!/i)).toBeInTheDocument();
    expect(screen.getByText('FREE')).toBeInTheDocument();
  });

  it('hides address selector for digital-only cart', async () => {
    server.use(
      http.get('/api/cart', () => {
        return HttpResponse.json({
          success: true,
          data: mockDigitalCart,
          message: null,
          code: null
        });
      })
    );

    renderWithProviders(<CartPage />, { auth: mockAuth });

    expect(await screen.findByText('Godan')).toBeInTheDocument();
    expect(screen.queryByText(/Delivery Address/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Proceed to Checkout/i })).not.toBeDisabled();
  });

  it('never renders promo code or voucher inputs (FR-035)', async () => {
    server.use(
      http.get('/api/cart', () => {
        return HttpResponse.json({
          success: true,
          data: mockPhysicalCart,
          message: null,
          code: null
        });
      })
    );

    renderWithProviders(<CartPage />, { auth: mockAuth });

    expect(await screen.findByText('The Guide')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/promo/i)).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/coupon/i)).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/voucher/i)).not.toBeInTheDocument();
  });
});
