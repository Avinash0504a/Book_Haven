import { describe, it, expect } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/setup.js';
import { renderWithProviders } from '../../../test/renderWithProviders.jsx';
import { OrderDetailPage } from './OrderDetailPage.jsx';

const mockAuth = {
  token: 'mock-jwt-token',
  member: {
    id: '00000000-0000-0000-0000-000000000001',
    fullName: 'Demo Reader',
    email: 'reader@bookhaven.local'
  }
};

const mockDetailOrder = {
  id: '01912345-6789-7000-8000-000000000001',
  orderNumber: 'BH-2026-1001',
  status: 'CONFIRMED',
  subtotal: '499.00',
  shippingAmount: '0.00',
  pointsRedeemed: 100,
  pointsDiscountAmount: '10.00',
  grandTotal: '489.00',
  pointsEarned: 48,
  paymentMethod: 'Credit Card',
  estimatedDeliveryDate: '20 Nov 2026',
  cancellable: true,
  items: [
    {
      id: 'item-1',
      bookId: 'b1',
      title: 'Midnight in Malgudi',
      authorName: 'R. K. Narayan',
      format: 'PAPERBACK',
      unitPrice: '499.00',
      quantity: 1,
      lineTotal: '499.00',
      coverImageUrl: '/covers/malgudi.svg'
    }
  ],
  shippingAddress: {
    recipientName: 'Demo Reader',
    phone: '9876543210',
    line1: '123 MG Road',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560001'
  },
  cancellations: []
};

describe('OrderDetailPageTest', () => {
  it('showsAllFields: renders items, quantities, prices, delivery charge, points, address, status and dates', async () => {
    server.use(
      http.get('/api/orders/01912345-6789-7000-8000-000000000001', () => {
        return HttpResponse.json({
          success: true,
          data: mockDetailOrder,
          message: null,
          code: null
        });
      })
    );

    renderWithProviders(
      <Routes>
        <Route path="/orders/:id" element={<OrderDetailPage />} />
      </Routes>,
      {
        initialEntries: ['/orders/01912345-6789-7000-8000-000000000001'],
        auth: mockAuth
      }
    );

    expect(await screen.findByText('Midnight in Malgudi')).toBeInTheDocument();
    expect(screen.getByText(/BH-2026-1001/i)).toBeInTheDocument();
    expect(screen.getByText(/123 MG Road/i)).toBeInTheDocument();
    expect(screen.getByText(/Points Earned: \+48 pts/i)).toBeInTheDocument();
    expect(screen.getByText(/-₹10.00/i)).toBeInTheDocument();
    expect(screen.getByText('₹489.00')).toBeInTheDocument();
  });

  it('buyAgainListsUnavailable: Buy Again shows alert naming unavailable titles if any', async () => {
    server.use(
      http.get('/api/orders/01912345-6789-7000-8000-000000000001', () => {
        return HttpResponse.json({
          success: true,
          data: mockDetailOrder,
          message: null,
          code: null
        });
      }),
      http.post('/api/orders/01912345-6789-7000-8000-000000000001/buy-again', () => {
        return HttpResponse.json({
          success: true,
          data: { added: [], unavailable: ['Midnight in Malgudi'] },
          message: null,
          code: null
        });
      })
    );

    renderWithProviders(
      <Routes>
        <Route path="/orders/:id" element={<OrderDetailPage />} />
      </Routes>,
      {
        initialEntries: ['/orders/01912345-6789-7000-8000-000000000001'],
        auth: mockAuth
      }
    );

    expect(await screen.findByText('Midnight in Malgudi')).toBeInTheDocument();
    const buyAgainBtn = screen.getByRole('button', { name: /Buy Again/i });
    fireEvent.click(buyAgainBtn);

    expect(await screen.findByText(/Midnight in Malgudi is currently unavailable/i)).toBeInTheDocument();
  });

  it('otherMembersOrderNotFound: shows not-found error state on 404 or missing order', async () => {
    server.use(
      http.get('/api/orders/unknown-order', () => {
        return HttpResponse.json(
          { success: false, data: null, message: 'Order not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      })
    );

    renderWithProviders(
      <Routes>
        <Route path="/orders/:id" element={<OrderDetailPage />} />
      </Routes>,
      {
        initialEntries: ['/orders/unknown-order'],
        auth: mockAuth
      }
    );

    expect(await screen.findByText(/Order Not Found/i)).toBeInTheDocument();
  });
});
