import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getRunners, supabase } from '../../lib/supabase';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { ThemedView, ThemedText, ThemedCard, ThemedTextInput } from '../../components/ThemedComponents';
import Button from '../../components/Button';
import Avatar from '../../components/Avatar';
import { FiStar, FiBriefcase } from 'react-icons/fi';

export default function ClientHome() {
  const navigate = useNavigate();
  const { theme, Colors } = useTheme();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [minRating, setMinRating] = useState('');

  const { data: runners = [], isLoading, error, refetch } = useQuery({
    queryKey: ['runners'],
    queryFn: async () => {
      const { data, error } = await getRunners();
      if (error) {
        console.error('Error fetching runners:', error);
        throw new Error(error);
      }
      console.log('Runners loaded:', data);
      return data;
    },
  });

  const displayedRunners = useMemo(() => {
    return runners.filter(runner => {
      const name = `${runner.first_name || ''} ${runner.last_name || ''}`.toLowerCase();
      const matchesSearch = !searchQuery.trim() ||
        name.includes(searchQuery.toLowerCase()) ||
        (runner.services || []).some(s => s.title?.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesRating = !minRating || (runner.average_rating || 0) >= parseFloat(minRating);

      return matchesSearch && matchesRating;
    });
  }, [runners, searchQuery, minRating]);

  return (
    <ThemedView style={{ padding: 20, maxWidth: 1200, margin: '0 auto', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <ThemedText title style={{ fontSize: 32, fontWeight: 'bold', marginBottom: 8 }}>Home</ThemedText>
        <Button variant="primary" size="md" onClick={() => navigate('/client/create-errand')} style={{ marginTop: 12 }}>
          Post Job +
        </Button>
      </div>

      {/* Search & Filter */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, marginBottom: 24 }}>
        <ThemedTextInput placeholder="Search runners, services..." value={searchQuery} onChange={setSearchQuery} />
        <input
          type="number"
          placeholder="Min rating"
          min={1}
          max={5}
          value={minRating}
          onChange={e => {
            const val = e.target.value;
            if (val === '') setMinRating('');
            else setMinRating(Math.max(1, Math.min(5, Number(val))));
          }}
          className="px-4 py-3 rounded-xl text-sm w-36"
          style={{ backgroundColor: theme.uiBackground, border: `1px solid ${theme.uiBackground}`, color: theme.text }}
        />
      </div>

      {/* Runners Grid */}
      <div>
        <ThemedText title style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>
          Available Runners ({displayedRunners.length})
        </ThemedText>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <ThemedText>Loading runners...</ThemedText>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <ThemedText style={{ color: Colors.warning }}>Failed to load runners</ThemedText>
            <Button onClick={() => refetch()} style={{ marginTop: 12 }}>Retry</Button>
          </div>
        ) : displayedRunners.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <ThemedText>No runners found</ThemedText>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {displayedRunners.map(runner => (
              <ThemedCard
                key={runner.id}
                clickable
                onClick={() => navigate(`/client/runner-profile/${runner.id}`)}
                style={{ cursor: 'pointer', transition: 'all 0.2s ease', padding: 14 }}
              >
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  {/* Avatar */}
                  <Avatar
                    url={runner.avatar_url}
                    size={64}
                    kycVerified={runner.kyc_verified}
                  />

                  {/* Info */}
                  <div style={{ flex: 1 }}>
                    <ThemedText style={{ fontSize: 18, fontWeight: 700 }}>
                      {`${runner.first_name || ''} ${runner.last_name || ''}`}
                    </ThemedText>

                    <div style={{ display: 'flex', alignItems: 'center', marginTop: 2 }}>
                      <span style={{ color: '#f59e0b', marginRight: 8 }}>{runner.average_rating ? <FiStar /> : <FiStar style={{ opacity: 0.3 }} />}</span>
                      <ThemedText style={{ fontSize: 13, opacity: 0.7 }}>
                        {runner.average_rating ? runner.average_rating.toFixed(1) : 'No rating'}
                      </ThemedText>
                    </div>

                    {runner.services && runner.services.length > 0 ? (
                      <div style={{ marginTop: 8 }}>
                        {runner.services.slice(0, 2).map(s => (
                          <div key={s.id} style={{ display: 'flex', alignItems: 'center', marginBottom: 2 }}>
                            <span style={{ fontSize: 12, marginRight: 8 }}><FiBriefcase size={12} /></span>
                            <ThemedText style={{ fontSize: 13 }}>{s.title} · ₦{Number(s.price).toLocaleString()}</ThemedText>
                          </div>
                        ))}
                        {runner.services.length > 2 && <ThemedText style={{ fontSize: 12, opacity: 0.6 }}>+{runner.services.length - 2} more</ThemedText>}
                      </div>
                    ) : (
                      <ThemedText style={{ fontSize: 13, opacity: 0.6, marginTop: 8 }}>No services listed</ThemedText>
                    )}
                  </div>
                </div>
              </ThemedCard>
            ))}
          </div>
        )}
      </div>
    </ThemedView>
  );
}
