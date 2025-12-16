import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { ThemedView, ThemedText, ThemedCard } from '../../components/ThemedComponents';
import Button from '../../components/Button';

const STATUS_CONFIG = {
  posted: { color: '#3b82f6', label: 'Posted', icon: '⏱️' },
  assigned: { color: '#f59e0b', label: 'Assigned', icon: '👤' },
  completed: { color: '#22c55e', label: 'Completed', icon: '✓' },
  canceled: { color: '#ef4444', label: 'Canceled', icon: '✕' },
};

export default function ClientMyErrands() {
  const navigate = useNavigate();
  const { theme, Colors } = useTheme();
  const { user } = useAuth();

  const { data: errands = [], isLoading, error } = useQuery({
    queryKey: ['client-errands', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('errands')
        .select('*')
        .eq('posted_by', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <ThemedText title style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '4px', display: 'block' }}>
          My Errands
        </ThemedText>
        <ThemedText style={{ fontSize: '14px', opacity: 0.6, display: 'block', marginBottom: '16px' }}>
          {errands.length} {errands.length === 1 ? 'errand' : 'errands'}
        </ThemedText>
        <Button
          variant="primary"
          size="md"
          onClick={() => navigate('/client/create-errand')}
        >
          Post New Errand
        </Button>
      </div>

      {/* Errands List */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <ThemedText>Loading errands...</ThemedText>
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <ThemedText style={{ color: Colors.warning }}>Failed to load errands</ThemedText>
        </div>
      ) : errands.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
          <ThemedText title style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>
            No Errands Yet
          </ThemedText>
          <ThemedText style={{ fontSize: '14px', opacity: 0.6, marginBottom: '20px', display: 'block' }}>
            Post your first errand to get started
          </ThemedText>
          <Button
            variant="primary"
            onClick={() => navigate('/client/create-errand')}
          >
            Post an Errand
          </Button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {errands.map((errand) => {
            const config = STATUS_CONFIG[errand.status] || STATUS_CONFIG.posted;
            return (
              <ThemedCard
                key={errand.id}
                clickable
                onClick={() => navigate(`/client/errand-details/${errand.id}`)}
                style={{
                  cursor: 'pointer',
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: '16px',
                  alignItems: 'start',
                }}
              >
                {/* Left */}
                <div>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'start', marginBottom: '8px' }}>
                    <ThemedText
                      title
                      style={{ fontSize: '18px', fontWeight: '600', flex: 1, display: 'block' }}
                    >
                      {errand.title}
                    </ThemedText>
                    <div
                      style={{
                        backgroundColor: config.color,
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {config.icon} {config.label}
                    </div>
                  </div>

                  <ThemedText style={{ fontSize: '14px', opacity: 0.7, marginBottom: '8px', display: 'block' }}>
                    {errand.description}
                  </ThemedText>

                  <div style={{ display: 'flex', gap: '16px', fontSize: '13px' }}>
                    <span>📍 {errand.location}</span>
                    <span>📅 {new Date(errand.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Right - Price */}
                <div
                  style={{
                    backgroundColor: Colors.primary,
                    color: 'white',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    textAlign: 'right',
                    minWidth: '120px',
                  }}
                >
                  <div style={{ fontSize: '12px', opacity: 0.9 }}>Payment</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                    ₦{errand.price.toLocaleString()}
                  </div>
                </div>
              </ThemedCard>
            );
          })}
        </div>
      )}
    </div>
  );
}