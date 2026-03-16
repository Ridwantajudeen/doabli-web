import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { showError } from '../../lib/notify';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { ThemedView, ThemedText, ThemedTextInput, ThemedCard } from '../../components/ThemedComponents';
import Button from '../../components/Button';
import Avatar from '../../components/Avatar';
import { FiArrowLeft, FiMessageSquare, FiCheck } from 'react-icons/fi';
import { fetchMessagingAccess } from '../../lib/contactAccess';

export default function Chat() {
  const { partnerId, errandId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { theme, Colors } = useTheme();
  const { user, profile } = useAuth();
  const [messageText, setMessageText] = useState('');
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const { data: contactAccess } = useQuery({
    queryKey: ['contact-access', user?.id, partnerId, errandId],
    queryFn: async () => fetchMessagingAccess(supabase, user?.id, partnerId, errandId),
    enabled: !!user?.id && !!partnerId && !!errandId,
  });

  const canMessage = !!contactAccess?.canMessage;

  // Fetch messages
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['messages', user?.id, partnerId, errandId],
    queryFn: async () => {
      if (!user?.id || !partnerId || !errandId) return [];

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('errand_id', errandId)
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && !!partnerId && !!errandId,
  });

  // Fetch partner profile
  const { data: partner } = useQuery({
    queryKey: ['partner', partnerId],
    queryFn: async () => {
      if (!partnerId) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', partnerId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!partnerId,
  });

  // Fetch errand info for context
  const { data: errand } = useQuery({
    queryKey: ['chat-errand', errandId],
    queryFn: async () => {
      if (!errandId) return null;
      const { data, error } = await supabase
        .from('errands')
        .select('id,title,posted_by,assigned_to,status')
        .eq('id', errandId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!errandId,
  });

  // Send message
  const sendMutation = useMutation({
    mutationFn: async (content) => {
      if (!canMessage) {
        throw new Error('Messaging is disabled because there is no active or direct-hire job with this user.');
      }

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Authentication required');
      
      // Send via backend to trigger notification
      const response = await fetch(`${apiUrl}/api/messages/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          receiver_id: partnerId,
          content,
          type: 'text',
          errand_id: errandId,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to send message');
      }

      const data = await response.json();
      return data.message;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['messages', user?.id, partnerId, errandId]);
      setMessageText('');
    },
    onError: (err) => {
      showError('send-message', err);
    },
  });

  // Mark messages as read
  useEffect(() => {
    const markAsRead = async () => {
      if (!user || !partnerId || !errandId) return;

      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) return;
        
        const response = await fetch(`${apiUrl}/api/messages/mark-as-read`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            sender_id: partnerId,
            errand_id: errandId,
          }),
        });

        if (response.ok) {
          queryClient.invalidateQueries(['messages', user?.id, partnerId, errandId]);
        }
      } catch (err) {
        console.error('[Chat] Error marking messages as read:', err);
        // Don't show error to user - marking as read is not critical
      }
    };

    markAsRead();
  }, [messages, user, partnerId, errandId, queryClient]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);


  // Subscribe to new messages
  useEffect(() => {
    if (!user || !partnerId || !errandId) return;

    const subscription = supabase
      .channel(`messages:${errandId}:${user.id}:${partnerId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `errand_id=eq.${errandId}`,
        },
        () => {
          queryClient.invalidateQueries(['messages', user?.id, partnerId, errandId]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, partnerId, errandId, queryClient]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    sendMutation.mutate(messageText);
  };

  if (!errandId) {
    return (
      <ThemedView style={{ minHeight: '100vh' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: isMobile ? '12px' : '20px', height: '100vh', display: 'flex', flexDirection: 'column' }}>
          <ThemedText>This chat link is missing an errand. Please open chat from an errand.</ThemedText>
          <Button
            variant="ghost"
            onClick={() => navigate(profile?.role === 'runner' ? '/runner/messages' : '/client/messages')}
            style={{ marginTop: '12px', width: 'fit-content' }}
          >
            Back to Messages
          </Button>
        </div>
      </ThemedView>
    );
  }

  if (isLoading) {
    return (
      <ThemedView style={{ minHeight: '100vh' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: isMobile ? '12px' : '20px', height: '100vh', display: 'flex', flexDirection: 'column' }}>
          <ThemedText>Loading chat...</ThemedText>
        </div>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={{ minHeight: '100vh' }}>
      <div
        style={{
          maxWidth: '900px',
          margin: '0 auto',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: theme.background,
        }}
      >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: isMobile ? '12px' : '16px 20px',
          borderBottom: `1px solid ${theme.uiBackground}`,
          gap: '10px',
          flexWrap: isMobile ? 'wrap' : 'nowrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '16px', minWidth: 0, flex: 1 }}>
          <button
            onClick={() => navigate(profile?.role === 'runner' ? '/runner/messages' : '/client/messages')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: Colors.primary,
              fontSize: '20px',
              fontWeight: 'bold',
            }}
          >
          <FiArrowLeft size={24} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Avatar
              url={partner?.avatar_url}
              size={isMobile ? 40 : 48}
              kycVerified={partner?.kyc_verified}
            />
          </div>

          <div style={{ minWidth: 0 }}>
            <ThemedText
              title
              style={{ fontSize: '16px', fontWeight: '600', display: 'block' }}
            >
              {partner ? partner.first_name : 'Chat'}
            </ThemedText>
            <ThemedText style={{ fontSize: '12px', opacity: 0.6, display: 'block', whiteSpace: isMobile ? 'normal' : 'nowrap' }}>
              {errand?.title ? `Errand: ${errand.title}` : 'Keep communication inside Doabli'}
            </ThemedText>
          </div>
        </div>

        {partner && partner.kyc_verified && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiCheck color={Colors.primary} />
            <ThemedText style={{ fontSize: '12px', opacity: 0.8 }}>Verified</ThemedText>
          </div>
        )}

        {partner && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate(`/client/runner-profile/${partner.id}`)}
            style={{ width: isMobile ? '100%' : 'auto' }}
          >
            View Profile
          </Button>
        )}
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: isMobile ? '12px' : '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', opacity: 0.6, margin: 'auto' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px', display: 'flex', justifyContent: 'center', color: Colors.primary }}><FiMessageSquare size={48} /></div>
            <ThemedText>Start the conversation!</ThemedText>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender_id === user?.id;
            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  justifyContent: isOwn ? 'flex-end' : 'flex-start',
                }}
              >
                {!isOwn && partner && (
                  <div style={{ marginRight: 8 }}>
                    <Avatar
                      url={partner.avatar_url}
                      size={32}
                      kycVerified={partner.kyc_verified}
                    />
                  </div>
                )}

                <div
                  style={{
                    maxWidth: isMobile ? '82%' : '60%',
                    width: 'fit-content',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    backgroundColor: msg.type === 'price_update' ? Colors.warning + '20' : (isOwn ? Colors.primary : theme.uiBackground),
                    color: isOwn ? 'white' : theme.text,
                  }}
                >
                  {msg.type === 'price_update' && (
                    <div style={{ marginBottom: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <div style={{ backgroundColor: Colors.warning, color: 'white', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}>Price Update</div>
                      <ThemedText style={{ fontSize: '13px', fontWeight: 700 }}>{msg.content}</ThemedText>
                    </div>
                  )}
                  {msg.type !== 'price_update' && (
                    <ThemedText
                      style={{
                        fontSize: '14px',
                        display: 'block',
                        marginBottom: '4px',
                        color: isOwn ? 'white' : theme.text,
                      }}
                    >
                      {msg.content}
                    </ThemedText>
                  )}
                  <ThemedText
                    style={{
                      fontSize: '11px',
                      opacity: isOwn ? 0.8 : 0.6,
                      color: isOwn ? 'white' : theme.text,
                    }}
                  >
                    {new Date(msg.created_at).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </ThemedText>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSendMessage}
        style={{
          display: 'flex',
          flexWrap: 'nowrap',
          gap: '12px',
          padding: isMobile ? '12px' : '16px 20px',
          borderTop: `1px solid ${theme.uiBackground}`,
          alignItems: 'center',
        }}
      >
        {!canMessage && (
          <div style={{ width: '100%', marginBottom: '8px' }}>
            <ThemedText style={{ fontSize: '12px', color: '#ef4444', display: 'block' }}>
              Messaging is available only while you have an active, incomplete, or direct-hire job together.
            </ThemedText>
            <ThemedText style={{ fontSize: '12px', opacity: 0.7, display: 'block' }}>
              For security and dispute support, keep all communication inside Doabli.
            </ThemedText>
          </div>
        )}
        <textarea
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="Type a message..."
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage(e);
            }
          }}
          style={{
            flex: 1,
            minWidth: 0,
            padding: '12px 16px',
            backgroundColor: theme.uiBackground,
            border: `1px solid ${theme.uiBackground}`,
            borderRadius: '12px',
            color: theme.text,
            fontSize: '16px',
            fontFamily: 'inherit',
            resize: 'none',
            maxHeight: '100px',
            boxSizing: 'border-box',
          }}
          rows="1"
          disabled={!canMessage}
        />
        <Button
          variant="primary"
          onClick={handleSendMessage}
          disabled={!canMessage || !messageText.trim() || sendMutation.isPending}
          style={{
            whiteSpace: 'nowrap',
            width: 'auto',
            backgroundColor: '#a78bfa',
            borderColor: '#a78bfa',
            boxShadow: '0 4px 12px rgba(167, 139, 250, 0.35)',
            color: '#ffffff',
          }}
        >
          {sendMutation.isPending ? '...' : 'Send'}
        </Button>
      </form>
      </div>
    </ThemedView>
  );
}

