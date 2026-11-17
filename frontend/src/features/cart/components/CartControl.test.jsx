import React from 'react';
import { screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { renderWithProviders } from '../../../test/renderWithProviders.jsx';
import { CartControl } from './CartControl.jsx';

describe('CartControl', () => {
  const book = {
    id: 'book-1',
    title: 'The Guide',
    format: 'PAPERBACK',
    inStock: true,
    stockQuantity: 5
  };

  it('renders Add to Cart button when quantity is 0', () => {
    renderWithProviders(<CartControl book={book} />);
    expect(screen.getByRole('button', { name: /add the guide to cart/i })).toBeInTheDocument();
  });

  it('renders Out of Stock when book is out of stock', () => {
    const outOfStockBook = { ...book, inStock: false, stockQuantity: 0 };
    renderWithProviders(<CartControl book={outOfStockBook} />);
    expect(screen.getByText('Out of Stock')).toBeInTheDocument();
  });
});
