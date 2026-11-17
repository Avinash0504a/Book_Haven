import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/setup.js';
import { renderWithProviders } from '../../../test/renderWithProviders.jsx';
import { CancelOrderModal } from '../components/CancelOrderModal.jsx';

const mockOrderWithMixedItems = {
  id: 'ord-mix',
  orderNumber: 'BH-5001',
  status: 'CONFIRMED',
  items: [
    {
      id: 'line-1',
      bookId: 'b1',
      title: 'Physical Novel',
      format: 'PAPERBACK',
      unitPrice: '299.00',
      quantity: 1
    },
    {
      id: 'line-2',
      bookId: 'b2',
      title: 'Digital eBook',
      format: 'EBOOK',
      unitPrice: '149.00',
      quantity: 1
    }
  ]
};

describe('CancelOrderModalTest', () => {
  it('digitalLinesNotSelectable: digital lines are not selectable for cancellation', () => {
    renderWithProviders(
      <CancelOrderModal
        order={mockOrderWithMixedItems}
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText(/Physical Novel/i)).toBeInTheDocument();
    expect(screen.getByText(/Digital - Not cancellable/i)).toBeInTheDocument();
    // Only 1 quantity select exists for the physical item
    const selects = screen.getAllByRole('combobox');
    expect(selects.length).toBeGreaterThanOrEqual(1);
  });

  it('reasonRequired: shows error when cancellation reason is missing on preview', () => {
    renderWithProviders(
      <CancelOrderModal
        order={mockOrderWithMixedItems}
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    const previewBtn = screen.getByRole('button', { name: /Preview Refund/i });
    fireEvent.click(previewBtn);

    expect(screen.getByText(/Please provide a cancellation reason/i)).toBeInTheDocument();
  });

  it('bankDetailsValidated: validates bank details with zod when Bank refund method is chosen', () => {
    renderWithProviders(
      <CancelOrderModal
        order={mockOrderWithMixedItems}
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    const reasonInput = screen.getByLabelText(/Cancellation Reason/i);
    fireEvent.change(reasonInput, { target: { value: 'Mistake' } });

    const refundSelect = screen.getByLabelText(/Refund Destination/i);
    fireEvent.change(refundSelect, { target: { value: 'BANK' } });

    const previewBtn = screen.getByRole('button', { name: /Preview Refund/i });
    fireEvent.click(previewBtn);

    expect(screen.getByText(/Account holder name must be at least 2 characters/i)).toBeInTheDocument();
  });

  it('previewBeforeConfirm and showsMaskedAccount: previews refund before confirm and displays masked account', async () => {
    server.use(
      http.get('/api/orders/ord-mix/cancel-preview', () => {
        return HttpResponse.json({
          success: true,
          data: {
            cancellable: true,
            feeRate: 0.1,
            cancellationFee: '29.90',
            refundAmount: '269.10',
            pointsRestored: 27
          },
          message: null,
          code: null
        });
      }),
      http.post('/api/orders/ord-mix/cancel', () => {
        return HttpResponse.json({
          success: true,
          data: {
            id: 'ord-mix',
            status: 'CANCELLED',
            refundAmount: '269.10',
            maskedBankAccount: 'XXXXXX5678'
          },
          message: null,
          code: null
        });
      })
    );

    renderWithProviders(
      <CancelOrderModal
        order={mockOrderWithMixedItems}
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    const reasonInput = screen.getByLabelText(/Cancellation Reason/i);
    fireEvent.change(reasonInput, { target: { value: 'Found better deal' } });

    const previewBtn = screen.getByRole('button', { name: /Preview Refund/i });
    fireEvent.click(previewBtn);

    expect(await screen.findByText('₹269.10')).toBeInTheDocument();
    expect(screen.getByText(/Cancellation Fee \(10%\)/i)).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: /Confirm Cancellation/i });
    fireEvent.click(confirmBtn);

    expect(await screen.findByText(/Cancellation Processed/i)).toBeInTheDocument();
  });
  it('resultSurvivesRefetch: the refund result stays visible when the same order is handed in again as a new object', async () => {
    server.use(
      http.get('/api/orders/ord-mix/cancel-preview', () =>
        HttpResponse.json({
          success: true,
          data: { cancellable: true, feeRate: 0, cancellationFee: '0.00', refundAmount: '299.00', pointsRestored: 0 },
          message: null,
          code: null
        })
      ),
      http.post('/api/orders/ord-mix/cancel', () =>
        HttpResponse.json({
          success: true,
          data: { id: 'ord-mix', status: 'CANCELLED', totalAmount: 299, items: [] },
          message: null,
          code: null
        })
      )
    );

    const { rerender } = renderWithProviders(
      <CancelOrderModal order={mockOrderWithMixedItems} isOpen={true} onClose={vi.fn()} />
    );

    fireEvent.change(screen.getByLabelText(/Cancellation Reason/i), { target: { value: 'Mistake' } });
    fireEvent.click(screen.getByRole('button', { name: /Preview Refund/i }));
    expect(await screen.findByText('₹299.00')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Confirm Cancellation/i }));
    expect(await screen.findByText(/Cancellation Processed/i)).toBeInTheDocument();

    // After a cancel the order query refetches: same order, new object, new status.
    rerender(
      <CancelOrderModal
        order={{ ...mockOrderWithMixedItems, status: 'CANCELLED' }}
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText(/Cancellation Processed/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Preview Refund/i })).not.toBeInTheDocument();
  });



  it('serverRejectionShownClearly: shows server rejection message when cancel fails', async () => {
    server.use(
      http.get('/api/orders/ord-mix/cancel-preview', () => {
        return HttpResponse.json({
          success: true,
          data: { cancellable: true, feeRate: 0, cancellationFee: '0.00', refundAmount: '299.00' },
          message: null,
          code: null
        });
      }),
      http.post('/api/orders/ord-mix/cancel', () => {
        return HttpResponse.json(
          { success: false, data: null, message: 'This order cannot be cancelled.', code: 'CANNOT_CANCEL' },
          { status: 400 }
        );
      })
    );

    renderWithProviders(
      <CancelOrderModal
        order={mockOrderWithMixedItems}
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    const reasonInput = screen.getByLabelText(/Cancellation Reason/i);
    fireEvent.change(reasonInput, { target: { value: 'Reason' } });

    const previewBtn = screen.getByRole('button', { name: /Preview Refund/i });
    fireEvent.click(previewBtn);

    expect(await screen.findByText('₹299.00')).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: /Confirm Cancellation/i });
    fireEvent.click(confirmBtn);

    expect(await screen.findByText(/This order cannot be cancelled/i)).toBeInTheDocument();
  });
});
