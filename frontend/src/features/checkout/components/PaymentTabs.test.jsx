import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { renderWithProviders } from '../../../test/renderWithProviders.jsx';
import { PaymentTabs } from './PaymentTabs.jsx';
import { PointsRedeem } from './PointsRedeem.jsx';

describe('PaymentTabsTest', () => {
  it('walletTabOnlyBookHavenWallet: shows only Book Haven Wallet and its balance', () => {
    renderWithProviders(
      <PaymentTabs
        payableAmount="300.00"
        walletBalance="500.00"
        hasDigital={false}
        onSubmit={vi.fn()}
      />
    );

    const walletTab = screen.getByRole('tab', { name: /Book Haven Wallet/i });
    expect(walletTab).toBeInTheDocument();
    fireEvent.click(walletTab);

    expect(screen.getByText(/Book Haven Wallet Balance:/i)).toBeInTheDocument();
    expect(screen.getByText('₹500.00')).toBeInTheDocument();
    expect(screen.getByText(/Your wallet balance is sufficient for this order/i)).toBeInTheDocument();
  });

  it('insufficientWalletMessage: shows insufficient balance message when balance < payable', () => {
    renderWithProviders(
      <PaymentTabs
        payableAmount="500.00"
        walletBalance="100.00"
        hasDigital={false}
        onSubmit={vi.fn()}
      />
    );

    const walletTab = screen.getByRole('tab', { name: /Book Haven Wallet/i });
    fireEvent.click(walletTab);

    expect(screen.getByText(/Insufficient wallet balance/i)).toBeInTheDocument();
    const payBtn = screen.getByRole('button', { name: /Pay ₹500.00/i });
    expect(payBtn).toBeDisabled();
  });

  it('codDisabledForDigital: disables COD when hasDigital is true', () => {
    renderWithProviders(
      <PaymentTabs
        payableAmount="300.00"
        walletBalance="500.00"
        hasDigital={true}
        onSubmit={vi.fn()}
      />
    );

    const codTab = screen.getByRole('tab', { name: /Cash on Delivery/i });
    expect(codTab).toBeDisabled();
  });

  it('invalidCardBlocksSubmit: blocks submission and shows errors when card fields are invalid', () => {
    const handleSubmit = vi.fn();
    renderWithProviders(
      <PaymentTabs
        payableAmount="300.00"
        walletBalance="500.00"
        hasDigital={false}
        onSubmit={handleSubmit}
      />
    );

    const cardTab = screen.getByRole('tab', { name: /Credit Card/i });
    fireEvent.click(cardTab);

    const payBtn = screen.getByRole('button', { name: /Pay ₹300.00/i });
    fireEvent.click(payBtn);

    expect(handleSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/Card number is required/i)).toBeInTheDocument();
  });

  it('invalidUpiBlocksSubmit: blocks submit on malformed UPI ID', () => {
    const handleSubmit = vi.fn();
    renderWithProviders(
      <PaymentTabs
        payableAmount="300.00"
        walletBalance="500.00"
        hasDigital={false}
        onSubmit={handleSubmit}
      />
    );

    const upiTab = screen.getByRole('tab', { name: /UPI/i });
    fireEvent.click(upiTab);

    const upiInput = screen.getByLabelText(/UPI ID/i);
    fireEvent.change(upiInput, { target: { value: 'bad-upi-format' } });

    const payBtn = screen.getByRole('button', { name: /Pay ₹300.00/i });
    fireEvent.click(payBtn);

    expect(handleSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/Invalid UPI ID format/i)).toBeInTheDocument();
  });

  it('noBankBlocksSubmit: blocks submit on unselected bank', () => {
    const handleSubmit = vi.fn();
    renderWithProviders(
      <PaymentTabs
        payableAmount="300.00"
        walletBalance="500.00"
        hasDigital={false}
        onSubmit={handleSubmit}
      />
    );

    const netBankingTab = screen.getByRole('tab', { name: /Net Banking/i });
    fireEvent.click(netBankingTab);

    const payBtn = screen.getByRole('button', { name: /Pay ₹300.00/i });
    fireEvent.click(payBtn);

    expect(handleSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/Bank code is required/i)).toBeInTheDocument();
  });
});

describe('PointsRedeemTest', () => {
  it('pointsOverBalanceRefused: refuses points higher than available balance', () => {
    const handleApply = vi.fn();
    renderWithProviders(
      <PointsRedeem
        availablePoints={50}
        appliedPoints={0}
        discountAmount="0.00"
        onApply={handleApply}
        onRemove={vi.fn()}
      />
    );

    const input = screen.getByLabelText(/Gift points to redeem/i);
    fireEvent.change(input, { target: { value: '100' } });

    const applyBtn = screen.getByRole('button', { name: /Apply/i });
    fireEvent.click(applyBtn);

    expect(handleApply).not.toHaveBeenCalled();
    expect(screen.getByText(/You only have 50 gift points available/i)).toBeInTheDocument();
  });
});
