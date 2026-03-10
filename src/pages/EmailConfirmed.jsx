import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { ThemedView, ThemedCard, ThemedText } from '../components/ThemedComponents';
import BrandLogo from '../components/BrandLogo';

export default function EmailConfirmed() {
  const { Colors } = useTheme();

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace('#', ''));
    const type = search.get('type') || hash.get('type');

    // If a password recovery link lands here, forward it to reset flow.
    if (type === 'recovery') {
      window.location.replace(`/reset-password${window.location.search}${window.location.hash}`);
    }
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
            <BrandLogo width={170} height={42} />
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
            Thank you for confirming your email.
          </ThemedText>

          <ThemedText style={{ fontSize: '16px', marginBottom: '24px', display: 'block' }}>
            You can now login to your account.
          </ThemedText>

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
        </ThemedCard>
      </div>
    </ThemedView>
  );
}
