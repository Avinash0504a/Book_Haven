import { useState } from 'react';
import { useLibrary } from '../hooks/useLibrary';
import { libraryApi } from '../api/libraryApi';
import AudioPlayer from '../components/AudioPlayer';
import { Card } from '../../../components/ui/Card.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { Spinner } from '../../../components/ui/Spinner.jsx';
import { EmptyState } from '../../../components/ui/EmptyState.jsx';
import { ErrorState } from '../../../components/ui/ErrorState.jsx';
import { Link, useNavigate } from 'react-router-dom';

export default function LibraryPage() {
  const { data: items = [], isLoading, isError, refetch } = useLibrary();
  const [downloadingId, setDownloadingId] = useState(null);
  const [activeAudioBook, setActiveAudioBook] = useState(null);
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Spinner />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <ErrorState onRetry={refetch} />
      </div>
    );
  }

  const handleDownload = async (book) => {
    setDownloadingId(book.id);
    try {
      const blob = await libraryApi.downloadBook(book.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const ext = book.format === 'AUDIOBOOK' ? '.wav' : '.epub';
      a.download = `${book.slug || 'book'}${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Error handled
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-text">E-Library</h1>
        <p className="text-muted text-sm mt-1">
          Access and read your purchased eBooks and audiobooks anywhere, anytime.
        </p>
      </div>

      {activeAudioBook && (
        <AudioPlayer bookId={activeAudioBook.id} title={activeAudioBook.title} />
      )}

      {items.length === 0 ? (
        <EmptyState
          title="Your E-Library is empty"
          message="Explore our collection of digital eBooks and audiobooks to start building your personal library."
          actionLabel="Browse Digital Books"
          onAction={() => navigate('/?format=EBOOK')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((entry) => {
            const book = entry.book;
            const isAudio = book.format === 'AUDIOBOOK';

            return (
              <Card key={book.id} className="p-4 flex flex-col justify-between space-y-4">
                <div className="flex gap-4">
                  <div className="shrink-0 w-24 h-32 rounded overflow-hidden bg-bg">
                    <img
                      src={book.coverImageUrl || `/covers/${book.slug}.svg`}
                      alt={book.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 space-y-1">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase bg-primary/10 text-primary">
                      {book.format}
                    </span>
                    <h3 className="font-semibold text-text line-clamp-2 text-sm leading-snug">
                      {book.title}
                    </h3>
                    <p className="text-xs text-muted">
                      by {book.author?.name || 'Unknown Author'}
                    </p>
                    <p className="text-[11px] text-muted pt-1">
                      Purchased on{' '}
                      {new Date(entry.purchasedAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
                  {isAudio ? (
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => setActiveAudioBook(book)}
                    >
                      Play Audiobook
                    </Button>
                  ) : (
                    <Link to={`/library/${book.id}/read`}>
                      <Button type="button" variant="primary" size="sm">
                        Read Online
                      </Button>
                    </Link>
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(book)}
                    loading={downloadingId === book.id}
                  >
                    Download
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
