import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { ThemedLoader } from '../components/ThemedComponents';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to login if auth finished loading and no user
    if (!loading && !user) {
      navigate('/login', { replace: true });
    }
  }, [loading, user, navigate]);

  // Show loader while auth is still loading
  if (loading) {
    return <ThemedLoader />;
  }

  // Render children if user is authenticated
  if (user) {
    return children;
  }

  // If not loading and no user, return null (redirect handled by useEffect)
  return null;
}
