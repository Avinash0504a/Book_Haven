import { useQuery } from '@tanstack/react-query';
import { libraryApi } from '../api/libraryApi';

export function useLibrary() {
  return useQuery({
    queryKey: ['library'],
    queryFn: libraryApi.listLibrary
  });
}

export function useReaderContent(bookId) {
  return useQuery({
    queryKey: ['library', 'content', bookId],
    queryFn: () => libraryApi.readContent(bookId),
    enabled: Boolean(bookId)
  });
}
