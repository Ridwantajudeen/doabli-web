import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { ThemedText, ThemedCard } from '../../components/ThemedComponents';
import Button from '../../components/Button';
import { FiClock, FiCheck, FiX, FiMapPin, FiClipboard } from 'react-icons/fi';

const STATUS_CONFIG = {
  pending: { color: '#3b82f6', label: 'Pending', icon: <FiClock /> },
  accepted: { color: '#22c55e', label: 'Accepted', icon: <FiCheck /> },
  rejected: { color: '#ef4444', label: 'Rejected', icon: <FiX /> },
};

export default function RunnerApplications() {
  const navigate = useNavigate();
  const { theme, Colors } = useTheme();
  const { user, profile } = useAuth();

  // Fetch applications
  const { data: applications = [], isLoading, error } = useQuery({
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

  // Group by status
  const grouped = {
    pending: applications.filter((a) => a.status === 'pending'),
    accepted: applications.filter((a) => a.status === 'accepted'),
    rejected: applications.filter((a) => a.status === 'rejected'),
  };

  const ApplicationCard = ({ app }) => {
    const config = STATUS_CONFIG[app.status];
    return (
      <ThemedCard
        clickable
        onClick={() => navigate(`/runner/job-details/${app.errand_id}`)}
        style={{ cursor: 'pointer' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '12px' }}>
          <div style={{ flex: 1 }}>
            <ThemedText
              title
              style={{
                fontSize: '16px',
                fontWeight: '600',
                marginBottom: '4px',
                display: 'block',
              }}
            >
              {app.errands?.title}
            </ThemedText>
            <ThemedText style={{ fontSize: '13px', opacity: 0.6, marginBottom: '6px', display: 'block' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <FiMapPin />
                <span>{app.errands?.location}</span>
              </span>
            </ThemedText>
            <ThemedText style={{ fontSize: '12px', opacity: 0.5, display: 'block' }}>
              Applied {new Date(app.created_at).toLocaleDateString()}
            </ThemedText>
          </div>

          <div style={{ textAlign: 'right' }}>
            <ThemedText
              style={{
                fontSize: '16px',
                fontWeight: '600',
                color: Colors.primary,
                marginBottom: '8px',
                display: 'block',
              }}
            >
              ₦{app.errands?.price.toLocaleString()}
            </ThemedText>
            <div
              style={{
                backgroundColor: config.color,
                color: 'white',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '600',
                whiteSpace: 'nowrap',
              }}
            >
              {config.icon} {config.label}
            </div>
          </div>
        </div>
      </ThemedCard>
    );
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <ThemedText
          title
          style={{
            fontSize: '28px',
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