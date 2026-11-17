import React, { useState } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { useBooks, useCategories, useRecommendations, useBestsellers, useNewLaunches } from '../hooks/useCatalog.js';
import { useFilterParams } from '../hooks/useFilterParams.js';
import { BookGrid } from '../components/BookGrid.jsx';
import { BookTile } from '../components/BookTile.jsx';
import { Pagination } from '../../../components/ui/Pagination.jsx';

const FORMATS = [
  { value: 'PAPERBACK', label: 'Paperback' },
  { value: 'HARDCOVER', label: 'Hardcover' },
  { value: 'EBOOK', label: 'E-Book' },
  { value: 'AUDIOBOOK', label: 'Audiobook' }
];

const LANGUAGES = ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada'];

// Values are the price bands the API accepts.
const PRICE_RANGES = [
  { label: 'Under ₹300', value: 'under-300' },
  { label: '₹300 - ₹600', value: '300-600' },
  { label: '₹600 - ₹1,000', value: '600-1000' },
  { label: 'Over ₹1,000', value: 'above-1000' }
];

const SORT_OPTIONS = [
  { value: 'bestselling', label: 'Bestselling' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating_desc', label: 'Customer Rating' },
  { value: 'newest', label: 'Newest Arrivals' }
];

const ROW_GRID = 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-8';

/** A dropdown with a small label on top and a rule underneath, like the wireframe. */
function FilterSelect({ label, value, onChange, placeholder = 'All', children }) {
  return (
    <div className="relative min-w-0 bg-surface border-b border-muted/60 focus-within:border-primary focus-within:border-b-2">
      <label className="block truncate px-4 pt-2 text-xs text-muted" htmlFor={`filter-${label}`} title={label}>
        {label}
      </label>
      <select
        id={`filter-${label}`}
        value={value}
        onChange={onChange}
        className={`w-full appearance-none bg-transparent px-4 pb-2.5 pt-0.5 pr-10 text-sm focus:outline-none cursor-pointer ${
          value ? 'text-text' : 'text-muted'
        }`}
      >
        <option value="">{placeholder}</option>
        {children}
      </select>
      <ChevronDown
        className="w-4 h-4 text-text absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"
        aria-hidden="true"
      />
    </div>
  );
}

function BookRow({ headingId, title, books, onViewAll }) {
  if (!books || books.length === 0) return null;
  return (
    <section aria-labelledby={headingId} className="space-y-5">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id={headingId} className="text-lg text-text">
          {title}
        </h2>
        {onViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            className="text-xs text-primary underline underline-offset-2 cursor-pointer"
          >
            View all
          </button>
        )}
      </div>
      <div className={ROW_GRID}>
        {books.map((book) => (
          <BookTile key={book.id} book={book} variant="row" />
        ))}
      </div>
    </section>
  );
}

export function HomePage() {
  const { filters, hasActiveFilters, setFilter, setPage, clearFilters } = useFilterParams();
  const { data: categories = [], isError: isCategoriesError } = useCategories();

  const { data: booksData, isLoading: isBooksLoading, isError: isBooksError } = useBooks(filters);
  const { data: recommendations = [] } = useRecommendations();
  const { data: bestsellersData } = useBestsellers(3);
  const { data: newLaunchesData } = useNewLaunches(3);

  const bestsellers = bestsellersData?.items || [];
  const newLaunches = newLaunchesData?.items || [];
  const books = booksData?.items || [];
  const totalPages = booksData?.totalPages || 1;
  const currentPage = booksData?.page || 1;

  const [searchText, setSearchText] = useState(filters.search);

  const handleSearch = (e) => {
    e.preventDefault();
    setFilter('search', searchText.trim());
  };

  const categoryClass = (active) =>
    `block w-full text-left px-3 py-2 text-sm border-l-4 cursor-pointer transition-colors ${
      active
        ? 'border-primary bg-surface text-text font-medium'
        : 'border-transparent text-text hover:bg-surface'
    }`;

  return (
    <div className="lg:grid lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-8">
      {/* Category list: a side list on large screens, scrollable pills on small ones */}
      <nav aria-label="Book Categories" className="hidden lg:block">
        <ul className="sticky top-20 space-y-0.5">
          <li>
            <button type="button" onClick={() => setFilter('category', '')} className={categoryClass(!filters.category)}>
              All
            </button>
          </li>
          {categories.map((cat) => (
            <li key={cat.id}>
              <button
                type="button"
                onClick={() => setFilter('category', cat.slug)}
                className={categoryClass(filters.category === cat.slug)}
              >
                {cat.name}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <section aria-label="Book Categories (small screens)" className="lg:hidden overflow-x-auto pb-3 mb-4 scrollbar-none">
        <div className="flex items-center gap-2 min-w-max">
          {[{ id: '', slug: '', name: 'All' }, ...categories].map((cat) => (
            <button
              key={cat.id || 'all'}
              type="button"
              onClick={() => setFilter('category', cat.slug)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                (filters.category || '') === cat.slug
                  ? 'bg-primary text-primary-fg border-primary'
                  : 'bg-surface text-text border-border hover:bg-bg'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </section>

      <div className="min-w-0 space-y-10">
        {(isCategoriesError || isBooksError) && (
          <p role="alert" className="border border-danger text-danger px-4 py-3 text-sm">
            We could not load the books right now. Please check that the server is running and try again.
          </p>
        )}
        {/* Search and filter row */}
        <section aria-label="Search and filters" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(4,minmax(0,1fr))] gap-3">
          <form
            onSubmit={handleSearch}
            role="search"
            className="relative min-w-0 bg-surface border-b border-muted/60 focus-within:border-primary focus-within:border-b-2 sm:col-span-2 lg:col-span-1"
          >
            <label className="block truncate px-4 pt-2 text-xs text-muted" htmlFor="home-search">
              Search you want to read here
            </label>
            <input
              id="home-search"
              type="search"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search"
              className="w-full bg-transparent px-4 pb-2.5 pt-0.5 pr-10 text-sm text-text placeholder:text-muted focus:outline-none"
            />
            <button
              type="submit"
              aria-label="Search books"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text cursor-pointer"
            >
              <Search className="w-4 h-4" aria-hidden="true" />
            </button>
          </form>

          <FilterSelect label="Language" value={filters.language} onChange={(e) => setFilter('language', e.target.value)}>
            {LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect
            label="Format (Paperback, ebook etc)"
            value={filters.format}
            onChange={(e) => setFilter('format', e.target.value)}
          >
            {FORMATS.map((fmt) => (
              <option key={fmt.value} value={fmt.value}>
                {fmt.label}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect label="Price Range" value={filters.price} onChange={(e) => setFilter('price', e.target.value)}>
            {PRICE_RANGES.map((pr) => (
              <option key={pr.value} value={pr.value}>
                {pr.label}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect
            label="Sort by"
            value={filters.sort}
            onChange={(e) => setFilter('sort', e.target.value)}
            placeholder="Relevance"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </FilterSelect>
        </section>

        {/* No filters: the three curated rows */}
        {!hasActiveFilters && (
          <div className="space-y-10">
            <h1 className="sr-only">Book Haven</h1>
            <BookRow headingId="recommendations-heading" title="Recommended for You" books={recommendations.slice(0, 6)} />
            <BookRow
              headingId="bestsellers-heading"
              title="Bestsellers this Month"
              books={bestsellers}
              onViewAll={() => setFilter('sort', 'bestselling')}
            />
            <BookRow
              headingId="new-launches-heading"
              title="New Launches"
              books={newLaunches}
              onViewAll={() => setFilter('sort', 'newest')}
            />
          </div>
        )}

        {/* Any filter: paginated results */}
        {hasActiveFilters && (
          <section aria-label="Book Search Results" className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h1 className="text-lg text-text">
                {filters.search ? <>Results for &quot;{filters.search}&quot;</> : 'Books'}
                <span className="text-sm text-muted ml-2">
                  {books.length} {books.length === 1 ? 'book' : 'books'} shown
                </span>
              </h1>
              <button
                type="button"
                onClick={() => {
                  setSearchText('');
                  clearFilters();
                }}
                className="text-xs text-primary underline underline-offset-2 cursor-pointer"
              >
                Clear all filters
              </button>
            </div>

            <BookGrid
              books={books}
              loading={isBooksLoading}
              variant="row"
              onClearFilters={() => {
                setSearchText('');
                clearFilters();
              }}
            />

            <div className="pt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(p) => setPage(p - 1)}
              />
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
