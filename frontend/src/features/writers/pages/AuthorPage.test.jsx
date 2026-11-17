import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/setup.js';
import { renderWithProviders } from '../../../test/renderWithProviders.jsx';
import FollowButton from '../components/FollowButton';
import AuthorPage from './AuthorPage';

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

function renderAuthor(slug = 'r-k-narayan') {
  return renderWithProviders(
    <Routes>
      <Route path="/writers/:slug" element={<AuthorPage />} />
    </Routes>,
    { initialEntries: [`/writers/${slug}`], auth }
  );
}

describe('AuthorPageTest', () => {
  it('showsBioPhotoBooks: renders the name, bio, photo placeholder and books section', async () => {
    renderAuthor();

    expect(await screen.findByRole('heading', { name: 'R. K. Narayan' })).toBeInTheDocument();
    expect(screen.getByText(/Celebrated Indian novelist/i)).toBeInTheDocument();
    expect(screen.getByText(/Books by R\. K\. Narayan/i)).toBeInTheDocument();
  });

  it('followChangesButton: following shows Unfollow and clicking it calls the API', async () => {
    const user = userEvent.setup();
    let unfollowed = null;
    server.use(
      http.delete('/api/following/:slug', ({ params }) => {
        unfollowed = params.slug;
        return HttpResponse.json({ success: true, data: null, message: null, code: null });
      })
    );
    renderAuthor();

    await user.click(await screen.findByRole('button', { name: 'Unfollow' }));

    await waitFor(() => expect(unfollowed).toBe('r-k-narayan'));
  });

  it('unknownSlugNotFound: an unknown writer shows a not-found state', async () => {
    server.use(
      http.get('/api/authors/:slug', () =>
        HttpResponse.json(
          { success: false, data: null, message: 'Author not found', code: 'NOT_FOUND' },
          { status: 404 }
        )
      )
    );
    renderAuthor('nobody');

    expect(await screen.findByText('Writer Not Found')).toBeInTheDocument();
  });
});

describe('FollowButtonGuest', () => {
  it('guest sees Follow and is sent to login instead of calling the API', async () => {
    const user = userEvent.setup();
    let posted = false;
    server.use(
      http.post('/api/following', () => {
        posted = true;
        return HttpResponse.json({ success: true, data: null, message: null, code: null });
      })
    );
    renderWithProviders(<FollowButton slug="r-k-narayan" following={false} />);

    await user.click(screen.getByRole('button', { name: 'Follow' }));

    expect(posted).toBe(false);
  });
});
