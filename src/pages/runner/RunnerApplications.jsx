import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { ThemedText, ThemedCard } from '../../components/ThemedComponents';
import Button from '../../components/Button';
import { FiClock, FiCheck, FiX, FiMapPin, FiClipboard } from 'react-icons/fi';
import { showSuccess, showError } from '../../lib/notify';

const STATUS_CONFIG = {
  pending: { color: '#3b82f6', label: 'Pending', icon: <FiClock /> },
  accepted: { color: '#22c55e', label: 'Accepted', icon: <FiCheck /> },
  rejected: { color: '#ef4444', label: 'Rejected', icon: <FiX /> },
};

export default function RunnerApplications() {
  const navigate = useNavigate();
  const { theme, Colors } = useTheme();
  const { user, profile } = useAuth();
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Fetch applications
  const { data: applications = [], isLoading, error, refetch } = useQuery({
    queryKey: ['runner-applications', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('runner_applications')
        .select('*, errands(*)')
        .eq('runner_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!profile,
  });

  // ✨ Direct hire response mutation
  const respondToHireMutation = useMutation({
    mutationFn: async ({ errandId, action }) => {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Authentication required');

      const res = await fetch(`${apiBase}/api/errands/direct-hire/${errandId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          runner_id: profile.id,
          action, // 'accept' or 'reject'
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Failed to ${action} direct hire request`);
      }

      return await res.json();
    },
    onSuccess: (data, { action }) => {
      showSuccess(action === 'accept' ? 'Direct hire accepted! Client will fund the job.' : 'Direct hire rejected.');
      refetch();
    },
    onError: (err) => {
      showError('direct-hire-response', err);
    },
  });

  // ✨ Propose price (counteroffer) mutation
  const proposePriceMutation = useMutation({
    mutationFn: async ({ errandId, proposed_price, note, receiver_id }) => {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Authentication required');
      const res = await fetch(`${apiBase}/api/errands/${errandId}/propose-price`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ user_id: profile.id, proposed_price, note, receiver_id }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to propose price');
      }
      return await res.json();
    },
    onSuccess: () => {
      showSuccess('Counteroffer sent');
      refetch();
    },
    onError: (err) => showError('propose-price', err),
  });

  // ✨ Accept offer (moves to pending funding)
  const acceptOfferMutation = useMutation({
    mutationFn: async ({ errandId }) => {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Authentication required');
      const res = await fetch(`${apiBase}/api/errands/${errandId}/accept-offer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ runner_id: profile.id }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to accept offer');
      }
      return await res.json();
    },
    onSuccess: () => {
      showSuccess('Offer accepted — waiting for client funding');
      refetch();
    },
    onError: (err) => showError('accept-offer', err),
  });

  const handleDirectHireResponse = (errandId, action) => {
    if (window.confirm(`Are you sure you want to ${action} this direct hire request?`)) {
      respondToHireMutation.mutate({ errandId, action });
    }
  };

  // Group by status
  const grouped = {
    pending: applications.filter((a) => a.status === 'pending'),
    accepted: applications.filter((a) => a.status === 'accepted'),
    rejected: applications.filter((a) => a.status === 'rejected'),
  };

  const ApplicationCard = ({ app }) => {
    const config = STATUS_CONFIG[app.status];
    const isDirectHire = app.errands?.status === 'offered';
    const isPendingDirectHire = isDirectHire && app.status === 'pending';
    const isRunnerLastOffer = app.errands?.last_price_updated_by === profile?.id;
    const displayPrice = isRunnerLastOffer ? app.errands?.price : (app.errands?.proposed_price || app.errands?.price);
    const showPendingOffer = isRunnerLastOffer && app.errands?.proposed_price && app.errands?.proposed_price !== app.errands?.price;

    return (
      <ThemedCard
        clickable={true}
        onClick={() => navigate(`/runner/job-details/${app.errand_id}`)}
        style={{ cursor: 'pointer' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
              <ThemedText
                title
                style={{
                  fontSize: isMobile ? '15px' : '16px',
                  fontWeight: '600',
                  minWidth: 0,
                  display: 'block',
                }}
              >
                {app.errands?.title}
              </ThemedText>
              {isDirectHire && (
                <span
                  style={{
                    backgroundColor: Colors.primary + '20',
                    color: Colors.primary,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: '600',
                  }}
                >
                  Direct Hire
                </span>
              )}
            </div>
            <ThemedText style={{ fontSize: '13px', opacity: 0.6, marginBottom: '6px', display: 'block' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <FiMapPin />
                <span>{app.errands?.location}</span>
              </span>
            </ThemedText>
            <ThemedText style={{ fontSize: '12px', opacity: 0.5, display: 'block' }}>
              {isDirectHire ? 'Hire request received' : 'Applied'} {new Date(app.created_at).toLocaleDateString()}
            </ThemedText>
          </div>

          <div style={{ textAlign: isMobile ? 'left' : 'right', minWidth: isMobile ? '100%' : 'unset' }}>
            <ThemedText
              style={{
                fontSize: '16px',
                fontWeight: '600',
                color: Colors.primary,
                marginBottom: '8px',
                display: 'block',
              }}
            >
              ₦{Number(displayPrice || 0).toLocaleString()}
            </ThemedText>
            {showPendingOffer && (
              <ThemedText style={{ fontSize: '12px', opacity: 0.7, marginBottom: '6px', display: 'block' }}>
                Your offer: ₦{Number(app.errands?.proposed_price || 0).toLocaleString()} (awaiting client approval)
              </ThemedText>
            )}
            <div
              style={{
                backgroundColor: config.color,
                color: 'white',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '600',
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              {config.icon} {config.label}
            </div>
          </div>
        </div>

        {/* Actions moved to errand details page. Click to view and respond. */}
      </ThemedCard>
    );
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: isMobile ? '0 6px' : 0 }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <ThemedText
          title
          style={{
            fontSize: isMobile ? '24px' : '28px',
            fontWeight: 'bold',
            marginBottom: '8px',
            display: 'block',
          }}
        >
          Applied Jobs
        </ThemedText>
        <ThemedText style={{ fontSize: '14px', opacity: 0.6, display: 'block' }}>
          {applications.length} application{applications.length !== 1 ? 's' : ''}
        </ThemedText>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <ThemedText>Loading applications...</ThemedText>
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <ThemedText style={{ color: Colors.warning }}>Failed to load applications</ThemedText>
        </div>
      ) : applications.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}><FiClipboard /></div>
          <ThemedText
            title
            style={{
              fontSize: '20px',
              fontWeight: 'bold',
              marginBottom: '8px',
              display: 'block',
            }}
          >
            No Applications Yet
          </ThemedText>
          <ThemedText style={{ fontSize: '14px', opacity: 0.6, marginBottom: '20px', display: 'block' }}>
            Apply for jobs to see them here
          </ThemedText>
          <Button
            variant="primary"
            onClick={() => navigate('/runner/home')}
          >
            Browse Available Jobs
          </Button>
        </div>
      ) : (
        <div>
          {/* Pending */}
          {grouped.pending.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <ThemedText
                title
                style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  marginBottom: '12px',
                  display: 'block',
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <FiClock />
                  <span>Pending ({grouped.pending.length})</span>
                </span>
              </ThemedText>
              <div style={{ display: 'grid', gap: '12px' }}>
                {grouped.pending.map((app) => (
                  <ApplicationCard key={app.id} app={app} />
                ))}
              </div>
            </div>
          )}

          {/* Accepted */}
          {grouped.accepted.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <ThemedText
                title
                style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  marginBottom: '12px',
                  display: 'block',
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <FiCheck />
                  <span>Accepted ({grouped.accepted.length})</span>
                </span>
              </ThemedText>
              <div style={{ display: 'grid', gap: '12px' }}>
                {grouped.accepted.map((app) => (
                  <ApplicationCard key={app.id} app={app} />
                ))}
              </div>
            </div>
          )}

          {/* Rejected */}
          {grouped.rejected.length > 0 && (
            <div>
              <ThemedText
                title
                style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  marginBottom: '12px',
                  display: 'block',
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <FiX />
                  <span>Rejected ({grouped.rejected.length})</span>
                </span>
              </ThemedText>
              <div style={{ display: 'grid', gap: '12px' }}>
                {grouped.rejected.map((app) => (
                  <ApplicationCard key={app.id} app={app} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
