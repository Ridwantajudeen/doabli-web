import { useQuery, useMutation } from '@tanstack/react-query';
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

export default function RunnerNotifications() {
  const navigate = useNavigate();
  const { theme, Colors } = useTheme();
  const { user } = useAuth();

  // Fetch notifications
  const { data: notifications = [], isLoading, refetch } = useQuery({
    queryKey: ['runner-notifications', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      return data || [];
    },
    enabled: !!user,
  });

  // Mark as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      refetch();
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
      refetch();
    },
  });

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
                  <ThemedText
                    style={{
                      fontSize: '12px',
                      opacity: 0.5,
                      display: 'block',
                    }}
                  >
                    {new Date(notif.created_at).toLocaleString()}
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