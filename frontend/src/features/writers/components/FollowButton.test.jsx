import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import React from 'react';
import { renderWithProviders } from '../../../test/renderWithProviders.jsx';
import FollowButton from './FollowButton';

describe('FollowButton', () => {
  it('renders Follow when following is false, and Unfollow when true', () => {
    const { rerender } = renderWithProviders(<FollowButton slug="r-k-narayan" following={false} />);
    expect(screen.getByRole('button', { name: 'Follow' })).toBeInTheDocument();

    rerender(<FollowButton slug="r-k-narayan" following={true} />);
    expect(screen.getByRole('button', { name: 'Unfollow' })).toBeInTheDocument();
  });
});
