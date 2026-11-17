import React from 'react';
import { BookTile } from './BookTile.jsx';
import { EmptyState } from '../../../components/ui/EmptyState.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { BookOpen } from 'lucide-react';

export function BookGrid({
  books = [],
  loading = false,
  variant = 'card',
  emptyTitle = 'No books found',
  emptyDescription = 'Try adjusting your search or filters to find what you are looking for.',
  onClearFilters
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 sm:gap-6 animate-pulse">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-surface border border-border rounded-xl p-4 h-[340px] flex flex-col justify-between">
            <div className="aspect-[2/3] bg-border/40 rounded-lg w-full mb-3" />
            <div className="space-y-2">
              <div className="h-4 bg-border/40 rounded w-3/4" />
              <div className="h-3 bg-border/40 rounded w-1/2" />
              <div className="h-4 bg-border/40 rounded w-1/3 pt-2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!books || books.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title={emptyTitle}
        description={emptyDescription}
        action={
          onClearFilters && (
            <Button variant="outline" size="sm" onClick={onClearFilters}>
              Clear all filters
            </Button>
          )
        }
      />
    );
  }

  if (variant === 'row') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-8">
        {books.map((book) => (
          <BookTile key={book.id} book={book} variant="row" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 sm:gap-6">
      {books.map((book) => (
        <BookTile key={book.id} book={book} />
      ))}
    </div>
  );
}
