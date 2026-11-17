import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '../providers/ThemeProvider.jsx';
import { PincodeProvider } from '../providers/PincodeProvider.jsx';
import { AuthProvider } from '../providers/AuthProvider.jsx';

export function renderWithProviders(
  ui,
  {
    initialEntries = ['/'],
    queryClient,
    auth = null,
    ...renderOptions
  } = {}
) {
  const testQueryClient =
    queryClient ||
    new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: 0
        }
      }
    });

  function Wrapper({ children }) {
    return (
      <QueryClientProvider client={testQueryClient}>
        <ThemeProvider>
          <PincodeProvider>
            <AuthProvider initialToken={auth?.token} initialMember={auth?.member}>
              <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
            </AuthProvider>
          </PincodeProvider>
        </ThemeProvider>
      </QueryClientProvider>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient: testQueryClient
  };
}
