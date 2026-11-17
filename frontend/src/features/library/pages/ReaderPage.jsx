import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useReaderContent } from '../hooks/useLibrary';
import { Button } from '../../../components/ui/Button.jsx';
import { Spinner } from '../../../components/ui/Spinner.jsx';
import { ErrorState } from '../../../components/ui/ErrorState.jsx';

const FONT_SIZES = {
  sm: 'text-sm leading-relaxed',
  md: 'text-base leading-relaxed',
  lg: 'text-lg leading-loose',
  xl: 'text-xl leading-loose'
};

const FONT_LABELS = {
  sm: 'Small text',
  md: 'Medium text',
  lg: 'Large text',
  xl: 'Larger text'
};

export default function ReaderPage() {
  const { bookId } = useParams();
  const { data: content, isLoading, isError, refetch } = useReaderContent(bookId);
  const [currentChapterIdx, setCurrentChapterIdx] = useState(0);
  const [fontSize, setFontSize] = useState('md');

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <Spinner />
        <p className="text-sm text-muted mt-3">Loading eBook content...</p>
      </div>
    );
  }

  if (isError || !content) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 space-y-4 text-center">
        <ErrorState
          title="Unable to Open Book"
          message="You may not have purchased this eBook or the content could not be loaded."
          onRetry={refetch}
        />
        <div>
          <Link to="/library" className="text-sm font-medium text-primary hover:underline">
            &larr; Return to E-Library
          </Link>
        </div>
      </div>
    );
  }

  const chapters = content.chapters || [];
  const currentChapter = chapters[currentChapterIdx] || { title: 'Chapter', text: '' };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <Link to="/library" className="text-xs text-muted hover:text-primary">
            &larr; Back to E-Library
          </Link>
          <h1 className="text-xl font-bold text-text mt-1">{content.title}</h1>
        </div>

        {/* Font Size & Chapter Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-bg p-1 rounded-lg border border-border">
            {['sm', 'md', 'lg', 'xl'].map((sz) => (
              <button
                key={sz}
                type="button"
                aria-label={FONT_LABELS[sz]}
                aria-pressed={fontSize === sz}
                onClick={() => setFontSize(sz)}
                className={`px-2 py-1 text-xs font-semibold rounded ${
                  fontSize === sz
                    ? 'bg-primary text-primary-fg'
                    : 'text-muted hover:text-text'
                }`}
              >
                {sz.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chapter Dropdown on Mobile */}
      <div className="flex items-center justify-between gap-4">
        <select
          value={currentChapterIdx}
          aria-label="Select chapter"
          onChange={(e) => setCurrentChapterIdx(Number(e.target.value))}
          className="px-3 py-1.5 text-sm rounded border border-border bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
        >
          {chapters.map((ch, idx) => (
            <option key={idx} value={idx}>
              {ch.title || `Chapter ${idx + 1}`}
            </option>
          ))}
        </select>

        <span className="text-xs text-muted">
          Chapter {currentChapterIdx + 1} of {chapters.length}
        </span>
      </div>

      {/* Reader Body */}
      <article className="p-8 md:p-12 rounded-2xl bg-surface border border-border shadow-sm min-h-[400px]">
        <h2 className="text-2xl font-bold text-text mb-6 pb-2 border-b border-border">
          {currentChapter.title}
        </h2>
        <div className={`text-text whitespace-pre-line ${FONT_SIZES[fontSize]}`}>
          {currentChapter.text}
        </div>
      </article>

      {/* Chapter Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <Button
          type="button"
          variant="outline"
          disabled={currentChapterIdx === 0}
          onClick={() => setCurrentChapterIdx((prev) => Math.max(0, prev - 1))}
        >
          &larr; Previous Chapter
        </Button>

        <Button
          type="button"
          variant="primary"
          disabled={currentChapterIdx === chapters.length - 1}
          onClick={() => setCurrentChapterIdx((prev) => Math.min(chapters.length - 1, prev + 1))}
        >
          Next Chapter &rarr;
        </Button>
      </div>
    </div>
  );
}
