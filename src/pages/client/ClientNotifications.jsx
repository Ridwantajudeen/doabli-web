import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { ThemedText, ThemedCard } from '../../components/ThemedComponents';
import Button from '../../components/Button';
import { useNavigate } from 'react-router-dom';
import { FiMessageSquare, FiClipboard, FiCheck, FiX, FiAward, FiBell } from 'react-icons/fi';

const notificationIcons = {
  messages: FiMessageSquare,
  applications: FiClipboard,
  accepted: FiCheck,
  rejected: FiX,
  completed: FiAward,
  default: FiBell,
};

export default function ClientNotifications() {
  const navigate = useNavigate();
  const { theme, Colors } = useTheme();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', user?.id],
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

    console.log('[ClientNotifications] Setting up real-time subscription for', user.id);

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
          console.log('[ClientNotifications] New notification received:', payload);
          queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
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
          console.log('[ClientNotifications] Notification updated:', payload);
          queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
        }
      )
      .subscribe((status) => {
        console.log('[ClientNotifications] Subscription status:', status);
      });

    return () => {
      console.log('[ClientNotifications] Cleaning up subscription');
      supabase.removeChannel(channel);
    };
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
      // Update the cache immediately
      queryClient.setQueryData(['notifications', user.id], (oldData) => {
        if (!oldData) return oldData;
        return oldData.map((n) => n.id === notificationId ? { ...n, read: true } : n);
      });
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
      // Update the cache immediately
      queryClient.setQueryData(['notifications', user.id], (oldData) => {
        if (!oldData) return oldData;
        return oldData.map((n) => ({ ...n, read: true }));
      });
    },
  });

  const handleNotificationClick = (notif) => {
    // Mark as read
    markAsReadMutation.mutate(notif.id);

    // Navigate based on type
    try {
      const data = notif.data ? JSON.parse(notif.data) : {};
      if (notif.type === 'messages' && data.sender_id) {
        navigate(`/client/chat/${data.sender_id}`);
      } else if (
        (notif.type === 'applications' || notif.type === 'accepted') &&
        data.errand_id
      ) {
        navigate(`/client/errand-details/${data.errand_id}`);
      }
    } catch (err) {
      console.warn('Navigation error:', err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
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
              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'start',
                }}
              >
                <div style={{ fontSize: '24px' }}>
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
    </div>
  );
}