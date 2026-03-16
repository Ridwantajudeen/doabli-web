//RunnerNotifications.jsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { ThemedText, ThemedCard } from '../../components/ThemedComponents';
import Button from '../../components/Button';
import { useNavigate } from 'react-router-dom';
import { FiMessageSquare, FiClipboard, FiCheck, FiX, FiAward, FiBell, FiAlertCircle } from 'react-icons/fi';

const notificationIconMap = {
  messages:         FiMessageSquare,
  applications:     FiClipboard,
  accepted:         FiCheck,
  rejected:         FiX,
  completed:        FiAward,
  dispute:          FiAlertCircle,
  dispute_resolved: FiCheck,
  default:          FiBell,
};

function NotificationIcon({ type, color }) {
  const Icon = notificationIconMap[type] || notificationIconMap.default;
  return <Icon size={22} color={color} />;
}

export default function RunnerNotifications() {
  const navigate = useNavigate();
  const { Colors } = useTheme();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const notificationQueryKey = useMemo(() => ['runner-notifications', user?.id], [user?.id]);

  const [defendingDispute, setDefendingDispute] = useState(null);
  const [defenseDetails, setDefenseDetails] = useState('');
  const [defenseImage, setDefenseImage] = useState(null);
  const [defenseImageBase64, setDefenseImageBase64] = useState(null);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: notificationQueryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        const { data: fallback } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('id', { ascending: false });
        return fallback || [];
      }
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchInterval: 15000,
  });

  // Real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`runner-notifications:${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        const inserted = payload.new;
        queryClient.setQueryData(notificationQueryKey, (old = []) => {
          if (old.some((n) => n.id === inserted.id)) return old;
          return [inserted, ...old];
        });
        queryClient.invalidateQueries({ queryKey: ['runner-unread-count', user.id] });
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        const updated = payload.new;
        queryClient.setQueryData(notificationQueryKey, (old = []) =>
          old.map((n) => (n.id === updated.id ? { ...n, ...updated } : n))
        );
        queryClient.invalidateQueries({ queryKey: ['runner-unread-count', user.id] });
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user?.id, queryClient, notificationQueryKey]);

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);
      if (error) throw error;
      return notificationId;
    },
    onSuccess: (notificationId) => {
      queryClient.setQueryData(notificationQueryKey, (old) =>
        old ? old.map((n) => n.id === notificationId ? { ...n, read: true } : n) : old
      );
      queryClient.invalidateQueries({ queryKey: ['runner-unread-count', user.id] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.setQueryData(notificationQueryKey, (old) =>
        old ? old.map((n) => ({ ...n, read: true })) : old
      );
      queryClient.invalidateQueries({ queryKey: ['runner-unread-count', user.id] });
    },
  });

  const submitDefenseMutation = useMutation({
    mutationFn: async ({ escrowId }) => {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Authentication required');
      const response = await fetch(`${apiBase}/api/escrow/defend-dispute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          escrow_id: escrowId,
          user_id: user.id,
          defense_details: defenseDetails,
          image_base64: defenseImageBase64,
        }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to submit defense');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationQueryKey });
      setDefendingDispute(null);
      setDefenseDetails('');
      setDefenseImage(null);
      setDefenseImageBase64(null);
    },
  });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setDefenseImage(file);
      const reader = new FileReader();
      reader.onload = (event) => setDefenseImageBase64(event.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleNotificationClick = (notif) => {
    markAsReadMutation.mutate(notif.id);
    try {
      // notif.data is jsonb — Supabase returns it as a JS object already.
      // But old notifications stored with JSON.stringify will be a string,
      // so we handle both cases gracefully.
      const data = typeof notif.data === 'string'
        ? JSON.parse(notif.data)
        : (notif.data || {});
      if (notif.type === 'messages' && data.sender_id && data.errand_id) {
        navigate(`/runner/chat/${data.errand_id}/${data.sender_id}`);
      } else if (notif.type === 'accepted' && data.errand_id) {
        navigate(`/runner/job-details/${data.errand_id}`);
      } else if (notif.type === 'dispute' && data.escrowId) {
        setDefendingDispute(notif);
      } else if (data.errand_id) {
        navigate(`/runner/job-details/${data.errand_id}`);
      }
    } catch (err) {
      console.warn('Navigation error:', err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const closeDefenseModal = () => {
    setDefendingDispute(null);
    setDefenseDetails('');
    setDefenseImage(null);
    setDefenseImageBase64(null);
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <ThemedText title style={{ fontSize: '28px', fontWeight: 'bold', display: 'block' }}>
          Notifications {unreadCount > 0 && (
            <span style={{
              marginLeft: '10px',
              backgroundColor: Colors.primary,
              color: 'white',
              borderRadius: '12px',
              padding: '2px 10px',
              fontSize: '14px',
              fontWeight: '700',
              verticalAlign: 'middle',
            }}>
              {unreadCount}
            </span>
          )}
        </ThemedText>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={() => markAllReadMutation.mutate()} disabled={markAllReadMutation.isPending}>
            Mark all read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <ThemedText>Loading notifications...</ThemedText>
        </div>
      ) : notifications.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔔</div>
          <ThemedText title style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>
            No Notifications Yet
          </ThemedText>
          <ThemedText style={{ fontSize: '14px', opacity: 0.6, display: 'block' }}>
            You'll see notifications for job offers, messages, and updates here
          </ThemedText>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {notifications.map((notif) => (
            <ThemedCard
              key={notif.id}
              clickable
              onClick={() => handleNotificationClick(notif)}
              style={{
                cursor: 'pointer',
                opacity: notif.read ? 0.6 : 1,
                borderLeft: `4px solid ${notif.read ? 'transparent' : Colors.primary}`,
                transition: 'all 0.2s ease',
                backgroundColor: notif.type === 'dispute' ? '#ef444415' : undefined,
              }}
            >
              <div style={{ display: 'flex', gap: '12px', alignItems: 'start' }}>
                <div style={{ paddingTop: '2px' }}>
                  <NotificationIcon
                    type={notif.type}
                    color={notif.type === 'dispute' ? '#ef4444' : Colors.primary}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <ThemedText title style={{ fontWeight: '600', marginBottom: '4px', display: 'block' }}>
                    {notif.title}
                  </ThemedText>
                  <ThemedText style={{ fontSize: '14px', opacity: 0.7, marginBottom: '6px', display: 'block' }}>
                    {notif.body}
                  </ThemedText>
                  {notif.created_at && (
                    <ThemedText style={{ fontSize: '12px', opacity: 0.4, display: 'block' }}>
                      {new Date(notif.created_at).toLocaleString()}
                    </ThemedText>
                  )}
                  {notif.type === 'dispute' && (
                    <span style={{
                      display: 'inline-block', marginTop: '6px',
                      fontSize: '12px', fontWeight: '600', color: '#ef4444',
                    }}>
                      Tap to submit defense →
                    </span>
                  )}
                </div>
                {!notif.read && (
                  <div style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    backgroundColor: Colors.primary, marginTop: '6px', flexShrink: 0,
                  }} />
                )}
              </div>
            </ThemedCard>
          ))}
        </div>
      )}

      {/* Defense Modal */}
      {defendingDispute && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div style={{
            background: Colors.cardBackground, border: `2px solid ${Colors.primary}`,
            borderRadius: '12px', padding: '24px', maxWidth: '600px', width: '95%',
            maxHeight: '80vh', overflowY: 'auto', position: 'relative',
          }}>
            <button onClick={closeDefenseModal} style={{
              position: 'absolute', top: '16px', right: '16px',
              background: 'transparent', border: 'none', fontSize: '24px',
              cursor: 'pointer', color: Colors.text,
            }}>✕</button>

            <h3 style={{ color: '#ef4444', marginBottom: '16px', fontSize: '20px', fontWeight: '700' }}>
              Dispute Against You
            </h3>

            <div style={{ marginBottom: '16px' }}>
              <p style={{ margin: '0 0 8px', color: Colors.primary, fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>
                Dispute Details
              </p>
              <div style={{ padding: '12px', background: Colors.background, borderRadius: '8px' }}>
                <p style={{ margin: 0, color: Colors.text, whiteSpace: 'pre-wrap', fontSize: '14px' }}>
                  {defendingDispute.body}
                </p>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <p style={{ margin: '0 0 8px', color: Colors.primary, fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>
                Your Defense
              </p>
              <textarea
                value={defenseDetails}
                onChange={(e) => setDefenseDetails(e.target.value)}
                placeholder="Explain your perspective and provide details..."
                style={{
                  width: '100%', minHeight: '100px', padding: '10px',
                  borderRadius: '8px', border: `1px solid ${Colors.border || '#ccc'}`,
                  background: Colors.background, color: Colors.text,
                  fontSize: '16px', fontFamily: 'inherit', boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <p style={{ margin: '0 0 8px', color: Colors.primary, fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>
                Evidence Image (optional)
              </p>
              <div style={{
                border: `2px dashed ${Colors.border || '#ccc'}`, borderRadius: '8px',
                padding: '16px', textAlign: 'center', backgroundColor: Colors.background, cursor: 'pointer',
              }}>
                <input type="file" accept="image/*" onChange={handleImageChange}
                  style={{ display: 'none' }} id="defense-image-input" />
                <label htmlFor="defense-image-input" style={{ cursor: 'pointer' }}>
                  {defenseImage ? (
                    <div>
                      <p style={{ margin: '0 0 8px', color: Colors.primary, fontWeight: '600' }}>
                        ✓ {defenseImage.name}
                      </p>
                      <img src={defenseImageBase64} alt="preview"
                        style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '4px' }} />
                    </div>
                  ) : (
                    <div>
                      <p style={{ margin: 0, color: Colors.text, fontWeight: '600' }}>Click to upload image</p>
                      <p style={{ margin: '4px 0 0', fontSize: '12px', opacity: 0.5 }}>or drag and drop</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => {
                  const data = typeof defendingDispute.data === 'string'
                    ? JSON.parse(defendingDispute.data)
                    : (defendingDispute.data || {});
                  submitDefenseMutation.mutate({ escrowId: data.escrowId });
                }}
                disabled={submitDefenseMutation.isPending || !defenseDetails.trim()}
                style={{
                  flex: 1, padding: '10px', borderRadius: '8px', border: 'none',
                  background: Colors.primary, color: 'white', cursor: 'pointer',
                  fontWeight: 700, opacity: submitDefenseMutation.isPending || !defenseDetails.trim() ? 0.6 : 1,
                }}
              >
                {submitDefenseMutation.isPending ? 'Submitting...' : 'Submit Defense'}
              </button>
              <button onClick={closeDefenseModal} style={{
                flex: 1, padding: '10px', borderRadius: '8px',
                border: `1px solid ${Colors.border || '#ccc'}`,
                background: 'transparent', color: Colors.text, cursor: 'pointer', fontWeight: 600,
              }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
