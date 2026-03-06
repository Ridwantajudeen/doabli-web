import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { showError } from '../../lib/notify';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { ThemedText, ThemedTextInput, ThemedCard } from '../../components/ThemedComponents';
import Button from '../../components/Button';
import { FiArrowLeft, FiMessageSquare, FiCheck } from 'react-icons/fi';

export default function Chat() {
  const { partnerId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { theme, Colors } = useTheme();
  const { user } = useAuth();
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef(null);

  // Fetch messages
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['messages', user?.id, partnerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!partnerId,
  });

  // Fetch partner profile
  const { data: partner } = useQuery({
    queryKey: ['partner', partnerId],
    queryFn: async () => {
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

  // Send message
  const sendMutation = useMutation({
    mutationFn: async (content) => {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      // Send via backend to trigger notification
      const response = await fetch(`${apiUrl}/api/messages/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_id: user.id,
          receiver_id: partnerId,
          content,
          type: 'text',
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
      queryClient.invalidateQueries(['messages', user?.id, partnerId]);
      setMessageText('');
    },
    onError: (err) => {
      showError('send-message', err);
    },
  });

  // Mark messages as read
  useEffect(() => {
    const markAsRead = async () => {
      if (!user || !partnerId) return;

      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('receiver_id', user.id)
        .eq('sender_id', partnerId)
        .is('read_at', null);

      queryClient.invalidateQueries(['messages', user?.id, partnerId]);
    };

    markAsRead();
  }, [messages, user, partnerId, queryClient]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);


  // Subscribe to new messages
  useEffect(() => {
    if (!user || !partnerId) return;

    const subscription = supabase
      .channel(`messages:${user.id}:${partnerId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `or(and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id}))`,
        },
        () => {
          queryClient.invalidateQueries(['messages', user?.id, partnerId]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, partnerId, queryClient]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    sendMutation.mutate(messageText);
  };

  if (isLoading) {
    return (
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px', height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <ThemedText>Loading chat...</ThemedText>
      </div>
    );
  }

  return (
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
          padding: '16px 20px',
          borderBottom: `1px solid ${theme.uiBackground}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => navigate('/client/messages')}
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
              size={48}
              kycVerified={partner?.kyc_verified}
            />
          </div>

          <div>
            <ThemedText
              title
              style={{ fontSize: '16px', fontWeight: '600', display: 'block' }}
            >
              {partner ? partner.first_name : 'Chat'}
            </ThemedText>
            <ThemedText style={{ fontSize: '12px', opacity: 0.6, display: 'block' }}>
              {partner?.email || 'Loading...'}
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
          padding: '20px',
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
                    maxWidth: '60%',
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
          gap: '12px',
          padding: '16px 20px',
          borderTop: `1px solid ${theme.uiBackground}`,
        }}
      >
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
        />
        <Button
          variant="primary"
          onClick={handleSendMessage}
          disabled={!messageText.trim() || sendMutation.isPending}
          style={{ whiteSpace: 'nowrap' }}
        >
          {sendMutation.isPending ? '...' : 'Send'}
        </Button>
      </form>
    </div>
  );
}