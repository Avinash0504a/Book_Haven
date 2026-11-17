import React from 'react';
import { screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { renderWithProviders } from '../../../test/renderWithProviders.jsx';
import { BookTile } from './BookTile.jsx';

describe('BookTile', () => {
  it('renders physical book with delivery date and discount', () => {
    const book = {
      id: 'book-1',
      title: 'The Guide',
      slug: 'the-guide',
      authorName: 'R. K. Narayan',
      format: 'PAPERBACK',
      language: 'English',
      price: '299.00',
      discountPercent: 10,
      unitPrice: '269.10',
      inStock: true,
      deliveryDate: '2026-11-17T15:00:00Z',
      coverImageUrl: '/covers/the-guide.svg'
    };

    renderWithProviders(<BookTile book={book} />);
    expect(screen.getByText('The Guide')).toBeInTheDocument();
    expect(screen.getByText(/R. K. Narayan/)).toBeInTheDocument();
    expect(screen.getByText('10% OFF')).toBeInTheDocument();
    expect(screen.getByTestId('delivery-date')).toBeInTheDocument();
  });

  it('renders digital ebook without delivery date', () => {
    const ebook = {
      id: 'book-2',
      title: 'Godan',
      slug: 'godan',
      authorName: 'Munshi Premchand',
      format: 'EBOOK',
      language: 'Hindi',
      price: '149.00',
      discountPercent: 0,
      unitPrice: '149.00',
      inStock: true,
      deliveryDate: null,
      coverImageUrl: '/covers/godan.svg'
    };

    renderWithProviders(<BookTile book={ebook} />);
    expect(screen.getByText('Godan')).toBeInTheDocument();
    expect(screen.queryByTestId('delivery-date')).not.toBeInTheDocument();
  });

  describe('row variant (home page)', () => {
    const book = {
      id: 'book-3',
      title: 'The Art of Focus',
      slug: 'the-art-of-focus',
      author: { name: 'Arjun Patel', slug: 'arjun-patel' },
      category: { id: 'cat-9', name: 'Self-help', slug: 'self-help' },
      description: 'Practical guide to mastering focus.',
      format: 'PAPERBACK',
      language: 'English',
      price: 399,
      discountPercent: 0,
      unitPrice: 399,
      inStock: true,
      deliveryDate: '2026-07-21',
      coverImageUrl: '/covers/the-art-of-focus.svg'
    };

    it('shows description, format, category link, whole-rupee price and short delivery date', () => {
      renderWithProviders(<BookTile book={book} variant="row" />);
      expect(screen.getByRole('heading', { name: 'The Art of Focus' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Arjun Patel' })).toHaveAttribute('href', '/writers/arjun-patel');
      expect(screen.getByTestId('tile-description')).toHaveTextContent('Practical guide to mastering focus.');
      expect(screen.getByText('Paperback')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Self-help' })).toHaveAttribute('href', '/?category=self-help');
      expect(screen.getByText('₹399')).toBeInTheDocument();
      expect(screen.getByTestId('delivery-date')).toHaveTextContent('Delivery by Tue, 21 Jul');
    });

    it('omits the delivery line for digital books', () => {
      renderWithProviders(<BookTile book={{ ...book, format: 'EBOOK', deliveryDate: null }} variant="row" />);
      expect(screen.getByText('E-Book')).toBeInTheDocument();
      expect(screen.queryByTestId('delivery-date')).not.toBeInTheDocument();
    });
  });
});
