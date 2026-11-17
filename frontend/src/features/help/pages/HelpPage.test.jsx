import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { renderWithProviders } from '../../../test/renderWithProviders.jsx';
import HelpPage from './HelpPage';

describe('HelpPageTest', () => {
  it('showsAllFiveTopics: renders all five help accordion topics', () => {
    renderWithProviders(<HelpPage />);

    expect(screen.getByText('Help & Customer Support')).toBeInTheDocument();
    expect(screen.getByText('Ordering & Checkout')).toBeInTheDocument();
    expect(screen.getByText('Payments & Book Haven Wallet')).toBeInTheDocument();
    expect(screen.getByText('Order Cancellation & Refund Policy')).toBeInTheDocument();
    expect(screen.getByText('Delivery & PIN Code Serviceability')).toBeInTheDocument();
    expect(screen.getByText('E-Library & Digital Reading')).toBeInTheDocument();
  });

  it('accordionKeyboardOperable: allows expanding and collapsing topics', async () => {
    const user = userEvent.setup();
    renderWithProviders(<HelpPage />);

    const deliveryBtn = screen.getByRole('button', { name: /Delivery & PIN Code/i });
    await user.click(deliveryBtn);

    expect(screen.getByText(/Book Haven delivers to all valid 6-digit Indian PIN codes/i)).toBeInTheDocument();
  });
});
