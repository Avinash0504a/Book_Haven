import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import React from 'react';
import { renderWithProviders } from '../../../test/renderWithProviders.jsx';
import ReviewList from './ReviewList';

describe('ReviewListTest', () => {
  it('showsAverageAndReviews: renders average rating and reviews list', async () => {
    renderWithProviders(<ReviewList bookId="book-1" averageRating={4.8} reviewCount={1} />);

    expect(await screen.findByText('Customer Reviews')).toBeInTheDocument();
    expect(screen.getByText('4.8 out of 5')).toBeInTheDocument();
    expect(await screen.findByText('Alice Reader')).toBeInTheDocument();
    expect(screen.getByText('A truly magnificent story that stands the test of time.')).toBeInTheDocument();
  });
});
