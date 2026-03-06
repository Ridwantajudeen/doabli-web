import React from 'react';
import { supabase } from '../lib/supabase';
import { FiUser, FiCheckCircle } from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext';

/**
 * Displays a user's avatar image with a small "verified" badge when
 * `kycVerified` is truthy.  The component will gracefully handle missing
 * avatars by rendering a placeholder icon.
 *
 * Props:
 *   - url: string|null  the stored avatar path or a full URL
 *   - size: number      diameter of the avatar in pixels (default 48)
 *   - kycVerified: bool whether to render the green verification badge
 *   - className/style: normal React props for extra styling
 */
export default function Avatar({ url, size = 48, kycVerified = false, className = '', style = {} }) {
  const { Colors } = useTheme();

  // determine a public URL if possible
  let publicUrl = null;
  if (url) {
    try {
      const str = String(url);
      if (str.startsWith('http') || str.startsWith('data:')) {
        publicUrl = str;
      } else {
        // try the new "profiles_avatars" bucket first (used for profile uploads)
        const { data } = supabase.storage.from('profiles_avatars').getPublicUrl(str);
        if (data && data.publicUrl) {
          publicUrl = data.publicUrl;
        }
        // fall back to legacy "avatars" bucket if we didn't get anything
        if (!publicUrl) {
          const { data: alt } = supabase.storage.from('avatars').getPublicUrl(str);
          if (alt && alt.publicUrl) {
            publicUrl = alt.publicUrl;
          }
        }
      }
    } catch (e) {
      console.warn('Avatar: failed to construct public url', e?.message || e);
    }
  }

  const avatarStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    objectFit: 'cover',
    display: 'block',
  };

  // badge dimensions/offset mimic runner profile style (28px on 100px avatar)
  const badgeSize = Math.round(size * 0.28);
  const badgeOffset = Math.round(size * 0.06);
  const checkSize = Math.round(badgeSize * 0.5);

  return (
    <div
      className={className}
      style={{ position: 'relative', width: size, height: size, overflow: 'hidden', ...style }}
    >
      {publicUrl ? (
        <img src={publicUrl} alt="avatar" style={avatarStyle} />
      ) : (
        <div
          style={{
            ...avatarStyle,
            backgroundColor: Colors.primary + '20',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <FiUser size={size * 0.6} color={Colors.primary} />
        </div>
      )}

      {kycVerified && (
        <div
          style={{
            position: 'absolute',
            bottom: badgeOffset,
            right: badgeOffset,
            width: badgeSize,
            height: badgeSize,
            borderRadius: '50%',
            backgroundColor: '#22c55e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
            pointerEvents: 'none',
          }}
        >
          <FiCheckCircle size={checkSize} color="#fff" />
        </div>
      )}
    </div>
  );
}
