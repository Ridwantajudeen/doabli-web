import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import { ThemedView, ThemedCard, ThemedText, ThemedTextInput } from '../components/ThemedComponents';
import { friendlyMessage } from '../lib/notify';

export default function Login() {
  const navigate = useNavigate();
  const { theme, Colors } = useTheme();
  const { login, user } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
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
        const dashboardRoute = profile?.role === 'runner' ? '/runner/home' : '/client/home';
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

  return (
    <ThemedView style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '500px' }}>
        <ThemedCard>
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