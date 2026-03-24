import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from '../lib/supabase';
import Button from '../components/Button';
import { ThemedView, ThemedCard, ThemedText, ThemedTextInput } from '../components/ThemedComponents';
import BrandLogo from '../components/BrandLogo';
import { isAdminRole } from '../lib/adminAccess';

const roles = [
  { label: 'Client', value: 'client', description: 'I need errands done' },
  { label: 'Runner', value: 'runner', description: 'I want to run errands' },
];

export default function CompleteProfile() {
  const navigate = useNavigate();
  const { theme, Colors } = useTheme();
  const { user, profile, loadProfile, isProfileComplete } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('client');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [serverMessage, setServerMessage] = useState('');

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
      setPhone(profile.phone_number || '');
      setRole(profile.role || 'client');
    }
  }, [profile]);

  useEffect(() => {
    if (profile && isProfileComplete(profile)) {
      const dashboard = isAdminRole(profile.role)
        ? '/admin'
        : profile.role === 'runner'
          ? '/runner/home'
          : '/client/home';
      navigate(dashboard, { replace: true });
    }
  }, [profile, isProfileComplete, navigate]);

  const validatePhone = (val) => /^[0-9]{7,15}$/.test(val);

  const validateForm = () => {
    const nextErrors = {};
    if (!firstName.trim()) nextErrors.firstName = 'First name is required.';
    if (!lastName.trim()) nextErrors.lastName = 'Last name is required.';
    if (!validatePhone(phone)) nextErrors.phone = 'Enter a valid phone number.';
    if (!role) nextErrors.role = 'Select your role.';
    if (!acceptTerms) nextErrors.terms = 'You must agree to the policies to continue.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setServerMessage('');
    if (!user) return;
    if (!validateForm()) return;

    setSaving(true);
    try {
      const updates = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone_number: phone.trim(),
        role,
        email: profile?.email || user.email || null,
      };

      const { profile: updated, error } = await updateProfile(user.id, updates);
      if (error) {
        setServerMessage(error);
        return;
      }

      await loadProfile(user);
      const dashboard = isAdminRole(updated?.role)
        ? '/admin'
        : updated?.role === 'runner'
          ? '/runner/home'
          : '/client/home';
      navigate(dashboard, { replace: true });
    } finally {
      setSaving(false);
    }
  };

  const selectedRole = roles.find((r) => r.value === role);

  return (
    <ThemedView style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '520px' }}>
        <ThemedCard>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
            <BrandLogo width={120} height={32} />
          </div>
          <ThemedText title style={{ fontSize: '26px', fontWeight: '700', marginBottom: '10px', textAlign: 'center', display: 'block' }}>
            Complete Your Profile
          </ThemedText>
          <ThemedText style={{ fontSize: '14px', marginBottom: '18px', textAlign: 'center', display: 'block', opacity: 0.7 }}>
            We need a few more details to finish setting up your account.
          </ThemedText>

          {serverMessage && (
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
              {serverMessage}
            </div>
          )}

          <form onSubmit={handleSave}>
            <ThemedTextInput
              placeholder="First Name"
              value={firstName}
              onChange={(v) => setFirstName(v)}
              error={errors.firstName}
            />
            <ThemedTextInput
              placeholder="Last Name"
              value={lastName}
              onChange={(v) => setLastName(v)}
              error={errors.lastName}
            />
            <ThemedTextInput
              placeholder="Phone Number"
              type="tel"
              value={phone}
              onChange={(v) => setPhone(v)}
              error={errors.phone}
            />

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
                <ThemedCard onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px', width: '90%' }}>
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
                        backgroundColor: role === item.value ? Colors.primary + '20' : theme.background,
                        border: `1px solid ${role === item.value ? Colors.primary : theme.uiBackground}`,
                        borderRadius: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: '600', color: role === item.value ? Colors.primary : theme.title }}>
                          {item.label}
                        </div>
                        <div style={{ fontSize: '13px', color: theme.iconColor, marginTop: '4px' }}>
                          {item.description}
                        </div>
                      </div>
                      {role === item.value && (
                        <span style={{ fontSize: '20px', fontWeight: '700' }}>✓</span>
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

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => {
                    setAcceptTerms(e.target.checked);
                    if (errors.terms) {
                      setErrors((prev) => ({ ...prev, terms: null }));
                    }
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
              {errors.terms && (
                <ThemedText style={{ color: Colors.warning, fontSize: '13px', marginTop: '6px', display: 'block' }}>
                  {errors.terms}
                </ThemedText>
              )}
            </div>

            <Button
              variant="primary"
              size="md"
              disabled={saving}
              loading={saving}
              onClick={handleSave}
              style={{ width: '100%' }}
            >
              {saving ? 'Saving...' : 'Save & Continue'}
            </Button>
          </form>
        </ThemedCard>
      </div>
    </ThemedView>
  );
}
