import { useAuthors, useFollowing } from '../hooks/useWriters';
import { useAuth } from '../../auth/hooks/useAuth';
import FollowButton from '../components/FollowButton';
import { Card } from '../../../components/ui/Card.jsx';
import { Spinner } from '../../../components/ui/Spinner.jsx';
import { ErrorState } from '../../../components/ui/ErrorState.jsx';
import { Link } from 'react-router-dom';

export default function WritersPage() {
  const { isAuthenticated } = useAuth();
  const { data: authors = [], isLoading: loadingAuthors, isError: errorAuthors, refetch: refetchAuthors } = useAuthors();
  const { data: following = [], isLoading: loadingFollowing } = useFollowing();

  if (loadingAuthors || (isAuthenticated && loadingFollowing)) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Spinner />
      </div>
    );
  }

  if (errorAuthors) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <ErrorState onRetry={refetchAuthors} />
      </div>
    );
  }

  const followedSet = new Set(following.map((a) => a.slug));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-text">Featured Writers</h1>
        <p className="text-muted text-sm mt-1">
          Discover celebrated authors, explore their bibliography, and follow your favorites.
        </p>
      </div>

      {isAuthenticated && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-text">Writers You Follow</h2>
          {following.length === 0 ? (
            <Card className="p-6 text-center text-muted">
              <p className="text-sm">You are not following any writers yet.</p>
              <p className="text-xs text-muted mt-1">
                Follow writers below to see their new releases and curated recommendations.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {following.map((writer) => (
                <Card key={writer.id} className="p-4 flex items-center justify-between gap-4">
                  <Link to={`/writers/${writer.slug}`} className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-bg shrink-0">
                      {writer.imageUrl ? (
                        <img src={writer.imageUrl} alt={writer.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-primary">
                          {writer.name?.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-text hover:text-primary truncate">
                        {writer.name}
                      </p>
                    </div>
                  </Link>
                  <FollowButton slug={writer.slug} following={true} />
                </Card>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-text">Browse All Writers</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {authors.map((writer) => {
            const isFollowed = followedSet.has(writer.slug) || Boolean(writer.following);

            return (
              <Card key={writer.id} className="p-5 flex flex-col justify-between space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-bg shrink-0 border border-border">
                    {writer.imageUrl ? (
                      <img src={writer.imageUrl} alt={writer.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-primary text-xl">
                        {writer.name?.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/writers/${writer.slug}`}
                      className="font-bold text-base text-text hover:text-primary line-clamp-1"
                    >
                      {writer.name}
                    </Link>
                    {writer.bio && (
                      <p className="text-xs text-muted mt-1 line-clamp-2 leading-relaxed">
                        {writer.bio}
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-border flex items-center justify-between">
                  <Link
                    to={`/writers/${writer.slug}`}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    View Books & Bio &rarr;
                  </Link>
                  <FollowButton slug={writer.slug} following={isFollowed} />
                </div>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
