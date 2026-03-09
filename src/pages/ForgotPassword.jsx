import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { requestPasswordReset } from '../lib/supabase';
import Button from '../components/Button';
import { ThemedView, ThemedCard, ThemedText, ThemedTextInput } from '../components/ThemedComponents';

export default function ForgotPassword() {
  const { theme, Colors } = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const validateEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!validateEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }

    setLoading(true);
    const { error: resetError } = await requestPasswordReset(email.trim());
    setLoading(false);

    if (resetError) {
      setError(resetError);
      return;
    }

    setMessage('Reset link sent. Check your email and open the link to set a new password.');
  };

  return (
    <ThemedView style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '520px' }}>
        <ThemedCard>
          <ThemedText title style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px', textAlign: 'center', display: 'block' }}>
            Forgot Password
          </ThemedText>
          <ThemedText style={{ fontSize: '15px', marginBottom: '22px', textAlign: 'center', display: 'block' }}>
            No worries, it happens. Drop your email and we will send a reset link.
          </ThemedText>

          {message && (
            <div
              style={{
                textAlign: 'center',
                marginBottom: '12px',
                color: '#22c55e',
                fontSize: '14px',
                padding: '10px',
                borderRadius: '8px',
                backgroundColor: '#22c55e20',
              }}
            >
              {message}
            </div>
          )}

          {error && (
            <div
              style={{
                textAlign: 'center',
                marginBottom: '12px',
                color: Colors.warning,
                fontSize: '14px',
                padding: '10px',
                borderRadius: '8px',
                backgroundColor: Colors.warning + '20',
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <ThemedTextInput
              placeholder="Email"
              type="email"
              value={email}
              onChange={(value) => {
                setEmail(value);
                setError('');
              }}
            />

            <Button
              variant="primary"
              size="md"
              disabled={loading || !validateEmail(email)}
              loading={loading}
              type="submit"
              style={{ width: '100%', marginTop: '8px', marginBottom: '16px' }}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </form>

          <p style={{ textAlign: 'center', color: theme.iconColor, fontSize: '14px', margin: 0 }}>
            Remembered your password?{' '}
            <Link to="/login" style={{ color: Colors.primary, fontWeight: '600', textDecoration: 'none' }}>
              Back to Login
            </Link>
          </p>
        </ThemedCard>
      </div>
    </ThemedView>
  );
}
