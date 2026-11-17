import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import React from 'react';
import { renderWithProviders } from '../../../test/renderWithProviders.jsx';
import { OrderCard } from '../components/OrderCard.jsx';

const mockCancellableOrder = {
  id: 'ord-cancellable',
  orderNumber: 'BH-100',
  status: 'CONFIRMED',
  cancellable: true,
  items: [{ bookId: 'b1', title: 'Novel', format: 'PAPERBACK', quantity: 1, price: '299.00' }]
};

const mockExpiredOrder = {
  id: 'ord-expired',
  orderNumber: 'BH-101',
  status: 'CONFIRMED',
  cancellable: false,
  items: [{ bookId: 'b1', title: 'Novel', format: 'PAPERBACK', quantity: 1, price: '299.00' }]
};

const mockDeliveredOrder = {
  id: 'ord-delivered',
  orderNumber: 'BH-102',
  status: 'DELIVERED',
  cancellable: false,
  items: [{ bookId: 'b1', title: 'Novel', format: 'PAPERBACK', quantity: 1, price: '299.00' }]
};

const mockDigitalOnlyOrder = {
  id: 'ord-digital',
  orderNumber: 'BH-103',
  status: 'CONFIRMED',
  cancellable: false,
  items: [{ bookId: 'b2', title: 'eBook', format: 'EBOOK', quantity: 1, price: '99.00' }]
};

describe('CancellationVisibilityTest', () => {
  it('hiddenAfter48HoursAndOnDeliveredCancelledDigital: cancel button is rendered only when cancellable is true', () => {
    // 1. Cancellable order: button visible
    const { unmount: unmount1 } = renderWithProviders(<OrderCard order={mockCancellableOrder} />);
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
    unmount1();

    // 2. Expired order (>48h): button hidden
    const { unmount: unmount2 } = renderWithProviders(<OrderCard order={mockExpiredOrder} />);
    expect(screen.queryByRole('button', { name: /Cancel/i })).not.toBeInTheDocument();
    unmount2();

    // 3. Delivered order: button hidden
    const { unmount: unmount3 } = renderWithProviders(<OrderCard order={mockDeliveredOrder} />);
    expect(screen.queryByRole('button', { name: /Cancel/i })).not.toBeInTheDocument();
    unmount3();

    // 4. Digital-only order: button hidden
    const { unmount: unmount4 } = renderWithProviders(<OrderCard order={mockDigitalOnlyOrder} />);
    expect(screen.queryByRole('button', { name: /Cancel/i })).not.toBeInTheDocument();
    unmount4();
  });
});
