import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import { ThemedView, ThemedCard, ThemedText, ThemedTextInput } from '../components/ThemedComponents';
import { friendlyMessage } from '../lib/notify';
import BrandLogo from '../components/BrandLogo';
import { isAdminRole } from '../lib/adminAccess';

const GoogleIcon = ({ size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    aria-hidden="true"
    focusable="false"
  >
    <path fill="#EA4335" d="M24 9.5c3.2 0 6.1 1.1 8.3 3.1l6.2-6.2C34.8 2.9 29.7 1 24 1 14.6 1 6.6 6.6 2.7 14.7l7.3 5.7C12 14 17.6 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-2.7-.4-3.9H24v7.4h12.7c-.6 3.3-2.5 6.1-5.5 7.9l6.6 5.1c3.9-3.6 6.2-8.9 6.2-16.5z" />
    <path fill="#FBBC05" d="M9.9 28.4c-1-2.9-1-6 0-8.9l-7.3-5.7C.9 17.7 0 20.8 0 24s.9 6.3 2.6 9.2l7.3-5.7z" />
    <path fill="#34A853" d="M24 47c5.7 0 10.5-1.9 14-5.2l-6.6-5.1c-1.8 1.2-4.1 1.9-7.4 1.9-6.4 0-12-4.3-14-10.4l-7.3 5.7C6.6 41.4 14.6 47 24 47z" />
  </svg>
);

export default function Login() {
  const navigate = useNavigate();
  const { theme, Colors } = useTheme();
  const { login, loginWithGoogle } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverMessage, setServerMessage] = useState('');

  const validateEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  const clearError = (key) => {
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!validateEmail(email)) {
      newErrors.email = 'Enter a valid email address.';
    }

    if (!password) {
      newErrors.password = 'Password is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setServerMessage('');

    try {
      const { user, profile, error } = await login(email, password);

      console.log('Login response:', { user, profile, error });

      if (error) {
        console.log('Login error:', error);
        setServerMessage(error || 'Login failed. Try again.');
        setLoading(false);
      } else if (!user) {
        console.log('No user returned');
        setServerMessage('Login failed. Check your credentials.');
        setLoading(false);
      } else {
        console.log('Login successful, user:', user);
        console.log('Profile role:', profile?.role);
        setServerMessage('Login successful! Redirecting...');
        setErrors({});

        // Reset form
        setEmail('');
        setPassword('');

        // Navigate to appropriate dashboard based on profile role
        const dashboardRoute = isAdminRole(profile?.role)
          ? '/admin'
          : profile?.role === 'runner'
            ? '/runner/home'
            : '/client/home';
        console.log('Navigating to:', dashboardRoute);
        navigate(dashboardRoute);
      }
    } catch (err) {
      console.error('Login exception:', err);
      setServerMessage(friendlyMessage('login', err));
      setLoading(false);
    }
  };

  const isFormValid = validateEmail(email) && password.length > 0;

  const handleGoogleLogin = async () => {
    setOauthLoading(true);
    setServerMessage('');
    try {
      const { error } = await loginWithGoogle();
      if (error) {
        setServerMessage(friendlyMessage('login', error));
      }
    } finally {
      setOauthLoading(false);
    }
  };

  return (
    <ThemedView style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '500px' }}>
        <ThemedCard>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
            <BrandLogo width={120} height={32} />
          </div>
          {/* Title */}
          <ThemedText title style={{ fontSize: '28px', fontWeight: '700', marginBottom: '20px', textAlign: 'center', display: 'block' }}>
            Welcome Back
          </ThemedText>

          {/* Server Message */}
          {serverMessage && (
            <div
              style={{
                textAlign: 'center',
                marginBottom: '12px',
                color: serverMessage.includes('success') ? '#22c55e' : Colors.warning,
                fontSize: '14px',
                padding: '10px',
                borderRadius: '8px',
                backgroundColor:
                  serverMessage.includes('success')
                    ? '#22c55e20'
                    : Colors.warning + '20',
              }}
            >
              {serverMessage}
            </div>
          )}

          <form onSubmit={handleLogin}>
            {/* Email */}
            <ThemedTextInput
              placeholder="Email"
              type="email"
              value={email}
              onChange={(v) => {
                setEmail(v);
                clearError('email');
              }}
              error={errors.email}
            />

            {/* Password */}
            <ThemedTextInput
              placeholder="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(v) => {
                setPassword(v);
                clearError('password');
              }}
              error={errors.password}
              icon={showPassword ? <FiEyeOff /> : <FiEye />}
              iconOnClick={() => setShowPassword(!showPassword)}
            />

            {/* Forgot Password Link */}
            <div style={{ textAlign: 'right', marginBottom: '20px' }}>
              <Link
                to="/forgot-password"
                style={{
                  color: Colors.primary,
                  fontSize: '14px',
                  textDecoration: 'none',
                  fontWeight: '500',
                }}
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <Button
              variant="primary"
              size="md"
              disabled={loading || !isFormValid}
              loading={loading}
              onClick={handleLogin}
              style={{
                width: '100%',
                marginBottom: '20px',
              }}
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: theme.uiBackground }} />
            <span style={{ fontSize: '12px', opacity: 0.6 }}>or</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: theme.uiBackground }} />
          </div>

          <Button
            variant="secondary"
            size="md"
            onClick={handleGoogleLogin}
            disabled={oauthLoading}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
            }}
          >
            <GoogleIcon />
            {oauthLoading ? 'Connecting...' : 'Continue with Google'}
          </Button>

          {/* Signup Link */}
          <p style={{ textAlign: 'center', color: theme.iconColor, fontSize: '14px', margin: 0 }}>
            Don't have an account?{' '}
            <Link
              to="/signup"
              style={{
                color: Colors.primary,
                fontWeight: '600',
                textDecoration: 'none',
              }}
            >
              Sign up
            </Link>
          </p>
        </ThemedCard>
      </div>
    </ThemedView>
  );
}
