import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { ThemedView, ThemedCard, ThemedText } from '../components/ThemedComponents';
import BrandLogo from '../components/BrandLogo';
import { supabase, exchangeAuthCode } from '../lib/supabase';

export default function EmailConfirmed() {
  const { Colors } = useTheme();
  const [message, setMessage] = useState('Finalizing email confirmation...');
  const [showResend, setShowResend] = useState(false);

  useEffect(() => {
    const run = async () => {
      const search = new URLSearchParams(window.location.search);
      const hash = new URLSearchParams(window.location.hash.replace('#', ''));
      const type = search.get('type') || hash.get('type');
      const code = search.get('code') || hash.get('code');
      const tokenHash = search.get('token_hash') || hash.get('token_hash');
      const errorDescription = hash.get('error_description') || search.get('error_description');

      // If a password recovery link lands here, forward it to reset flow.
      if (type === 'recovery') {
        window.location.replace(`/reset-password${window.location.search}${window.location.hash}`);
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
          setMessage('This verification link is invalid or has expired.');
          setShowResend(true);
          return;
        }
      } else if (tokenHash && type) {
        const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
        if (error) {
          setMessage('This verification link is invalid or has expired.');
          setShowResend(true);
          return;
        }
      }

      setMessage('Thank you for confirming your email. You can now log in.');
    };

    run();
  }, []);

  return (
    <ThemedView
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div style={{ width: '100%', maxWidth: '560px' }}>
        <ThemedCard style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
            <BrandLogo width={130} height={34} />
          </div>
          <ThemedText
            title
            style={{
              fontSize: '30px',
              fontWeight: '700',
              marginBottom: '16px',
              display: 'block',
            }}
          >
            Email Verification
          </ThemedText>

          <ThemedText style={{ fontSize: '16px', marginBottom: '24px', display: 'block' }}>
            {message}
          </ThemedText>

          {showResend ? (
            <Link
              to="/verify-email"
              style={{
                display: 'inline-block',
                backgroundColor: Colors.primary,
                color: '#fff',
                textDecoration: 'none',
                fontWeight: '600',
                padding: '12px 22px',
                borderRadius: '10px',
              }}
            >
              Resend Verification Email
            </Link>
          ) : (
            <Link
              to="/login"
              style={{
                display: 'inline-block',
                backgroundColor: Colors.primary,
                color: '#fff',
                textDecoration: 'none',
                fontWeight: '600',
                padding: '12px 22px',
                borderRadius: '10px',
              }}
            >
              Go to Login
            </Link>
          )}
        </ThemedCard>
      </div>
    </ThemedView>
  );
}
