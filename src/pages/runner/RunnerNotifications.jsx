import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { ThemedText, ThemedCard } from '../../components/ThemedComponents';
import Button from '../../components/Button';
import { useNavigate } from 'react-router-dom';
import { FiMessageSquare, FiClipboard, FiCheck, FiX, FiAward, FiBell, FiAlertCircle } from 'react-icons/fi';

const notificationIcons = {
  messages: FiMessageSquare,
  applications: FiClipboard,
  accepted: FiCheck,
  rejected: FiX,
  completed: FiAward,
  dispute: FiAlertCircle,
  dispute_resolved: FiCheck,
  default: FiBell,
};

export default function RunnerNotifications() {
  const navigate = useNavigate();
  const { theme, Colors } = useTheme();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [defendingDispute, setDefendingDispute] = useState(null);
  const [defenseDetails, setDefenseDetails] = useState('');
  const [defenseImage, setDefenseImage] = useState(null);
  const [defenseImageBase64, setDefenseImageBase64] = useState(null);

  // Fetch notifications
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['runner-notifications', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('id', { ascending: false });

      return data || [];
    },
    enabled: !!user,
    staleTime: Infinity, // Prevent auto-refetch, rely on real-time subscription
  });

  // Real-time subscription for new notifications
  useEffect(() => {
    if (!user?.id) return;

    console.log('[RunnerNotifications] Setting up real-time subscription for', user.id);

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('[RunnerNotifications] New notification received:', payload);
          queryClient.invalidateQueries({ queryKey: ['runner-notifications', user.id] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('[RunnerNotifications] Notification updated:', payload);
          queryClient.invalidateQueries({ queryKey: ['runner-notifications', user.id] });
        }
      )
      .subscribe((status) => {
        console.log('[RunnerNotifications] Subscription status:', status);
      });

    return () => {
      console.log('[RunnerNotifications] Cleaning up subscription');
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  // Mark as read
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
      // Update the cache immediately
      queryClient.setQueryData(['runner-notifications', user.id], (oldData) => {
        if (!oldData) return oldData;
        return oldData.map((n) => n.id === notificationId ? { ...n, read: true } : n);
      });
    },
  });

  // Mark all as read
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
      // Update the cache immediately
      queryClient.setQueryData(['runner-notifications', user.id], (oldData) => {
        if (!oldData) return oldData;
        return oldData.map((n) => ({ ...n, read: true }));
      });
    },
  });

  // Submit defense
  const submitDefenseMutation = useMutation({
    mutationFn: async ({ escrowId }) => {
      const response = await fetch('/api/escrow/defend-dispute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          escrow_id: escrowId,
          user_id: user.id,
          defense_details: defenseDetails,
          image_base64: defenseImageBase64,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit defense');
      }

      return await response.json();
    },
    onSuccess: () => {
      // Invalidate notifications cache so it refetches from server
      queryClient.invalidateQueries({
        queryKey: ['runner-notifications', user?.id],
      });
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
      reader.onload = (event) => {
        setDefenseImageBase64(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNotificationClick = (notif) => {
    // Mark as read
    markAsReadMutation.mutate(notif.id);

    // Navigate based on type
    try {
      const data = notif.data ? JSON.parse(notif.data) : {};
      if (notif.type === 'messages' && data.sender_id) {
        navigate(`/runner/chat/${data.sender_id}`);
      } else if (notif.type === 'accepted' && data.errand_id) {
        navigate(`/runner/job-details/${data.errand_id}`);
      } else if (notif.type === 'dispute' && data.escrowId) {
        // Open defense modal for disputes
        setDefendingDispute(notif);
      }
    } catch (err) {
      console.warn('Navigation error:', err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
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
          Notifications
        </ThemedText>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
          >
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
          <ThemedText
            title
            style={{
              fontSize: '20px',
              fontWeight: 'bold',
              marginBottom: '8px',
              display: 'block',
            }}
          >
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
                backgroundColor: notif.type === 'dispute' ? Colors.error + '20' : undefined,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'start',
                }}
              >
                <div style={{ fontSize: '24px', color: notif.type === 'dispute' ? Colors.error : Colors.primary }}>
                  {notificationIcons[notif.type] || notificationIcons.default}
                </div>
                <div style={{ flex: 1 }}>
                  <ThemedText
                    title
                    style={{
                      fontWeight: '600',
                      marginBottom: '4px',
                      display: 'block',
                    }}
                  >
                    {notif.title}
                  </ThemedText>
                  <ThemedText
                    style={{
                      fontSize: '14px',
                      opacity: 0.7,
                      marginBottom: '6px',
                      display: 'block',
                    }}
                  >
                    {notif.body}
                  </ThemedText>
                </div>
                {!notif.read && (
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: Colors.primary,
                      marginTop: '6px',
                    }}
                  />
                )}
              </div>
            </ThemedCard>
          ))}
        </div>
      )}

      {/* Defense Modal */}
      {defendingDispute && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: Colors.cardBackground,
            border: `2px solid ${Colors.primary}`,
            borderRadius: '12px',
            padding: '20px',
            maxWidth: '600px',
            width: '95%',
            maxHeight: '80vh',
            overflowY: 'auto',
            position: 'relative',
          }}>
            <button
              onClick={() => { setDefendingDispute(null); setDefenseDetails(''); setDefenseImage(null); setDefenseImageBase64(null); }}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'transparent',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: Colors.text,
              }}
            >
              ✕
            </button>

            <h3 style={{ color: Colors.error, marginBottom: '16px', fontSize: '20px', fontWeight: '700' }}>Dispute Against You</h3>

            <div style={{ marginBottom: '16px' }}>
              <p style={{ margin: 0, color: Colors.primary, fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Dispute Details</p>
              <div style={{ marginTop: '8px', padding: '12px', background: Colors.background, borderRadius: '8px', border: `1px solid ${Colors.border}` }}>
                <p style={{ margin: 0, color: Colors.text, whiteSpace: 'pre-wrap', fontSize: '14px' }}>{defendingDispute.body}</p>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <p style={{ margin: 0, color: Colors.primary, fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '8px' }}>Your Defense</p>
              <textarea 
                value={defenseDetails} 
                onChange={(e) => setDefenseDetails(e.target.value)} 
                placeholder="Explain your perspective and provide details to defend against this dispute..." 
                style={{ 
                  width: '100%', 
                  minHeight: '100px', 
                  padding: '10px', 
                  borderRadius: '8px', 
                  border: `1px solid ${Colors.border}`, 
                  background: Colors.background, 
                  color: Colors.text, 
                  fontSize: '16px', 
                  fontFamily: 'inherit' 
                }} 
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <p style={{ margin: 0, color: Colors.primary, fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '8px' }}>Evidence Image (optional)</p>
              <div style={{
                border: `2px dashed ${Colors.border}`,
                borderRadius: '8px',
                padding: '16px',
                textAlign: 'center',
                backgroundColor: Colors.background,
                cursor: 'pointer',
              }}>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                  id="defense-image-input"
                />
                <label htmlFor="defense-image-input" style={{ cursor: 'pointer' }}>
                  {defenseImage ? (
                    <div>
                      <p style={{ margin: '0 0 8px', color: Colors.primary, fontWeight: '600' }}>✓ {defenseImage.name}</p>
                      <img src={defenseImageBase64} alt="preview" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '4px' }} />
                    </div>
                  ) : (
                    <div>
                      <p style={{ margin: 0, color: Colors.text, fontWeight: '600' }}>Click to upload image</p>
                      <p style={{ margin: '4px 0 0', color: Colors.muted, fontSize: '12px' }}>or drag and drop</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => {
                  const data = defendingDispute.data ? JSON.parse(defendingDispute.data) : {};
                  submitDefenseMutation.mutate({ escrowId: data.escrowId });
                }} 
                disabled={submitDefenseMutation.isPending || !defenseDetails.trim()} 
                style={{ 
                  flex: 1, 
                  padding: '10px', 
                  borderRadius: '8px', 
                  border: 'none', 
                  background: Colors.primary, 
                  color: 'white', 
                  cursor: 'pointer', 
                  fontWeight: 700,
                  opacity: submitDefenseMutation.isPending || !defenseDetails.trim() ? 0.6 : 1,
                }}
              >
                {submitDefenseMutation.isPending ? 'Submitting...' : 'Submit Defense'}
              </button>
              <button 
                onClick={() => { setDefendingDispute(null); setDefenseDetails(''); setDefenseImage(null); setDefenseImageBase64(null); }} 
                style={{ 
                  flex: 1, 
                  padding: '10px', 
                  borderRadius: '8px', 
                  border: `1px solid ${Colors.border}`, 
                  background: 'transparent', 
                  color: Colors.text, 
                  cursor: 'pointer', 
                  fontWeight: 600 
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}