import React from 'react';
import { screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { renderWithProviders } from './renderWithProviders.jsx';
import { useAuth } from '../providers/AuthProvider.jsx';
import { usePincode } from '../providers/PincodeProvider.jsx';
import { useTheme } from '../providers/ThemeProvider.jsx';

function SampleConsumer() {
  const { isAuthenticated } = useAuth();
  const { pincode } = usePincode();
  const { theme } = useTheme();

  return (
    <div>
      <span>Auth: {isAuthenticated ? 'Yes' : 'No'}</span>
      <span>Pincode: {pincode}</span>
      <span>Theme: {theme}</span>
    </div>
  );
}

describe('renderWithProviders', () => {
  it('renders children with all providers configured', () => {
    renderWithProviders(<SampleConsumer />);
    expect(screen.getByText(/Auth: No/)).toBeInTheDocument();
    expect(screen.getByText(/Pincode: 110001/)).toBeInTheDocument();
  });
});
