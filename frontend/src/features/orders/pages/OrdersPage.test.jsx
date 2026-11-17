import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import React from 'react';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/setup.js';
import { renderWithProviders } from '../../../test/renderWithProviders.jsx';
import { OrdersPage } from './OrdersPage.jsx';
import { OrderCard } from '../components/OrderCard.jsx';

const mockAuth = {
  token: 'mock-jwt-token',
  member: {
    id: '00000000-0000-0000-0000-000000000001',
    fullName: 'Demo Reader',
    email: 'reader@bookhaven.local'
  }
};

const mockOrders = [
  {
    id: 'ord-old',
    orderNumber: 'BH-1001',
    status: 'DELIVERED',
    createdAt: '2026-11-01T10:00:00Z',
    grandTotal: '299.00',
    cancellable: false,
    items: [{ bookId: 'b1', title: 'Old Book', quantity: 1, price: '299.00', format: 'PAPERBACK' }]
  },
  {
    id: 'ord-new',
    orderNumber: 'BH-1002',
    status: 'CONFIRMED',
    createdAt: '2026-11-14T10:00:00Z',
    grandTotal: '499.00',
    cancellable: true,
    items: [{ bookId: 'b2', title: 'New Book', quantity: 1, price: '499.00', format: 'HARDCOVER' }]
  }
];

describe('OrdersPageTest', () => {
  it('newestFirst: renders orders sorted newest first', async () => {
    server.use(
      http.get('/api/orders', () => {
        return HttpResponse.json({
          success: true,
          data: mockOrders,
          message: null,
          code: null
        });
      })
    );

    renderWithProviders(<OrdersPage />, { auth: mockAuth });

    expect(await screen.findByText('New Book')).toBeInTheDocument();
    expect(screen.getByText('Old Book')).toBeInTheDocument();

    const orderNumbers = screen.getAllByText(/#BH-100/i).map((el) => el.textContent);
    expect(orderNumbers[0]).toBe('#BH-1002');
    expect(orderNumbers[1]).toBe('#BH-1001');
  });

  it('emptyState: renders EmptyState with browse books link when no orders', async () => {
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
});

describe('OrderCardTest', () => {
  it('noCancelButtonWhenNotCancellable: cancel button is hidden when cancellable is false', () => {
    renderWithProviders(<OrderCard order={mockOrders[0]} />, { auth: mockAuth });
    expect(screen.queryByRole('button', { name: /Cancel/i })).not.toBeInTheDocument();
  });

  it('ebookOrderShowsViewBook: an eBook-only order offers View Book instead of Buy Again', () => {
    const ebookOrder = {
      ...mockOrders[0],
      items: [{ bookId: 'b3', title: 'Digital Book', quantity: 1, price: '99.00', format: 'EBOOK' }]
    };
    renderWithProviders(<OrderCard order={ebookOrder} />, { auth: mockAuth });

    expect(screen.getByRole('button', { name: /View Book/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Buy Again/i })).not.toBeInTheDocument();
  });

  it('physicalOrderKeepsBuyAgain: a paperback order still offers Buy Again', () => {
    renderWithProviders(<OrderCard order={mockOrders[0]} />, { auth: mockAuth });

    expect(screen.getByRole('button', { name: /Buy Again/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /View Book/i })).not.toBeInTheDocument();
  });

  it('trackerShowsStatus: displays tracker status correctly and shows cancel button when cancellable', () => {
    renderWithProviders(<OrderCard order={mockOrders[1]} />, { auth: mockAuth });
    expect(screen.getByTestId('order-tracker')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
  });
});
