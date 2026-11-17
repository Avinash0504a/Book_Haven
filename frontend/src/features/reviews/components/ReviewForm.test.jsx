import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/setup.js';
import { renderWithProviders } from '../../../test/renderWithProviders.jsx';
import ReviewForm from './ReviewForm';

const auth = {
  token: 'mock-jwt-token',
  member: {
    id: '00000000-0000-0000-0000-000000000001',
    fullName: 'Demo Reader',
    email: 'reader@bookhaven.local',
    giftPoints: 120,
    walletBalance: '250.00'
  }
};

describe('ReviewFormTest', () => {
  it('renders rating picker and review body textarea with counter', () => {
    renderWithProviders(<ReviewForm bookId="book-1" />, { auth });

    expect(screen.getByText('Write a Customer Review')).toBeInTheDocument();
    expect(screen.getByLabelText(/Rate 5 stars/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Share your thoughts/i)).toBeInTheDocument();
    expect(screen.getByText('0/100')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit Review' })).toBeInTheDocument();
  });

  it('counterShowsWhileTyping: the counter follows the typed text', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ReviewForm bookId="book-1" />, { auth });

    await user.type(screen.getByPlaceholderText(/Share your thoughts/i), 'Lovely');

    expect(screen.getByText('6/100')).toBeInTheDocument();
  });

  it('over100Blocked: the textarea refuses more than 100 characters', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ReviewForm bookId="book-1" />, { auth });

    const box = screen.getByPlaceholderText(/Share your thoughts/i);
    await user.click(box);
    await user.paste('x'.repeat(150));

    expect(box.value.length).toBeLessThanOrEqual(100);
  });

  it('emptyBodyBlocked: an empty review is not sent', async () => {
    const user = userEvent.setup();
    let posted = false;
    server.use(
      http.post('/api/products/:id/reviews', () => {
        posted = true;
        return HttpResponse.json({ success: true, data: null, message: null, code: null });
      })
    );
    renderWithProviders(<ReviewForm bookId="book-1" />, { auth });

    await user.click(screen.getByLabelText(/Rate 4 stars/i));
    await user.click(screen.getByRole('button', { name: 'Submit Review' }));

    expect(await screen.findByText('Review body is required')).toBeInTheDocument();
    expect(posted).toBe(false);
  });

  it('ratingRequired: a review without a rating is blocked with a field message', async () => {
    const user = userEvent.setup();
    let posted = false;
    server.use(
      http.post('/api/products/:id/reviews', () => {
        posted = true;
        return HttpResponse.json({ success: true, data: null, message: null, code: null });
      })
    );
    renderWithProviders(<ReviewForm bookId="book-1" />, { auth });

    await user.type(screen.getByPlaceholderText(/Share your thoughts/i), 'Great read');
    await user.click(screen.getByRole('button', { name: 'Submit Review' }));

    expect(await screen.findByText('Rating is required')).toBeInTheDocument();
    expect(posted).toBe(false);
  });

  it('duplicateMessage: a second review shows the duplicate message', async () => {
    const user = userEvent.setup();
    server.use(
      http.post('/api/products/:id/reviews', () =>
        HttpResponse.json(
          { success: false, data: null, message: 'Member has already reviewed this book', code: 'DUPLICATE_REVIEW' },
          { status: 409 }
        )
      )
    );
    renderWithProviders(<ReviewForm bookId="book-1" />, { auth });

    await user.click(screen.getByLabelText(/Rate 3 stars/i));
    await user.type(screen.getByPlaceholderText(/Share your thoughts/i), 'Great read');
    await user.click(screen.getByRole('button', { name: 'Submit Review' }));

    expect(await screen.findByText('You have already reviewed this book.')).toBeInTheDocument();
  });

  it('submits rating and body then shows thanks', async () => {
    const user = userEvent.setup();
    let sent = null;
    server.use(
      http.post('/api/products/:id/reviews', async ({ request }) => {
        sent = await request.json();
        return HttpResponse.json({
          success: true,
          data: { id: 'rev-new', memberName: 'Demo Reader', rating: sent.rating, body: sent.body, createdAt: new Date().toISOString() },
          message: null,
          code: null
        });
      })
    );
    renderWithProviders(<ReviewForm bookId="book-1" />, { auth });

    await user.click(screen.getByLabelText(/Rate 4 stars/i));
    await user.type(screen.getByPlaceholderText(/Share your thoughts/i), 'Great read');
    await user.click(screen.getByRole('button', { name: 'Submit Review' }));

    await waitFor(() => expect(sent).toEqual({ rating: 4, body: 'Great read' }));
    expect(await screen.findByText('Thank you for submitting your review!')).toBeInTheDocument();
  });

  it('guest is asked to log in instead of seeing the form', () => {
    renderWithProviders(<ReviewForm bookId="book-1" />);

    expect(screen.queryByText('Write a Customer Review')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Log in to write a review/i })).toBeInTheDocument();
  });
});
