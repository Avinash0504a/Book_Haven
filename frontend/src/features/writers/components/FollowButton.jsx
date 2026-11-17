import { useAuth } from '../../auth/hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToggleFollow } from '../hooks/useWriters';
import { Button } from '../../../components/ui/Button.jsx';

export default function FollowButton({ slug, following = false, className = '' }) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toggleMutation = useToggleFollow();

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } });
      return;
    }

    toggleMutation.mutate({ slug, following });
  };

  return (
    <Button
      type="button"
      variant={following ? 'outline' : 'primary'}
      size="sm"
      onClick={handleClick}
      loading={toggleMutation.isPending}
      className={className}
    >
      {following ? 'Unfollow' : 'Follow'}
    </Button>
  );
}
