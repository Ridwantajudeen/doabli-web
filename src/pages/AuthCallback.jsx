import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, exchangeAuthCode } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { ThemedView, ThemedCard, ThemedText } from '../components/ThemedComponents';
import { isAdminRole } from '../lib/adminAccess';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { loadProfile, isProfileComplete } = useAuth();
  const [message, setMessage] = useState('Finishing sign-in...');

  useEffect(() => {
    const run = async () => {
      const params = new URLSearchParams(window.location.search);
      const type = params.get('type');
      const code = params.get('code');

      if (type === 'recovery') {
        navigate(`/reset-password${window.location.search}${window.location.hash}`, { replace: true });
        return;
      }

      if (code) {
        const { error } = await exchangeAuthCode(code);
        if (error) {
          setMessage(error);
          return;
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;

      if (!user) {
        navigate('/login', { replace: true });
        return;
      }

      const fetchedProfile = await loadProfile(user.id, user.email);
      if (!fetchedProfile || !isProfileComplete(fetchedProfile)) {
        navigate('/complete-profile', { replace: true });
        return;
      }

      const provider = user.app_metadata?.provider;

      if (type === 'signup' && provider === 'email') {
        navigate('/email-confirmed', { replace: true });
        return;
      }

      const dashboardRoute = isAdminRole(fetchedProfile.role)
        ? '/admin'
        : fetchedProfile.role === 'runner'
          ? '/runner/home'
          : '/client/home';
      navigate(dashboardRoute, { replace: true });
    };

    run();
  }, [isProfileComplete, loadProfile, navigate]);

  return (
    <ThemedView style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <ThemedCard style={{ maxWidth: '520px', width: '100%', textAlign: 'center' }}>
        <ThemedText title style={{ fontSize: '22px', fontWeight: '700', marginBottom: '10px', display: 'block' }}>
          Hold on
        </ThemedText>
        <ThemedText style={{ fontSize: '14px', opacity: 0.7, display: 'block' }}>
          {message}
        </ThemedText>
      </ThemedCard>
    </ThemedView>
  );
}
