import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button.jsx';

export function Pagination({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  className = ''
}) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Pagination Navigation" className={`flex items-center justify-center gap-2 ${className}`}>
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        aria-label="Previous Page"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Previous</span>
      </Button>

      <span className="text-sm text-muted px-2">
        Page <span className="font-semibold text-text">{currentPage}</span> of{' '}
        <span className="font-semibold text-text">{totalPages}</span>
      </span>

      <Button
        variant="outline"
        size="sm"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        aria-label="Next Page"
      >
        <span>Next</span>
        <ChevronRight className="w-4 h-4" />
      </Button>
    </nav>
  );
}
