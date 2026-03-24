import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import Button from '../components/Button';
import { ThemedView, ThemedCard, ThemedText, ThemedTextInput } from '../components/ThemedComponents';
import BrandLogo from '../components/BrandLogo';
import { resendVerificationEmail } from '../lib/supabase';

export default function VerifyEmail() {
  const { Colors } = useTheme();
  const [searchParams] = useSearchParams();
  const initialEmail = useMemo(() => searchParams.get('email') || '', [searchParams]);

  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const validateEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  const handleResend = async () => {
    setMessage('');
    if (!validateEmail(email)) {
      setMessage('Enter a valid email address.');
      return;
    }

    setLoading(true);
    const { error } = await resendVerificationEmail(email);
    if (error) {
      setMessage(error || 'Failed to resend verification email.');
    } else {
      setMessage('Verification email sent. Please check your inbox and spam folder.');
    }
    setLoading(false);
  };

  return (
    <ThemedView style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '520px' }}>
        <ThemedCard>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
            <BrandLogo width={120} height={32} />
          </div>
          <ThemedText title style={{ fontSize: '24px', fontWeight: '700', marginBottom: '10px', textAlign: 'center', display: 'block' }}>
            Verify Your Email
          </ThemedText>
          <ThemedText style={{ fontSize: '14px', opacity: 0.7, textAlign: 'center', display: 'block', marginBottom: '16px' }}>
            Your verification link may have expired. Enter your email and we’ll send a new one.
          </ThemedText>

          {message && (
            <div
              style={{
                textAlign: 'center',
                marginBottom: '12px',
                color: message.toLowerCase().includes('sent') ? '#22c55e' : Colors.warning,
                fontSize: '14px',
                padding: '10px',
                borderRadius: '8px',
                backgroundColor:
                  message.toLowerCase().includes('sent')
                    ? '#22c55e20'
                    : Colors.warning + '20',
              }}
            >
              {message}
            </div>
          )}

          <ThemedTextInput
            placeholder="Email"
            type="email"
            value={email}
            onChange={setEmail}
          />

          <Button
            variant="primary"
            size="md"
            disabled={loading || !validateEmail(email)}
            loading={loading}
            onClick={handleResend}
            style={{ width: '100%', marginBottom: '16px' }}
          >
            {loading ? 'Sending...' : 'Resend Verification Email'}
          </Button>

          <div style={{ textAlign: 'center', fontSize: '14px' }}>
            <span style={{ opacity: 0.7 }}>Already verified?</span>{' '}
            <Link to="/login" style={{ color: Colors.primary, textDecoration: 'none', fontWeight: 600 }}>
              Log in
            </Link>
          </div>
        </ThemedCard>
      </div>
    </ThemedView>
  );
}
