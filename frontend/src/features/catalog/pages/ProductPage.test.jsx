import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Routes, Route } from 'react-router-dom';
import { renderWithProviders } from '../../../test/renderWithProviders.jsx';
import { ProductPage } from './ProductPage.jsx';

describe('ProductPage', () => {
  it('renders book details with price, delivery estimate, and description', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/products/:id" element={<ProductPage />} />
      </Routes>,
      { initialEntries: ['/products/book-1'] }
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'The Guide' })).toBeInTheDocument();
      expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
      expect(screen.getAllByText(/R. K. Narayan/)[0]).toBeInTheDocument();
      expect(screen.getByText(/Estimated Delivery:/i)).toBeInTheDocument();
      expect(screen.getByText('Overview & Description')).toBeInTheDocument();
    });
  });
});
