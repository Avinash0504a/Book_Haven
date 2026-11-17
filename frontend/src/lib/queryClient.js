import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      retry: (failureCount, error) => {
        // Never retry 401, 403, 404, or 400 validation errors
        if (error?.status === 401 || error?.status === 403 || error?.status === 404 || error?.status === 400) {
          return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false
    }
  }
});
