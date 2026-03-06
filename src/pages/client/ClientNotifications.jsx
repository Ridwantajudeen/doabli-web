//ClientNotifications.jsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { ThemedText, ThemedCard } from '../../components/ThemedComponents';
import Button from '../../components/Button';
import { useNavigate } from 'react-router-dom';
import { FiMessageSquare, FiClipboard, FiCheck, FiX, FiAward, FiBell, FiAlertCircle } from 'react-icons/fi';

// Map type → icon component (rendered as JSX in the list)
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

export default function ClientNotifications() {
  const navigate = useNavigate();
  const { Colors } = useTheme();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        // Fallback: order by id if created_at column doesn't exist
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
  });

  // Real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`client-notifications:${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user?.id, queryClient]);

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
      queryClient.setQueryData(['notifications', user.id], (old) =>
        old ? old.map((n) => n.id === notificationId ? { ...n, read: true } : n) : old
      );
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
      queryClient.setQueryData(['notifications', user.id], (old) =>
        old ? old.map((n) => ({ ...n, read: true })) : old
      );
    },
  });

  const handleNotificationClick = (notif) => {
    markAsReadMutation.mutate(notif.id);
    try {
      // notif.data is jsonb — Supabase returns it as a JS object already.
      // But old notifications stored with JSON.stringify will be a string,
      // so we handle both cases gracefully.
      const data = typeof notif.data === 'string'
        ? JSON.parse(notif.data)
        : (notif.data || {});
      if (notif.type === 'messages' && data.sender_id) {
        navigate(`/client/chat/${data.sender_id}`);
      } else if (data.errand_id) {
        navigate(`/client/errand-details/${data.errand_id}`);
      }
    } catch (err) {
      console.warn('Navigation error:', err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
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
          <ThemedText style={{ opacity: 0.6, display: 'block' }}>
            You'll see notifications for messages, applications, and updates here
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
                  {(notif.created_at || notif.id) && (
                    <ThemedText style={{ fontSize: '12px', opacity: 0.4, display: 'block' }}>
                      {notif.created_at ? new Date(notif.created_at).toLocaleString() : `#${notif.id}`}
                    </ThemedText>
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
    </div>
  );
}