import { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { getApiBase } from '../lib/apiBase';
import { ThemedCard, ThemedText, ThemedTextInput } from '../components/ThemedComponents';
import Button from '../components/Button';

export default function Support() {
  const { theme, Colors } = useTheme();
  const { user, profile } = useAuth();
  const apiBase = getApiBase();
  const [form, setForm] = useState({
    name: '',
    subject: '',
    message: '',
  });
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  useEffect(() => {
    const fullName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim();
    if (fullName && !form.name) {
      setForm((prev) => ({ ...prev, name: fullName }));
    }
  }, [profile, form.name]);

  const handleChange = (field) => (value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);
    setSubmitAttempted(true);

    if (!user?.email) {
      setStatus({ type: 'error', text: 'You must be logged in to contact support.' });
      return;
    }

    if (!form.message.trim()) {
      setStatus({ type: 'error', text: 'Message is required.' });
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Authentication required');

      const res = await fetch(`${apiBase}/api/support/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name.trim() || null,
          email: user.email,
          subject: form.subject.trim() || null,
          message: form.message.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send message.');
      }

      setForm((prev) => ({ ...prev, subject: '', message: '' }));
      setStatus({ type: 'success', text: 'Thanks! Your message has been sent.' });
    } catch (err) {
      setStatus({ type: 'error', text: err.message || 'Failed to send message.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      <ThemedCard style={{ padding: '24px' }}>
        <ThemedText title style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px', display: 'block' }}>
          Support
        </ThemedText>
        <ThemedText style={{ fontSize: '14px', opacity: 0.7, marginBottom: '20px', display: 'block' }}>
          Send a message to our support team and we’ll respond to your account email.
        </ThemedText>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '14px' }}>
          <div>
            <ThemedText style={{ fontSize: '12px', opacity: 0.7, marginBottom: '6px', display: 'block' }}>
              Email
            </ThemedText>
            <ThemedTextInput value={user?.email || ''} onChange={() => {}} disabled style={{ width: '100%' }} />
          </div>

          <div>
            <ThemedText style={{ fontSize: '12px', opacity: 0.7, marginBottom: '6px', display: 'block' }}>
              Name (optional)
            </ThemedText>
            <ThemedTextInput
              value={form.name}
              onChange={handleChange('name')}
              placeholder="Your name"
              style={{ width: '100%' }}
            />
            <ThemedText
              style={{
                fontSize: '11px',
                marginTop: '6px',
                display: 'block',
                color:
                  submitAttempted &&
                  (form.name.trim().length > 120)
                    ? Colors.warning
                    : theme.text,
                opacity:
                  submitAttempted &&
                  (form.name.trim().length > 120)
                    ? 1
                    : 0.6,
              }}
            >
              {form.name.trim().length} / 120 (min 1)
            </ThemedText>
          </div>

          <div>
            <ThemedText style={{ fontSize: '12px', opacity: 0.7, marginBottom: '6px', display: 'block' }}>
              Subject (optional)
            </ThemedText>
            <ThemedTextInput
              value={form.subject}
              onChange={handleChange('subject')}
              placeholder="How can we help?"
              style={{ width: '100%' }}
            />
            <ThemedText
              style={{
                fontSize: '11px',
                marginTop: '6px',
                display: 'block',
                color:
                  submitAttempted &&
                  (form.subject.trim().length > 200)
                    ? Colors.warning
                    : theme.text,
                opacity:
                  submitAttempted &&
                  (form.subject.trim().length > 200)
                    ? 1
                    : 0.6,
              }}
            >
              {form.subject.trim().length} / 200 (min 1)
            </ThemedText>
          </div>

          <div>
            <ThemedText style={{ fontSize: '12px', opacity: 0.7, marginBottom: '6px', display: 'block' }}>
              Message
            </ThemedText>
            <textarea
              rows={5}
              maxLength={2000}
              value={form.message}
              onChange={(e) => handleChange('message')(e.target.value)}
              placeholder="Describe the issue in detail..."
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: theme.uiBackground,
                border: `1px solid ${theme.uiBackground}`,
                borderRadius: '12px',
                color: theme.text,
                fontSize: '14px',
                fontFamily: 'inherit',
                resize: 'vertical',
                minHeight: '120px',
                boxSizing: 'border-box',
              }}
            />
            <ThemedText
              style={{
                fontSize: '11px',
                marginTop: '6px',
                display: 'block',
                color:
                  submitAttempted &&
                  (form.message.trim().length < 3 || form.message.trim().length > 2000)
                    ? Colors.warning
                    : theme.text,
                opacity:
                  submitAttempted &&
                  (form.message.trim().length < 3 || form.message.trim().length > 2000)
                    ? 1
                    : 0.6,
              }}
            >
              {form.message.trim().length} / 2000 (min 3)
            </ThemedText>
          </div>

          {status && (
            <div style={{ fontSize: 13, color: status.type === 'success' ? Colors.primary : Colors.warning }}>
              {status.text}
            </div>
          )}

          <Button variant="primary" size="md" disabled={loading || !form.message.trim()}>
            {loading ? 'Sending...' : 'Send Message'}
          </Button>
        </form>
      </ThemedCard>
    </div>
  );
}
