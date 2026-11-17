import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/setup.js';
import { renderWithProviders } from '../../../test/renderWithProviders.jsx';
import ReaderPage from './ReaderPage';

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

function renderReader() {
  return renderWithProviders(
    <Routes>
      <Route path="/library/:bookId/read" element={<ReaderPage />} />
    </Routes>,
    { initialEntries: ['/library/book-2/read'], auth }
  );
}

describe('ReaderPageTest', () => {
  it('showsChapters: renders chapter titles, body text, and navigation', async () => {
    renderReader();

    expect(await screen.findByRole('heading', { name: 'Godan' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Chapter 1: The Beginning' })).toBeInTheDocument();
    expect(screen.getByText(/opening of Godan/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Previous Chapter/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Next Chapter/i })).toBeInTheDocument();
  });

  it('refusedShowsMessage: a refused request shows a clear message', async () => {
    server.use(
      http.get('/api/library/:id/content', () =>
        HttpResponse.json(
          { success: false, data: null, message: 'Not purchased', code: 'FORBIDDEN' },
          { status: 403 }
        )
      )
    );
    renderReader();

    expect(await screen.findByText('Unable to Open Book')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Return to E-Library/i })).toBeInTheDocument();
  });

  it('chapterNavigation: Next moves to chapter two and Previous returns', async () => {
    const user = userEvent.setup();
    server.use(
      http.get('/api/library/:id/content', () =>
        HttpResponse.json({
          success: true,
          data: {
            title: 'Godan',
            chapters: [
              { title: 'One', text: 'first text' },
              { title: 'Two', text: 'second text' }
            ]
          },
          message: null,
          code: null
        })
      )
    );
    renderReader();

    await screen.findByRole('heading', { name: 'One' });
    await user.click(screen.getByRole('button', { name: /Next Chapter/i }));
    expect(screen.getByRole('heading', { name: 'Two' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Previous Chapter/i }));
    expect(screen.getByRole('heading', { name: 'One' })).toBeInTheDocument();
  });

  it('fontSizeControl: choosing a size changes the reading text class', async () => {
    const user = userEvent.setup();
    renderReader();

    await screen.findByRole('heading', { name: 'Godan' });
    await user.click(screen.getByRole('button', { name: 'Larger text' }));

    await waitFor(() => expect(screen.getByText(/opening of Godan/i).className).toMatch(/text-xl/));
  });
});
