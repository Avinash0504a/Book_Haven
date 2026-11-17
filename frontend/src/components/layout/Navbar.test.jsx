import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { renderWithProviders } from '../../test/renderWithProviders.jsx';
import { Navbar } from './Navbar.jsx';
import { App } from '../../App.jsx';

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

describe('Navbar', () => {
  it('noDeadLinks: every navbar and user menu entry opens a real page', async () => {
    const { unmount } = renderWithProviders(<Navbar />, { auth: mockAuth });
    fireEvent.click(screen.getByLabelText('User account menu'));
    const hrefs = [
      ...new Set(
        Array.from(document.querySelectorAll('a[href]')).map((a) => a.getAttribute('href'))
      )
    ];
    unmount();

    ['/orders', '/wishlist', '/library', '/writers', '/wallet', '/cart', '/profile', '/gift-points', '/help'].forEach(
      (expected) => expect(hrefs).toContain(expected)
    );

    for (const href of hrefs) {
      const { container, unmount: unmountApp } = renderWithProviders(<App />, {
        auth: mockAuth,
        initialEntries: [href]
      });
      await waitFor(() => {
        const main = container.querySelector('main');
        expect(main, `no layout for ${href}`).not.toBeNull();
        expect(main.children.length, `dead link ${href}`).toBeGreaterThan(0);
      });
      unmountApp();
    }
  });

  it('renders logo, search bar, and guest auth buttons', () => {
    renderWithProviders(<Navbar />);
    expect(screen.getByText('Book Haven')).toBeInTheDocument();
    expect(screen.getByText('Log In')).toBeInTheDocument();
    expect(screen.getByText('Register')).toBeInTheDocument();
  });

  it('renders delivery pincode and opens location modal', () => {
    renderWithProviders(<Navbar />);
    const deliverBtn = screen.getByLabelText(/deliver to pincode/i);
    expect(deliverBtn).toBeInTheDocument();
    fireEvent.click(deliverBtn);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Delivery Location')).toBeInTheDocument();
  });
});
