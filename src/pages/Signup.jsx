import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import { ThemedView, ThemedCard, ThemedText, ThemedTextInput } from '../components/ThemedComponents';
import { friendlyMessage } from '../lib/notify';
import BrandLogo from '../components/BrandLogo';
import {
  PRIVACY_POLICY_VERSION,
  TERMS_OF_SERVICE_VERSION,
  DATA_POLICY_VERSION,
} from '../constants/policies';
import { recordPolicyAcceptance } from '../lib/supabase';

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

const roles = [
  { label: 'Client', value: 'client', description: 'I need errands done' },
  { label: 'Runner', value: 'runner', description: 'I want to run errands' },
];

export default function Signup() {
  const navigate = useNavigate();
  const { theme, Colors } = useTheme();
  const { signup, loginWithGoogle } = useAuth();

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('client');
  const [policiesAccepted, setPoliciesAccepted] = useState(false);

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // Status
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverMessage, setServerMessage] = useState('');

  // Validators
  const validateEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  const validatePhone = (val) => /^[0-9]{7,15}$/.test(val);

  const evaluatePasswordStrength = (pass) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/\d/.test(pass)) score++;

    if (score === 3) return { label: 'Strong', color: '#22c55e' };
    if (score === 2) return { label: 'Medium', color: '#f59e0b' };
    if (score <= 1) return { label: 'Weak', color: '#ef4444' };
    return null;
  };

  const passwordStrength = evaluatePasswordStrength(password);

  const clearError = (key) => {
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!firstName.trim()) newErrors.firstName = 'First name is required.';
    if (!lastName.trim()) newErrors.lastName = 'Last name is required.';
    if (!validatePhone(phone)) newErrors.phone = 'Enter a valid phone number.';
    if (!validateEmail(email)) newErrors.email = 'Enter a valid email address.';

    if (!password) {
      newErrors.password = 'Password is required.';
    } else {
      const rule = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
      if (!rule.test(password)) {
        newErrors.password =
          'Password must be at least 8 characters, include 1 capital letter and 1 number.';
      }
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirm your password.';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    if (!policiesAccepted) {
      newErrors.policiesAccepted = 'You must agree to the policies to continue.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setServerMessage('');

    try {
      const { user, profile, error } = await signup(email, password, {
        firstName,
        lastName,
        phone,
        role,
      });

      if (error) {
        const normalized = String(error || '').toLowerCase();
        if (normalized.includes('already') && normalized.includes('register')) {
          setServerMessage('This email already exists. Please verify your email to continue.');
          navigate(`/verify-email?email=${encodeURIComponent(email)}`, { replace: true });
        } else {
          setServerMessage(friendlyMessage('signup', error));
        }
        console.error('Signup error:', error);
      } else if (!user) {
        setServerMessage('Signup failed. Please try again.');
      } else {
        const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : null;
        const policyResults = await Promise.all([
          recordPolicyAcceptance({
            userId: user.id,
            policyType: 'privacy',
            policyVersion: PRIVACY_POLICY_VERSION,
            userAgent,
          }),
          recordPolicyAcceptance({
            userId: user.id,
            policyType: 'terms',
            policyVersion: TERMS_OF_SERVICE_VERSION,
            userAgent,
          }),
          recordPolicyAcceptance({
            userId: user.id,
            policyType: 'data',
            policyVersion: DATA_POLICY_VERSION,
            userAgent,
          }),
        ]);

        const policyFailure = policyResults.find((r) => r?.error);
        if (policyFailure) {
          console.warn('Policy acceptance record failed:', policyFailure.error);
        }

        setServerMessage('Signup successful! We sent a verification link to your email. Open it to verify your account. Check your spam/junk if you do not see it.');
        setErrors({});

        // Reset form
        setFirstName('');
        setLastName('');
        setPhone('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setRole('client');
        setPoliciesAccepted(false);

        // Send user to verify email screen
        setTimeout(() => {
          navigate(`/verify-email?email=${encodeURIComponent(email)}`, { replace: true });
        }, 300);
      }
    } catch (err) {
      console.error('Signup exception:', err);
      setServerMessage(friendlyMessage('signup', err));
    } finally {
      setLoading(false);
    }
  };

  const isPasswordValid =
    passwordStrength?.label === 'Strong' &&
    password === confirmPassword &&
    password.length > 0;

  const isFormCompletable =
    firstName.trim() &&
    lastName.trim() &&
    validatePhone(phone) &&
    validateEmail(email) &&
    isPasswordValid &&
    policiesAccepted;

  const selectedRole = roles.find((r) => r.value === role);

  const handleGoogleSignup = async () => {
    setOauthLoading(true);
    setServerMessage('');
    try {
      const { error } = await loginWithGoogle();
      if (error) {
        setServerMessage(friendlyMessage('signup', error));
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
          <ThemedText title style={{ fontSize: '28px', fontWeight: '700', marginBottom: '12px', textAlign: 'center', display: 'block' }}>
            Create Account
          </ThemedText>
          <ThemedText style={{ fontSize: '14px', marginBottom: '20px', textAlign: 'center', display: 'block', opacity: 0.7 }}>
            We will email you a verification link. Open it to activate your account, and check spam/junk if it does not arrive.
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

          <form onSubmit={handleSignup}>
            {/* First Name */}
            <ThemedTextInput
              placeholder="First Name"
              value={firstName}
              onChange={(v) => {
                setFirstName(v);
                clearError('firstName');
              }}
              error={errors.firstName}
            />

            {/* Last Name */}
            <ThemedTextInput
              placeholder="Last Name"
              value={lastName}
              onChange={(v) => {
                setLastName(v);
                clearError('lastName');
              }}
              error={errors.lastName}
            />

            {/* Phone */}
            <ThemedTextInput
              placeholder="Phone Number"
              type="tel"
              value={phone}
              onChange={(v) => {
                setPhone(v);
                clearError('phone');
              }}
              error={errors.phone}
            />

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
                clearError('confirmPassword');
              }}
              error={errors.password}
              icon={showPassword ? <FiEyeOff /> : <FiEye />}
              iconOnClick={() => setShowPassword(!showPassword)}
            />

            {/* Password Strength */}
            {password.length > 0 && passwordStrength && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '12px',
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '6px',
                    borderRadius: '4px',
                    backgroundColor: passwordStrength.color,
                  }}
                />
                <span
                  style={{
                    fontSize: '13px',
                    color: passwordStrength.color,
                    fontWeight: '600',
                  }}
                >
                  {passwordStrength.label}
                </span>
              </div>
            )}

            {/* Confirm Password */}
            <ThemedTextInput
              placeholder="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(v) => {
                setConfirmPassword(v);
                clearError('confirmPassword');
              }}
              error={errors.confirmPassword}
              icon={showConfirmPassword ? <FiEyeOff /> : <FiEye />}
              iconOnClick={() => setShowConfirmPassword(!showConfirmPassword)}
            />

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={policiesAccepted}
                  onChange={(e) => {
                    setPoliciesAccepted(e.target.checked);
                    if (errors.policiesAccepted) clearError('policiesAccepted');
                  }}
                  style={{ marginTop: '4px' }}
                />
                <span style={{ fontSize: '13px', opacity: 0.8 }}>
                  I agree to the{' '}
                  <Link to="/terms" style={{ color: Colors.primary }}>
                    Terms of Service
                  </Link>
                  ,{' '}
                  <Link to="/privacy" style={{ color: Colors.primary }}>
                    Privacy Policy
                  </Link>
                  , and{' '}
                  <Link to="/data-policy" style={{ color: Colors.primary }}>
                    Data Policy
                  </Link>
                  .
                </span>
              </label>
              {errors.policiesAccepted && (
                <ThemedText style={{ color: Colors.warning, fontSize: '13px', marginTop: '6px', display: 'block' }}>
                  {errors.policiesAccepted}
                </ThemedText>
              )}
            </div>

            {/* Role Selection */}
            <label
              style={{
                display: 'block',
                marginBottom: '10px',
                fontSize: '14px',
                fontWeight: '500',
                color: theme.title,
              }}
            >
              Select Role
            </label>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              style={{
                width: '100%',
                padding: '16px',
                backgroundColor: theme.uiBackground,
                border: `1px solid ${theme.uiBackground}`,
                borderRadius: '12px',
                color: theme.text,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                marginBottom: '18px',
                fontSize: '14px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = theme.background;
                e.target.style.borderColor = Colors.primary;
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = theme.uiBackground;
                e.target.style.borderColor = theme.uiBackground;
              }}
            >
              <div>
                <div style={{ fontWeight: '600', color: theme.title }}>
                  {selectedRole?.label}
                </div>
                <div style={{ fontSize: '13px', color: theme.iconColor }}>
                  {selectedRole?.description}
                </div>
              </div>
              <span style={{ fontSize: '12px' }}>▼</span>
            </button>

            {/* Role Modal */}
            {modalOpen && (
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1000,
                }}
                onClick={() => setModalOpen(false)}
              >
                <ThemedCard
                  onClick={(e) => e.stopPropagation()}
                  style={{ maxWidth: '400px', width: '90%' }}
                >
                  <ThemedText title style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px', textAlign: 'center', display: 'block' }}>
                    Choose Your Role
                  </ThemedText>

                  {roles.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => {
                        setRole(item.value);
                        setModalOpen(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '16px',
                        marginBottom: '12px',
                        backgroundColor:
                          role === item.value
                            ? Colors.primary + '20'
                            : theme.background,
                        border: `1px solid ${
                          role === item.value ? Colors.primary : theme.uiBackground
                        }`,
                        borderRadius: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor =
                          role === item.value ? Colors.primary + '30' : theme.uiBackground;
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor =
                          role === item.value
                            ? Colors.primary + '20'
                            : theme.background;
                      }}
                    >
                      <div style={{ textAlign: 'left' }}>
                        <div
                          style={{
                            fontWeight: '600',
                            color:
                              role === item.value ? Colors.primary : theme.title,
                          }}
                        >
                          {item.label}
                        </div>
                        <div
                          style={{
                            fontSize: '13px',
                            color: theme.iconColor,
                            marginTop: '4px',
                          }}
                        >
                          {item.description}
                        </div>
                      </div>
                      {role === item.value && (
                        <span style={{ fontSize: '20px', fontWeight: '700' }}>
                          ✓
                        </span>
                      )}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    style={{
                      width: '100%',
                      marginTop: '8px',
                      padding: '14px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: theme.iconColor,
                      fontSize: '16px',
                      cursor: 'pointer',
                      borderRadius: '8px',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.color = theme.text;
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.color = theme.iconColor;
                    }}
                  >
                    Cancel
                  </button>
                </ThemedCard>
              </div>
            )}

            {/* Submit Button */}
            <Button
              variant="primary"
              size="md"
              disabled={loading || !isFormCompletable}
              loading={loading}
              onClick={handleSignup}
              style={{
                width: '100%',
                marginBottom: '20px',
              }}
            >
              {loading ? 'Signing up...' : 'Sign Up'}
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
            onClick={handleGoogleSignup}
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

          {/* Login Link */}
          <p style={{ textAlign: 'center', color: theme.iconColor, fontSize: '14px', margin: 0 }}>
            Already have an account?{' '}
            <Link
              to="/login"
              style={{
                color: Colors.primary,
                fontWeight: '600',
                textDecoration: 'none',
              }}
            >
              Login
            </Link>
          </p>
        </ThemedCard>
      </div>
    </ThemedView>
  );
}
