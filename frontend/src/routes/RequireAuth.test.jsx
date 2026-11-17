import React from 'react';
import { screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Routes, Route } from 'react-router-dom';
import { renderWithProviders } from '../test/renderWithProviders.jsx';
import { RequireAuth } from './RequireAuth.jsx';

describe('RequireAuth', () => {
  it('redirects unauthenticated user to login route', () => {
    renderWithProviders(
      <Routes>
        <Route
          path="/protected"
          element={
            <RequireAuth>
              <div>Protected Content</div>
            </RequireAuth>
          }
        />
        <Route path="/login" element={<div>Login Page Target</div>} />
      </Routes>,
      { initialEntries: ['/protected'] }
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    expect(screen.getByText('Login Page Target')).toBeInTheDocument();
  });
});
