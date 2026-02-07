import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { ThemedLoader } from '../components/ThemedComponents';

export default function ProtectedRoute({ children, requiredRole }) {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to login if auth finished loading and no user
    if (!loading && !user) {
      navigate('/login', { replace: true });
      return;
    }

    // Check role restriction if requiredRole is specified
    if (!loading && user && profile && requiredRole) {
      if (profile.role !== requiredRole) {
        // Redirect to appropriate dashboard based on role
        const redirectPath = profile.role === 'runner' ? '/runner' : '/client';
        navigate(redirectPath, { replace: true });
      }
    }
  }, [loading, user, profile, requiredRole, navigate]);

  // Show loader while auth is still loading
  if (loading) {
    return <ThemedLoader />;
  }

  // Check if user has required role
  if (user && requiredRole && profile && profile.role !== requiredRole) {
    return null; // Redirect handled by useEffect
  }

  // Render children if user is authenticated and role matches
  if (user) {
    return children;
  }

  // If not loading and no user, return null (redirect handled by useEffect)
  return null;
}
