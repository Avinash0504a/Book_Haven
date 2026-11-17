import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { renderWithProviders } from './renderWithProviders.jsx';
import { App } from '../App.jsx';

describe('NoForbiddenControlsTest', () => {
  it('noPromoField: confirms no promo code or coupon discount input exists anywhere', () => {
    const { container } = renderWithProviders(<App />, { initialEntries: ['/'] });
    const inputs = Array.from(container.querySelectorAll('input'));
    const promoInputs = inputs.filter((input) => {
      const placeholder = input.getAttribute('placeholder') || '';
      const name = input.getAttribute('name') || '';
      return /promo|coupon|discount/i.test(placeholder) || /promo|coupon|discount/i.test(name);
    });
    expect(promoInputs).toHaveLength(0);
  });

  it('noPromoOnPayment: confirms no promo code or voucher inputs on checkout page', () => {
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
    const { container } = renderWithProviders(<App />, {
      initialEntries: ['/checkout'],
      auth: mockAuth
    });
    const inputs = Array.from(container.querySelectorAll('input'));
    const promoInputs = inputs.filter((input) => {
      const placeholder = input.getAttribute('placeholder') || '';
      const name = input.getAttribute('name') || '';
      return /promo|coupon|discount|voucher/i.test(placeholder) || /promo|coupon|discount|voucher/i.test(name);
    });
    expect(promoInputs).toHaveLength(0);
  });

  it('noPromoOrLanguageControlOnTier2: no promo, coupon, voucher or language control on any Tier 2 page', async () => {
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
    const routes = ['/wishlist', '/library', '/writers', '/writers/r-k-narayan', '/wallet', '/gift-points', '/profile', '/help'];

    for (const route of routes) {
      const { container, unmount } = renderWithProviders(<App />, { initialEntries: [route], auth: mockAuth });
      await waitFor(() => {
        const main = container.querySelector('main');
        expect(main).not.toBeNull();
        expect(main.querySelector('[role="status"], .animate-spin')).toBeNull();
      });
      const forbidden = Array.from(container.querySelectorAll('input, select')).filter((el) => {
        const text = `${el.getAttribute('placeholder') || ''} ${el.getAttribute('name') || ''} ${el.getAttribute('aria-label') || ''}`;
        return /promo|coupon|voucher|language/i.test(text);
      });
      expect(forbidden, `forbidden control on ${route}`).toHaveLength(0);
      unmount();
    }
  });

  it('noLanguagePicker: confirms no UI language translation picker control exists', () => {
    renderWithProviders(<App />, { initialEntries: ['/'] });
    // Verify there is no interface language selector (e.g., "Change Site Language" or "Select Interface Language")
    expect(screen.queryByLabelText(/select site language/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/change language/i)).not.toBeInTheDocument();
  });
});
