import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { ThemedText, ThemedCard } from '../../components/ThemedComponents';
import { useNavigate } from 'react-router-dom';
import { FiMessageSquare, FiCheck } from 'react-icons/fi';
import Avatar from '../../components/Avatar';

export default function ClientMessages() {
  const navigate = useNavigate();
  const { theme, Colors } = useTheme();
  const { user } = useAuth();

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['messages', user?.id],
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

      // Fetch partner profiles (include avatar and verification)
      const partnerIds = Array.from(partnersMap.keys());
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, kyc_verified')
        .in('id', partnerIds);

      return Array.from(partnersMap.entries()).map(([partnerId, msg]) => {
        const profile = profiles?.find((p) => p.id === partnerId);
        return {
          partnerId,
          partnerFirstName: profile ? profile.first_name : 'User',
          partnerName: profile
            ? `${profile.first_name} ${profile.last_name}`
            : 'User',
          avatar_url: profile?.avatar_url || null,
          kyc_verified: profile?.kyc_verified || false,
          lastMessage: msg.content,
          lastTime: msg.created_at,
          isOwn: msg.sender_id === user.id,
        };
      });
    },
    enabled: !!user?.id,
  });


  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
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
          <ThemedText style={{ opacity: 0.6, display: 'block' }}>
            Messages will appear once you accept a runner for an errand
          </ThemedText>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {conversations.map((conv) => (
            <ThemedCard
                key={conv.partnerId}
                clickable
                onClick={() => navigate(`/client/chat/${conv.partnerId}`)}
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
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1 }}>
                            <Avatar
                    url={conv.avatar_url}
                    size={48}
                    kycVerified={conv.kyc_verified}
                  />

                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ThemedText
                          title
                          style={{
                            fontWeight: '600',
                            marginBottom: '4px',
                            display: 'block',
                          }}
                        >
                          {conv.partnerFirstName}
                        </ThemedText>
                        {conv.kyc_verified && <FiCheck color={Colors.primary} />}
                      </div>

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
                        {conv.isOwn ? 'You: ' : ''}
                        {conv.lastMessage}
                      </ThemedText>
                    </div>
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
