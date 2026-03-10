import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext';
import { supabase, exchangeRecoveryCode, updateUserPassword } from '../lib/supabase';
import Button from '../components/Button';
import { ThemedView, ThemedCard, ThemedText, ThemedTextInput } from '../components/ThemedComponents';
import BrandLogo from '../components/BrandLogo';

export default function ResetPassword() {
  const { theme, Colors } = useTheme();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [sessionReady, setSessionReady] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const isPasswordValid = useMemo(() => password.length >= 8, [password]);
  const passwordsMatch = useMemo(() => password === confirmPassword, [password, confirmPassword]);

  useEffect(() => {
    let mounted = true;

    const prepareRecoverySession = async () => {
      setInitializing(true);
      setError('');
      setMessage('');

      try {
        const query = new URLSearchParams(window.location.search);
        const hash = new URLSearchParams(window.location.hash.replace('#', ''));

        const code = query.get('code');
        const hashAccessToken = hash.get('access_token');
        const hashRefreshToken = hash.get('refresh_token');

        if (code) {
          const { error: codeError } = await exchangeRecoveryCode(code);
          if (codeError) {
            throw new Error(codeError);
          }
        } else if (hashAccessToken && hashRefreshToken) {
          const { error: setSessionError } = await supabase.auth.setSession({
            access_token: hashAccessToken,
            refresh_token: hashRefreshToken,
          });

          if (setSessionError) {
            throw new Error(setSessionError.message);
          }

          window.history.replaceState({}, document.title, '/reset-password');
        }

        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !data.session) {
          throw new Error('Invalid or expired reset link. Request a new one.');
        }

        if (mounted) {
          setSessionReady(true);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || 'Could not validate reset link.');
          setSessionReady(false);
        }
      } finally {
        if (mounted) {
          setInitializing(false);
        }
      }
    };

    prepareRecoverySession();

    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!isPasswordValid) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const { error: updateError } = await updateUserPassword(password);
    setLoading(false);

    if (updateError) {
      setError(updateError);
      return;
    }

    await supabase.auth.signOut();
    setMessage('Password updated successfully. You can now login with your new password.');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <ThemedView style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '520px' }}>
        <ThemedCard>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
            <BrandLogo width={160} height={40} />
          </div>
          <ThemedText title style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px', textAlign: 'center', display: 'block' }}>
            Reset Password
          </ThemedText>
          <ThemedText style={{ fontSize: '15px', marginBottom: '22px', textAlign: 'center', display: 'block' }}>
            Set a new password and get back to running errands.
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

          {initializing ? (
            <ThemedText style={{ textAlign: 'center', display: 'block', marginBottom: '8px' }}>
              Validating reset link...
            </ThemedText>
          ) : (
            <form onSubmit={handleSubmit}>
              <ThemedTextInput
                placeholder="New password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(value) => {
                  setPassword(value);
                  setError('');
                }}
                icon={showPassword ? <FiEyeOff /> : <FiEye />}
                iconOnClick={() => setShowPassword((prev) => !prev)}
              />

              <ThemedTextInput
                placeholder="Confirm new password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(value) => {
                  setConfirmPassword(value);
                  setError('');
                }}
                icon={showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                iconOnClick={() => setShowConfirmPassword((prev) => !prev)}
              />

              <Button
                variant="primary"
                size="md"
                disabled={loading || !sessionReady || !isPasswordValid || !passwordsMatch}
                loading={loading}
                type="submit"
                style={{ width: '100%', marginTop: '8px', marginBottom: '16px' }}
              >
                {loading ? 'Updating...' : 'Update Password'}
              </Button>
            </form>
          )}

          <p style={{ textAlign: 'center', color: theme.iconColor, fontSize: '14px', margin: 0 }}>
            Back to{' '}
            <Link to="/login" style={{ color: Colors.primary, fontWeight: '600', textDecoration: 'none' }}>
              Login
            </Link>
          </p>
        </ThemedCard>
      </div>
    </ThemedView>
  );
}
