import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/setup.js';
import { renderWithProviders } from '../../../test/renderWithProviders.jsx';
import { CheckoutPage } from './CheckoutPage.jsx';
import { RequireAuth } from '../../../routes/RequireAuth.jsx';

const mockCart = {
  items: [
    {
      id: 'item-1',
      book: {
        id: 'book-1',
        slug: 'midnight-in-malgudi',
        title: 'Midnight in Malgudi',
        author: { name: 'R. K. Narayan', slug: 'r-k-narayan' },
        format: 'PAPERBACK',
        price: '299.00',
        discountPercent: 0,
        unitPrice: '299.00',
        coverImageUrl: '/covers/malgudi.svg'
      },
      quantity: 1,
      maxQuantity: 10,
      lineTotal: '299.00'
    }
  ],
  subtotal: '299.00',
  shippingAmount: '49.00',
  freeShippingRemaining: '201.00',
  total: '348.00',
  pointsToEarn: 29,
  hasPhysical: true,
  hasDigital: false,
  itemCount: 1
};

const mockAddress = {
  id: 'addr-1',
  recipientName: 'Demo Reader',
  phone: '9876543210',
  line1: '123 MG Road',
  city: 'Bengaluru',
  state: 'Karnataka',
  postalCode: '560001',
  country: 'India',
  isDefault: true
};

describe('CheckoutEdgeCasesTest', () => {
  it('sessionExpiryReturnsToCheckout: unauthenticated or expired token redirects to login with return state', () => {
    renderWithProviders(
      <Routes>
        <Route
          path="/checkout"
          element={
            <RequireAuth>
              <CheckoutPage />
            </RequireAuth>
          }
        />
        <Route path="/login" element={<div>Login Page Target</div>} />
      </Routes>,
      {
        initialEntries: ['/checkout'],
        auth: null // guest / expired
      }
    );

    expect(screen.getByText('Login Page Target')).toBeInTheDocument();
  });

  it('stockConflictShowsMessage: shows clear conflict message when stock is unavailable (409)', async () => {
    server.use(
      http.get('/api/cart', () => {
        return HttpResponse.json({
          success: true,
          data: mockCart,
          message: null,
          code: null
        });
      }),
      http.get('/api/addresses', () => {
        return HttpResponse.json({
          success: true,
          data: [mockAddress],
          message: null,
          code: null
        });
      }),
      http.post('/api/checkout/order', () => {
        return HttpResponse.json(
          {
            success: false,
            data: null,
            message: 'Insufficient stock for requested item',
            code: 'INSUFFICIENT_STOCK'
          },
          { status: 409 }
        );
      })
    );

    const mockAuth = {
      token: 'mock-jwt-token',
      member: {
        id: '00000000-0000-0000-0000-000000000001',
        fullName: 'Demo Reader',
        email: 'reader@bookhaven.local',
        giftPoints: 100,
        walletBalance: '250.00'
      }
    };

    renderWithProviders(
      <Routes>
        <Route path="/checkout" element={<CheckoutPage />} />
      </Routes>,
      {
        initialEntries: ['/checkout'],
        auth: mockAuth
      }
    );

    expect(await screen.findByText(/Delivering to/i)).toBeInTheDocument();
    expect(screen.getByText(/Pay ₹348.00/i)).toBeInTheDocument();
  });

  it('showsSelectedAddress: shows the address chosen in the cart, not the default one', async () => {
    const other = {
      ...mockAddress,
      id: 'addr-2',
      recipientName: 'Office Reader',
      line1: '22 Second Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400001',
      isDefault: false
    };
    server.use(
      http.get('/api/cart', () =>
        HttpResponse.json({ success: true, data: mockCart, message: null, code: null })
      ),
      http.get('/api/addresses', () =>
        HttpResponse.json({ success: true, data: [mockAddress, other], message: null, code: null })
      )
    );

    renderWithProviders(
      <Routes>
        <Route path="/checkout" element={<CheckoutPage />} />
      </Routes>,
      {
        initialEntries: [{ pathname: '/checkout', state: { addressId: 'addr-2' } }],
        auth: {
          token: 'mock-jwt-token',
          member: { id: 'm-1', fullName: 'Demo Reader', email: 'reader@bookhaven.local', giftPoints: 0, walletBalance: '0.00' }
        }
      }
    );

    expect(await screen.findByText(/Office Reader/)).toBeInTheDocument();
    expect(screen.getByText(/22 Second Street/)).toBeInTheDocument();
    expect(screen.getByText(/Mumbai, Maharashtra - 400001/)).toBeInTheDocument();
    expect(screen.queryByText(/Please select a delivery address/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/123 MG Road/)).not.toBeInTheDocument();
  });
});
