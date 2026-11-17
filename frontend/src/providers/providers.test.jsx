import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ThemeProvider, useTheme } from './ThemeProvider.jsx';
import { PincodeProvider, usePincode } from './PincodeProvider.jsx';
import { AuthProvider, useAuth } from './AuthProvider.jsx';

function ThemeConsumer() {
  const { theme, setTheme, isDark } = useTheme();
  return (
    <div>
      <span data-testid="theme-val">{theme}</span>
      <span data-testid="is-dark">{String(isDark)}</span>
      <button onClick={() => setTheme('dark')}>Set Dark</button>
      <button onClick={() => setTheme('light')}>Set Light</button>
    </div>
  );
}

function PincodeConsumer() {
  const { pincode, setPincode, error } = usePincode();
  return (
    <div>
      <span data-testid="pincode-val">{pincode}</span>
      {error && <span data-testid="pincode-err">{error}</span>}
      <button onClick={() => setPincode('560001')}>Set Valid</button>
      <button onClick={() => setPincode('123')}>Set Invalid</button>
    </div>
  );
}

function AuthConsumer() {
  const { member, isAuthenticated, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="auth-status">{isAuthenticated ? 'logged-in' : 'guest'}</span>
      <span data-testid="member-name">{member?.fullName || 'none'}</span>
      <button onClick={async () => { await login('mock-jwt-token', { id: 'm-1', fullName: 'Alice', email: 'alice@example.com' }); }}>
        Log In
      </button>
      <button onClick={async () => { await logout(); }}>Log Out</button>
    </div>
  );
}

describe('Providers', () => {
  it('ThemeProvider toggles theme and applies classes', () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme-val')).toHaveTextContent(/system|light|dark/);
    fireEvent.click(screen.getByText('Set Dark'));
    expect(screen.getByTestId('theme-val')).toHaveTextContent('dark');
    expect(screen.getByTestId('is-dark')).toHaveTextContent('true');
  });

  it('PincodeProvider validates 6-digit postal code and rejects invalid input', () => {
    render(
      <PincodeProvider>
        <PincodeConsumer />
      </PincodeProvider>
    );

    expect(screen.getByTestId('pincode-val')).toHaveTextContent('110001');
    fireEvent.click(screen.getByText('Set Valid'));
    expect(screen.getByTestId('pincode-val')).toHaveTextContent('560001');

    fireEvent.click(screen.getByText('Set Invalid'));
    expect(screen.getByTestId('pincode-err')).toHaveTextContent('valid 6-digit');
  });

  it('AuthProvider stores token in memory and handles login/logout', async () => {
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId('auth-status')).toHaveTextContent('guest');
    await act(async () => {
      fireEvent.click(screen.getByText('Log In'));
    });
    expect(screen.getByTestId('auth-status')).toHaveTextContent('logged-in');
    expect(screen.getByTestId('member-name')).toHaveTextContent('Alice');

    // Token is NOT in localStorage/sessionStorage
    expect(localStorage.getItem('token')).toBeNull();
    expect(sessionStorage.getItem('token')).toBeNull();

    await act(async () => {
      fireEvent.click(screen.getByText('Log Out'));
    });
    expect(screen.getByTestId('auth-status')).toHaveTextContent('guest');
  });

  it('refreshMember updates the wallet balance without setting a page-level loading flag', async () => {
    function Probe() {
      const { walletBalance, loading, refreshMember } = useAuth();
      return (
        <div>
          <span data-testid="wallet">{walletBalance}</span>
          <span data-testid="loading">{String(loading)}</span>
          <button onClick={() => refreshMember()}>Refresh</button>
        </div>
      );
    }
    render(
      <AuthProvider initialToken="mock-jwt-token" initialMember={{ id: 'm-1', fullName: 'Alice', walletBalance: '10.00' }}>
        <Probe />
      </AuthProvider>
    );
    expect(screen.getByTestId('wallet')).toHaveTextContent('10.00');

    await act(async () => {
      fireEvent.click(screen.getByText('Refresh'));
    });

    // The default test handler answers /auth/me with a 250.00 balance.
    await waitFor(() => expect(screen.getByTestId('wallet')).toHaveTextContent('250.00'));
    expect(screen.getByTestId('loading')).toHaveTextContent('false');
  });
});
