import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { ThemedText, ThemedCard } from '../../components/ThemedComponents';
import { useNavigate } from 'react-router-dom';
import { FiMessageSquare } from 'react-icons/fi';

export default function RunnerMessages() {
  const navigate = useNavigate();
  const { theme, Colors } = useTheme();
  const { user } = useAuth();

  // Fetch conversations
  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['runner-messages', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (!data) return [];

      // Group by partner
      const partnersMap = new Map();
      data.forEach((msg) => {
        const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        if (!partnersMap.has(partnerId)) {
          partnersMap.set(partnerId, msg);
        }
      });

      // Fetch partner profiles
      const partnerIds = Array.from(partnersMap.keys());
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', partnerIds);

      return Array.from(partnersMap.entries()).map(([partnerId, msg]) => {
        const profile = profiles?.find((p) => p.user_id === partnerId);
        return {
          partnerId,
          partnerName: profile
            ? `${profile.first_name} ${profile.last_name}`
            : 'User',
          lastMessage: msg.content,
          lastTime: msg.created_at,
          isOwn: msg.sender_id === user.id,
        };
      });
    },
    enabled: !!user?.id,
  });

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <ThemedText
        title
        style={{
          fontSize: '28px',
          fontWeight: 'bold',
          marginBottom: '20px',
          display: 'block',
        }}
      >
        Messages
      </ThemedText>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <ThemedText>Loading conversations...</ThemedText>
        </div>
      ) : conversations.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px', display: 'flex', justifyContent: 'center', color: Colors.primary }}><FiMessageSquare size={48} /></div>
          <ThemedText
            title
            style={{
              fontSize: '20px',
              fontWeight: 'bold',
              marginBottom: '8px',
              display: 'block',
            }}
          >
            No Messages Yet
          </ThemedText>
          <ThemedText style={{ fontSize: '14px', opacity: 0.6, display: 'block' }}>
            Messages will appear once you accept a job
          </ThemedText>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {conversations.map((conv) => (
            <ThemedCard
              key={conv.partnerId}
              clickable
              onClick={() => navigate(`/runner/chat/${conv.partnerId}`)}
              style={{ cursor: 'pointer' }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'start',
                  gap: '12px',
                }}
              >
                <div style={{ flex: 1 }}>
                  <ThemedText
                    title
                    style={{
                      fontWeight: '600',
                      marginBottom: '4px',
                      display: 'block',
                    }}
                  >
                    {conv.partnerName}
                  </ThemedText>
                  <ThemedText
                    style={{
                      fontSize: '14px',
                      opacity: 0.7,
                      display: 'block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {conv.isOwn ? 'You: ' : 'They: '}
                    {conv.lastMessage}
                  </ThemedText>
                </div>
                <ThemedText
                  style={{
                    fontSize: '12px',
                    opacity: 0.6,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {new Date(conv.lastTime).toLocaleDateString()}
                </ThemedText>
              </div>
            </ThemedCard>
          ))}
        </div>
      )}
    </div>
  );
}