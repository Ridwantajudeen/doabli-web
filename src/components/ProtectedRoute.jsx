import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { ThemedLoader } from '../components/ThemedComponents';

export default function ProtectedRoute({ children, requiredRole, allowIncomplete = false }) {
  const { user, profile, loading, profileLoading, isProfileComplete } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Redirect to login if auth finished loading and no user
    if (!loading && !user) {
      navigate('/login', { replace: true });
      return;
    }

    if (!loading && !profileLoading && user && profile && !allowIncomplete) {
      if (!isProfileComplete(profile) && location.pathname !== '/complete-profile') {
        navigate('/complete-profile', { replace: true });
        return;
      }
    }

    // Check role restriction if requiredRole is specified
    if (!loading && user && profile && requiredRole) {
      if (profile.role !== requiredRole) {
        // Redirect to appropriate dashboard based on role
        const redirectPath = profile.role === 'runner' ? '/runner' : '/client';
        navigate(redirectPath, { replace: true });
      }
    }
  }, [loading, profileLoading, user, profile, requiredRole, allowIncomplete, isProfileComplete, location.pathname, navigate]);

  // Show loader only when we truly don't have a profile yet
  if (loading || (profileLoading && !profile)) {
    return <ThemedLoader />;
  }

  if (user && profile && !allowIncomplete && !isProfileComplete(profile)) {
    return null;
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
