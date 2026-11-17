import { useParams, Link } from 'react-router-dom';
import { useAuthor } from '../hooks/useWriters';
import { usePincode } from '../../../providers/PincodeProvider';
import FollowButton from '../components/FollowButton';
import { BookTile } from '../../catalog/components/BookTile';
import { Card } from '../../../components/ui/Card.jsx';
import { Spinner } from '../../../components/ui/Spinner.jsx';
import { ErrorState } from '../../../components/ui/ErrorState.jsx';

export default function AuthorPage() {
  const { slug } = useParams();
  const { pincode } = usePincode();
  const { data: author, isLoading, isError, refetch } = useAuthor(slug, pincode);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Spinner />
      </div>
    );
  }

  if (isError || !author) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-4 text-center">
        <ErrorState
          title="Writer Not Found"
          message="We could not find the writer you are looking for."
          onRetry={refetch}
        />
        <div>
          <Link to="/writers" className="text-sm font-medium text-primary hover:underline">
            &larr; Back to all writers
          </Link>
        </div>
      </div>
    );
  }

  const books = author.books || [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <div>
        <Link to="/writers" className="text-xs text-muted hover:text-primary">
          &larr; Back to Writers
        </Link>
      </div>

      <Card className="p-6 md:p-8 bg-surface border border-border">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-bg shrink-0 border-2 border-border shadow-md">
            {author.imageUrl ? (
              <img src={author.imageUrl} alt={author.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-extrabold text-primary text-3xl">
                {author.name?.charAt(0)}
              </div>
            )}
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-text">
                {author.name}
              </h1>
              <FollowButton slug={author.slug} following={Boolean(author.following)} />
            </div>

            {author.bio && (
              <p className="text-sm text-muted leading-relaxed pt-2">
                {author.bio}
              </p>
            )}
          </div>
        </div>
      </Card>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-text">
          Books by {author.name} ({books.length})
        </h2>

        {books.length === 0 ? (
          <p className="text-sm text-muted">No published titles available currently.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {books.map((book) => (
              <BookTile key={book.id} book={book} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
