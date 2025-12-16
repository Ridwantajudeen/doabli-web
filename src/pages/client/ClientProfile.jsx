import { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { ThemedText, ThemedCard, ThemedTextInput } from '../../components/ThemedComponents';
import Button from '../../components/Button';
import { useNavigate } from 'react-router-dom';
import { FiEdit2, FiX, FiLogOut, FiCamera, FiUser } from 'react-icons/fi';

export default function ClientProfile() {
  const navigate = useNavigate();
  const { theme, Colors } = useTheme();
  const { user, profile, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Form fields
  const [address, setAddress] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setAddress(profile.address || '');
      setAvatarUrl(profile.avatar_url);
    }
  }, [profile]);

  // Save profile mutation
  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      setIsEditing(false);
      alert('Profile updated successfully');
    },
    onError: (err) => {
      alert('Error updating profile: ' + err.message);
    },
  });

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      setShowLogoutModal(false);
      navigate('/');
    } catch (err) {
      console.error('Logout error:', err);
      alert('Failed to log out');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);

      const fileName = `${user.id}-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('profiles_avatars')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('profiles_avatars')
        .getPublicUrl(fileName);

      setAvatarUrl(data.publicUrl);
      await saveMutation.mutateAsync({ avatar_url: data.publicUrl });
    } catch (err) {
      alert('Failed to upload image: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await saveMutation.mutateAsync({ address });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}
      >
        <ThemedText
          title
          style={{
            fontSize: '28px',
            fontWeight: 'bold',
            display: 'block',
          }}
        >
          My Profile
        </ThemedText>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setIsEditing(!isEditing)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '20px',
            }}
          >
            {isEditing ? <FiX /> : <FiEdit2 />}
          </button>
          <button
            onClick={() => setShowLogoutModal(true)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '20px',
            }}
          >
            <FiLogOut />
          </button>
        </div>
      </div>

      {/* Avatar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '24px',
          position: 'relative',
        }}
      >
        <div
          style={{
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            backgroundColor: Colors.primary + '20',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '48px',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Profile"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <FiUser size={48} color={Colors.primary} />
          )}
        </div>

        {isEditing && (
          <label
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              backgroundColor: Colors.primary,
              color: 'white',
              padding: '8px 12px',
              borderRadius: '20px',
              cursor: uploading ? 'not-allowed' : 'pointer',
              fontSize: '12px',
              fontWeight: '600',
              opacity: uploading ? 0.6 : 1,
            }}
          >
            <FiCamera />
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploading}
              style={{ display: 'none' }}
            />
          </label>
        )}
      </div>

      {/* Contact Information */}
      <ThemedCard style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '16px' }}>
          <ThemedText
            style={{
              fontSize: '12px',
              opacity: 0.6,
              display: 'block',
              marginBottom: '4px',
              fontWeight: '500',
            }}
          >
            Email
          </ThemedText>
          <ThemedText
            title
            style={{ fontSize: '16px', display: 'block', fontWeight: '600' }}
          >
            {user?.email}
          </ThemedText>
        </div>

        <div
          style={{
            height: '1px',
            backgroundColor: theme.uiBackground,
            margin: '16px 0',
          }}
        />

        {profile && (
          <>
            <div style={{ marginBottom: '16px' }}>
              <ThemedText
                style={{
                  fontSize: '12px',
                  opacity: 0.6,
                  display: 'block',
                  marginBottom: '4px',
                  fontWeight: '500',
                }}
              >
                Full Name
              </ThemedText>
              <ThemedText
                title
                style={{ fontSize: '16px', display: 'block', fontWeight: '600' }}
              >
                {profile.first_name} {profile.last_name}
              </ThemedText>
            </div>

            <div
              style={{
                height: '1px',
                backgroundColor: theme.uiBackground,
                margin: '16px 0',
              }}
            />

            <div style={{ marginBottom: '16px' }}>
              <ThemedText
                style={{
                  fontSize: '12px',
                  opacity: 0.6,
                  display: 'block',
                  marginBottom: '4px',
                  fontWeight: '500',
                }}
              >
                Phone
              </ThemedText>
              <ThemedText
                title
                style={{ fontSize: '16px', display: 'block', fontWeight: '600' }}
              >
                {profile.phone_number || 'Not provided'}
              </ThemedText>
            </div>

            <div
              style={{
                height: '1px',
                backgroundColor: theme.uiBackground,
                margin: '16px 0',
              }}
            />

            <div>
              <ThemedText
                style={{
                  fontSize: '12px',
                  opacity: 0.6,
                  display: 'block',
                  marginBottom: '4px',
                  fontWeight: '500',
                }}
              >
                Account Type
              </ThemedText>
              <ThemedText
                title
                style={{ fontSize: '16px', display: 'block', fontWeight: '600' }}
              >
                Client
              </ThemedText>
            </div>
          </>
        )}
      </ThemedCard>

      {/* Address - Editable */}
      <ThemedCard style={{ marginBottom: '20px' }}>
        <ThemedText
          title
          style={{
            fontSize: '16px',
            fontWeight: '600',
            marginBottom: '12px',
            display: 'block',
          }}
        >
          Address
        </ThemedText>
        {isEditing ? (
          <ThemedTextInput
            value={address}
            onChange={(v) => setAddress(v)}
            placeholder="Your address"
          />
        ) : (
          <ThemedText style={{ fontSize: '14px', display: 'block' }}>
            {address || 'Not provided'}
          </ThemedText>
        )}
      </ThemedCard>

      {/* Member Since */}
      {profile && (
        <ThemedCard style={{ marginBottom: '20px' }}>
          <ThemedText
            style={{
              fontSize: '12px',
              opacity: 0.6,
              display: 'block',
              marginBottom: '4px',
              fontWeight: '500',
            }}
          >
            Member Since
          </ThemedText>
          <ThemedText
            title
            style={{ fontSize: '16px', display: 'block', fontWeight: '600' }}
          >
            {new Date(profile.created_at).toLocaleDateString()}
          </ThemedText>
        </ThemedCard>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'grid', gap: '12px' }}>
        {isEditing && (
          <Button
            variant="primary"
            size="md"
            onClick={handleSaveProfile}
            disabled={saving || uploading}
            style={{ width: '100%' }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        )}

        <Button
          variant="primary"
          size="md"
          onClick={() => navigate('/client/home')}
          style={{ width: '100%' }}
        >
          Back to Home
        </Button>
      </div>

      {/* Logout Modal */}
      {showLogoutModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => !isLoggingOut && setShowLogoutModal(false)}
        >
          <ThemedCard
            style={{
              padding: '24px',
              maxWidth: '400px',
              width: '90%',
              borderRadius: '12px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <ThemedText
              title
              style={{
                fontSize: '20px',
                fontWeight: '700',
                marginBottom: '12px',
                display: 'block',
              }}
            >
              Log Out?
            </ThemedText>

            <ThemedText
              style={{
                fontSize: '14px',
                opacity: 0.7,
                marginBottom: '24px',
                display: 'block',
              }}
            >
              Are you sure you want to log out? You'll need to log in again to access your account.
            </ThemedText>

            <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: '1fr 1fr' }}>
              <Button
                variant="primary"
                size="md"
                onClick={() => setShowLogoutModal(false)}
                disabled={isLoggingOut}
                style={{ width: '100%' }}
              >
                Cancel
              </Button>
              <Button
                variant="warning"
                size="md"
                onClick={handleLogout}
                disabled={isLoggingOut}
                style={{ width: '100%', backgroundColor: Colors.warning }}
              >
                {isLoggingOut ? 'Logging out...' : 'Log Out'}
              </Button>
            </div>
          </ThemedCard>
        </div>
      )}
    </div>
  );
}
