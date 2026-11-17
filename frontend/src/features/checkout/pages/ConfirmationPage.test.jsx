import { describe, it, expect } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { renderWithProviders } from '../../../test/renderWithProviders.jsx';
import { ConfirmationPage } from './ConfirmationPage.jsx';

const mockConfirmedOrder = {
  id: '01912345-6789-7000-8000-000000000001',
  orderNumber: 'BH-2026-1001',
  status: 'CONFIRMED',
  subtotal: '499.00',
  shippingAmount: '0.00',
  grandTotal: '499.00',
  pointsEarned: 49,
  estimatedDeliveryDate: '20 Nov 2026',
  items: [
    {
      bookId: 'book-1',
      title: 'Midnight in Malgudi',
      authorName: 'R. K. Narayan',
      format: 'PAPERBACK',
      price: '499.00',
      quantity: 1,
      lineTotal: '499.00',
      coverImageUrl: '/covers/malgudi.svg'
    }
  ],
  shippingAddress: {
    recipientName: 'Demo Reader',
    postalCode: '110001'
  }
};

describe('ConfirmationPageTest', () => {
  it('showsServerPoints: displays pointsEarned directly from server order object', () => {
    renderWithProviders(
      <Routes>
        <Route path="/checkout/confirmation" element={<ConfirmationPage />} />
      </Routes>,
      {
        initialEntries: [
          {
            pathname: '/checkout/confirmation',
            state: { order: mockConfirmedOrder, success: true }
          }
        ]
      }
    );

    expect(screen.getByText(/Order Placed Successfully!/i)).toBeInTheDocument();
    expect(screen.getByText(/Midnight in Malgudi/i)).toBeInTheDocument();
    expect(screen.getByText(/49 Gift Points/i)).toBeInTheDocument();
    expect(screen.getByText('20 Nov 2026')).toBeInTheDocument();
  });

  const renderConfirmation = (order) =>
    renderWithProviders(
      <Routes>
        <Route path="/checkout/confirmation" element={<ConfirmationPage />} />
        <Route path="/library" element={<div>Library Page Target</div>} />
      </Routes>,
      {
        initialEntries: [{ pathname: '/checkout/confirmation', state: { order, success: true } }]
      }
    );

  it('ebookOrderShowsViewBook: an order of only eBooks links to the E-Library instead of orders', () => {
    renderConfirmation({
      ...mockConfirmedOrder,
      items: [{ ...mockConfirmedOrder.items[0], format: 'EBOOK' }]
    });

    fireEvent.click(screen.getByRole('button', { name: 'View Book' }));

    expect(screen.queryByRole('button', { name: /View My Orders/i })).not.toBeInTheDocument();
    expect(screen.getByText('Library Page Target')).toBeInTheDocument();
  });

  it('physicalOrderKeepsViewOrders: an order with a paperback still shows View My Orders', () => {
    renderConfirmation({
      ...mockConfirmedOrder,
      items: [mockConfirmedOrder.items[0], { ...mockConfirmedOrder.items[0], bookId: 'book-2', format: 'EBOOK' }]
    });

    expect(screen.getByRole('button', { name: 'View My Orders' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'View Book' })).not.toBeInTheDocument();
  });

  it('failedPaymentRetry: displays failed payment state and Retry action', () => {
    renderWithProviders(
      <Routes>
        <Route path="/checkout/confirmation" element={<ConfirmationPage />} />
        <Route path="/checkout" element={<div>Checkout Page Target</div>} />
      </Routes>,
      {
        initialEntries: [
          {
            pathname: '/checkout/confirmation',
            state: { failed: true, failureMessage: 'Card was declined by bank.' }
          }
        ]
      }
    );

    expect(screen.getByText(/Payment Failed/i)).toBeInTheDocument();
    expect(screen.getByText(/Card was declined by bank/i)).toBeInTheDocument();
    expect(screen.getByText(/stock and redeemed points have been restored/i)).toBeInTheDocument();

    const retryBtn = screen.getByRole('button', { name: /Retry Payment/i });
    expect(retryBtn).toBeInTheDocument();
    fireEvent.click(retryBtn);

    expect(screen.getByText('Checkout Page Target')).toBeInTheDocument();
  });

  it('backDoesNotResubmit: navigates to fallback when opened without state', () => {
    renderWithProviders(
      <Routes>
        <Route path="/checkout/confirmation" element={<ConfirmationPage />} />
      </Routes>,
      {
        initialEntries: ['/checkout/confirmation']
      }
    );

    expect(screen.getByText(/No Recent Order/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Continue Shopping/i })).toBeInTheDocument();
  });
});
