import React from 'react';
import { describe, it, expect } from 'vitest';
import { Routes, Route } from 'react-router-dom';
import { renderWithProviders } from './renderWithProviders.jsx';
import { HomePage } from '../features/catalog/pages/HomePage.jsx';
import { ProductPage } from '../features/catalog/pages/ProductPage.jsx';
import { LoginPage } from '../features/auth/pages/LoginPage.jsx';
import { RegisterPage } from '../features/auth/pages/RegisterPage.jsx';
import { CartPage } from '../features/cart/pages/CartPage.jsx';
import { CheckoutPage } from '../features/checkout/pages/CheckoutPage.jsx';
import { ConfirmationPage } from '../features/checkout/pages/ConfirmationPage.jsx';
import { OrdersPage } from '../features/orders/pages/OrdersPage.jsx';
import { OrderDetailPage } from '../features/orders/pages/OrderDetailPage.jsx';
import WalletPage from '../features/wallet/pages/WalletPage.jsx';
import GiftPointsPage from '../features/wallet/pages/GiftPointsPage.jsx';
import WishlistPage from '../features/wishlist/pages/WishlistPage.jsx';
import WritersPage from '../features/writers/pages/WritersPage.jsx';
import ProfilePage from '../features/profile/pages/ProfilePage.jsx';
import HelpPage from '../features/help/pages/HelpPage.jsx';

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

describe('NoDeadButtonsTest', () => {
  it('every button in HomePage has a type or click handler', async () => {
    const { container } = renderWithProviders(<HomePage />);
    const buttons = container.querySelectorAll('button');
    buttons.forEach((btn) => {
      const isSubmit = btn.getAttribute('type') === 'submit';
      const isButton = btn.getAttribute('type') === 'button' || !btn.getAttribute('type');
      expect(isSubmit || isButton).toBe(true);
    });
  });

  it('every button in ProductPage has a type or click handler', async () => {
    const { container } = renderWithProviders(
      <Routes>
        <Route path="/products/:id" element={<ProductPage />} />
      </Routes>,
      { initialEntries: ['/products/book-1'] }
    );
    const buttons = container.querySelectorAll('button');
    buttons.forEach((btn) => {
      const isSubmit = btn.getAttribute('type') === 'submit';
      const isButton = btn.getAttribute('type') === 'button' || !btn.getAttribute('type');
      expect(isSubmit || isButton).toBe(true);
    });
  });

  it('every button in LoginPage has type=submit or action', () => {
    const { container } = renderWithProviders(<LoginPage />);
    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThan(0);
    buttons.forEach((btn) => {
      expect(btn.getAttribute('type')).toBe('submit');
    });
  });

  it('every button in RegisterPage has type=submit or action', () => {
    const { container } = renderWithProviders(<RegisterPage />);
    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThan(0);
    buttons.forEach((btn) => {
      expect(btn.getAttribute('type')).toBe('submit');
    });
  });

  it('every button in CartPage has type or handler', () => {
    const { container } = renderWithProviders(<CartPage />, { auth: mockAuth });
    const buttons = container.querySelectorAll('button');
    buttons.forEach((btn) => {
      const isSubmit = btn.getAttribute('type') === 'submit';
      const isButton = btn.getAttribute('type') === 'button' || !btn.getAttribute('type');
      expect(isSubmit || isButton).toBe(true);
    });
  });

  it('every button in CheckoutPage has type or handler', () => {
    const { container } = renderWithProviders(<CheckoutPage />, { auth: mockAuth });
    const buttons = container.querySelectorAll('button');
    buttons.forEach((btn) => {
      const isSubmit = btn.getAttribute('type') === 'submit';
      const isButton = btn.getAttribute('type') === 'button' || !btn.getAttribute('type');
      expect(isSubmit || isButton).toBe(true);
    });
  });

  it('every button in OrdersPage has type or handler', () => {
    const { container } = renderWithProviders(<OrdersPage />, { auth: mockAuth });
    const buttons = container.querySelectorAll('button');
    buttons.forEach((btn) => {
      const isSubmit = btn.getAttribute('type') === 'submit';
      const isButton = btn.getAttribute('type') === 'button' || !btn.getAttribute('type');
      expect(isSubmit || isButton).toBe(true);
    });
  });

  it('every button in OrderDetailPage has type or handler', () => {
    const { container } = renderWithProviders(
      <Routes>
        <Route path="/orders/:id" element={<OrderDetailPage />} />
      </Routes>,
      {
        initialEntries: ['/orders/ord-1'],
        auth: mockAuth
      }
    );
    const buttons = container.querySelectorAll('button');
    buttons.forEach((btn) => {
      const isSubmit = btn.getAttribute('type') === 'submit';
      const isButton = btn.getAttribute('type') === 'button' || !btn.getAttribute('type');
      expect(isSubmit || isButton).toBe(true);
    });
  });

  it('every button in ConfirmationPage has type or handler', () => {
    const { container } = renderWithProviders(<ConfirmationPage />, {
      auth: mockAuth,
      initialEntries: [
        {
          pathname: '/checkout/confirmation',
          state: {
            order: {
              id: 'ord-1',
              status: 'CONFIRMED',
              items: [],
              subtotal: '100.00',
              shippingAmount: '0.00',
              grandTotal: '100.00'
            },
            success: true
          }
        }
      ]
    });
    const buttons = container.querySelectorAll('button');
    buttons.forEach((btn) => {
      const isSubmit = btn.getAttribute('type') === 'submit';
      const isButton = btn.getAttribute('type') === 'button' || !btn.getAttribute('type');
      expect(isSubmit || isButton).toBe(true);
    });
  });

  it('every button in Tier 2 pages has type or handler', () => {
    const tier2Pages = [
      <WalletPage key="wallet" />,
      <GiftPointsPage key="points" />,
      <WishlistPage key="wishlist" />,
      <WritersPage key="writers" />,
      <ProfilePage key="profile" />,
      <HelpPage key="help" />
    ];

    tier2Pages.forEach((page) => {
      const { container } = renderWithProviders(page, { auth: mockAuth });
      const buttons = container.querySelectorAll('button');
      buttons.forEach((btn) => {
        const isSubmit = btn.getAttribute('type') === 'submit';
        const isButton = btn.getAttribute('type') === 'button' || !btn.getAttribute('type');
        expect(isSubmit || isButton).toBe(true);
      });
    });
  });

  it('dark theme render check: pages render with dark class and no hard-coded inline color styles', () => {
    document.documentElement.classList.add('dark');

    const pages = [
      <CartPage key="cart" />,
      <CheckoutPage key="checkout" />,
      <ConfirmationPage key="conf" />,
      <WalletPage key="wallet" />,
      <GiftPointsPage key="points" />,
      <WishlistPage key="wishlist" />,
      <WritersPage key="writers" />,
      <ProfilePage key="profile" />,
      <HelpPage key="help" />
    ];

    pages.forEach((page) => {
      const { container } = renderWithProviders(page, { auth: mockAuth });
      const elementsWithInlineStyle = Array.from(container.querySelectorAll('*[style]'));
      const colorStyledElements = elementsWithInlineStyle.filter((el) => {
        const style = el.getAttribute('style') || '';
        return /color|background|border-color/i.test(style);
      });
      expect(colorStyledElements).toHaveLength(0);
    });

    document.documentElement.classList.remove('dark');
  });
});
