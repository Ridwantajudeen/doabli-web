import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { ThemedView, ThemedCard, ThemedText } from '../components/ThemedComponents';

export default function EmailConfirmed() {
  const { Colors } = useTheme();

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
