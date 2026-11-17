import { useSearchParams } from 'react-router-dom';
import { useMemo, useCallback } from 'react';

export function useFilterParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo(() => {
    return {
      search: searchParams.get('search') || '',
      category: searchParams.get('category') || '',
      brandId: searchParams.get('brandId') || '',
      language: searchParams.get('language') || '',
      format: searchParams.get('format') || '',
      price: searchParams.get('price') || '',
      sort: searchParams.get('sort') || '',
      page: parseInt(searchParams.get('page') || '0', 10)
    };
  }, [searchParams]);

  const hasActiveFilters = useMemo(() => {
    return Boolean(
      filters.search ||
      filters.category ||
      filters.brandId ||
      filters.language ||
      filters.format ||
      filters.price ||
      filters.sort ||
      filters.page > 0
    );
  }, [filters]);

  const setFilter = useCallback(
    (key, value) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (value === '' || value === null || value === undefined) {
          next.delete(key);
        } else {
          next.set(key, String(value));
        }
        // Changing a filter resets page back to 0
        if (key !== 'page') {
          next.delete('page');
        }
        return next;
      });
    },
    [setSearchParams]
  );

  const setPage = useCallback(
    (pageNumber) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (pageNumber > 0) {
          next.set('page', String(pageNumber));
        } else {
          next.delete('page');
        }
        return next;
      });
    },
    [setSearchParams]
  );

  const clearFilters = useCallback(() => {
    setSearchParams(new URLSearchParams());
  }, [setSearchParams]);

  return {
    filters,
    hasActiveFilters,
    setFilter,
    setPage,
    clearFilters
  };
}
