import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, exchangeAuthCode } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { ThemedView, ThemedCard, ThemedText } from '../components/ThemedComponents';
import { isAdminRole } from '../lib/adminAccess';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { loadProfile, isProfileComplete, isEmailVerified } = useAuth();
  const [message, setMessage] = useState('Finishing sign-in...');
  const [showResend, setShowResend] = useState(false);

  useEffect(() => {
    const run = async () => {
      const searchParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace('#', ''));
      const type = searchParams.get('type') || hashParams.get('type');
      const code = searchParams.get('code') || hashParams.get('code');
      const tokenHash = searchParams.get('token_hash') || hashParams.get('token_hash');
      const errorDescription = hashParams.get('error_description') || searchParams.get('error_description');

      if (type === 'recovery') {
        navigate(`/reset-password${window.location.search}${window.location.hash}`, { replace: true });
        return;
      }

      if (errorDescription) {
        setMessage(errorDescription);
        setShowResend(true);
        return;
      }

      if (code) {
        const { error } = await exchangeAuthCode(code);
        if (error) {
          setMessage('This verification link is invalid or has expired. Please request a new one.');
          setShowResend(true);
          return;
        }
      } else if (tokenHash && type) {
        const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
        if (error) {
          setMessage('This verification link is invalid or has expired. Please request a new one.');
          setShowResend(true);
          return;
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;

      if (!user) {
        navigate('/login', { replace: true });
        return;
      }

      if (!isEmailVerified(user)) {
        navigate(`/verify-email?email=${encodeURIComponent(user.email || '')}`, { replace: true });
        return;
      }

      const fetchedProfile = await loadProfile(user);
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
  }, [isEmailVerified, isProfileComplete, loadProfile, navigate]);

  return (
    <ThemedView style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <ThemedCard style={{ maxWidth: '520px', width: '100%', textAlign: 'center' }}>
        <ThemedText title style={{ fontSize: '22px', fontWeight: '700', marginBottom: '10px', display: 'block' }}>
          Hold on
        </ThemedText>
        <ThemedText style={{ fontSize: '14px', opacity: 0.7, display: 'block' }}>
          {message}
        </ThemedText>
        {showResend && (
          <ThemedText style={{ fontSize: '14px', marginTop: '12px', display: 'block' }}>
            <a href="/verify-email" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>
              Resend verification email
            </a>
          </ThemedText>
        )}
      </ThemedCard>
    </ThemedView>
  );
}
