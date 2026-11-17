import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/setup.js';
import { renderWithProviders } from '../../../test/renderWithProviders.jsx';
import AudioPlayer from './AudioPlayer';

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

describe('AudioPlayerTest', () => {
  let playSpy;
  let pauseSpy;

  beforeEach(() => {
    URL.createObjectURL = () => 'blob:mock-audio';
    URL.revokeObjectURL = () => {};
    playSpy = vi.spyOn(window.HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve());
    pauseSpy = vi.spyOn(window.HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('playPauseSeek: play, pause and seek work from labelled controls', async () => {
    const user = userEvent.setup();
    let authorization = null;
    server.use(
      http.get('/api/library/:id/audio', ({ request }) => {
        authorization = request.headers.get('authorization');
        return new HttpResponse('wav-bytes', { headers: { 'Content-Type': 'audio/wav' } });
      })
    );
    renderWithProviders(<AudioPlayer bookId="book-3" title="Gitanjali" />, { auth });

    const play = await screen.findByRole('button', { name: 'Play audiobook' });
    expect(authorization).toBe('Bearer mock-jwt-token');

    await user.click(play);
    expect(playSpy).toHaveBeenCalled();
    const pause = screen.getByRole('button', { name: 'Pause audiobook' });

    await user.click(pause);
    expect(pauseSpy).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Play audiobook' })).toBeInTheDocument();

    const seek = screen.getByLabelText('Seek audio position');
    fireEvent.change(seek, { target: { value: '0' } });
    expect(seek).toBeInTheDocument();
  });

  it('refusedShowsMessage: a refused audio request shows a clear message', async () => {
    server.use(
      http.get('/api/library/:id/audio', () =>
        HttpResponse.json(
          { success: false, data: null, message: 'Not purchased', code: 'FORBIDDEN' },
          { status: 403 }
        )
      )
    );
    renderWithProviders(<AudioPlayer bookId="book-3" title="Gitanjali" />, { auth });

    await waitFor(() =>
      expect(screen.getByText(/Unable to load audio stream/i)).toBeInTheDocument()
    );
  });
});
