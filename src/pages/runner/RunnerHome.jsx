import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../context/ThemeContext';
import { ThemedText, ThemedCard, ThemedTextInput } from '../../components/ThemedComponents';

export default function RunnerHome() {
  const navigate = useNavigate();
  const { theme, Colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [minBudget, setMinBudget] = useState('');

  // Fetch available errands (posted, not assigned)
  const { data: errands = [], isLoading, error, refetch } = useQuery({
    queryKey: ['available-errands'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('errands')
        .select('*')
        .eq('status', 'posted')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Filter errands
  const displayedErrands = useMemo(() => {
    return errands.filter((errand) => {
      const matchesSearch =
        !searchQuery.trim() ||
        errand.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        errand.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        errand.location.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesBudget =
        !minBudget || errand.price >= parseFloat(minBudget);

      return matchesSearch && matchesBudget;
    });
  }, [errands, searchQuery, minBudget]);

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
          Available Jobs
        </ThemedText>
        <ThemedText style={{ fontSize: '14px', opacity: 0.6, display: 'block', marginBottom: '16px' }}>
          {displayedErrands.length} job{displayedErrands.length !== 1 ? 's' : ''} available
        </ThemedText>
      </div>

      {/* Search & Filters */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', marginBottom: '24px' }}>
        <ThemedTextInput
          placeholder="Search jobs by title, description, location..."
          value={searchQuery}
          onChange={(v) => setSearchQuery(v)}
        />
        <input
          type="number"
          placeholder="Min budget"
          value={minBudget}
          onChange={(e) => setMinBudget(e.target.value)}
          style={{
            padding: '12px 16px',
            backgroundColor: theme.uiBackground,
            border: `1px solid ${theme.uiBackground}`,
            borderRadius: '12px',
            color: theme.text,
            fontSize: '14px',
            width: '140px',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Jobs List */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <ThemedText>Loading jobs...</ThemedText>
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <ThemedText style={{ color: Colors.warning }}>Failed to load jobs</ThemedText>
        </div>
      ) : displayedErrands.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
          <ThemedText
            title
            style={{
              fontSize: '20px',
              fontWeight: 'bold',
              marginBottom: '8px',
              display: 'block',
            }}
          >
            No Jobs Available
          </ThemedText>
          <ThemedText style={{ fontSize: '14px', opacity: 0.6, display: 'block' }}>
            {searchQuery || minBudget ? 'Try adjusting your filters' : 'Check back soon for new opportunities'}
          </ThemedText>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {displayedErrands.map((errand) => (
            <ThemedCard
              key={errand.id}
              clickable
              onClick={() => navigate(`/runner/job-details/${errand.id}`)}
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
                <ThemedText
                  title
                  style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    marginBottom: '8px',
                    display: 'block',
                  }}
                >
                  {errand.title}
                </ThemedText>

                <ThemedText
                  style={{
                    fontSize: '14px',
                    opacity: 0.7,
                    marginBottom: '8px',
                    display: 'block',
                  }}
                >
                  {errand.description}
                </ThemedText>

                <div style={{ display: 'flex', gap: '16px', fontSize: '13px' }}>
                  <span>📍 {errand.location}</span>
                  <span>📅 {new Date(errand.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Right - Budget */}
              <div
                style={{
                  backgroundColor: Colors.primary,
                  color: 'white',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  textAlign: 'center',
                  minWidth: '120px',
                }}
              >
                <div style={{ fontSize: '12px', opacity: 0.9 }}>Budget</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                  ₦{errand.price.toLocaleString()}
                </div>
              </div>
            </ThemedCard>
          ))}
        </div>
      )}
    </div>
  );
}
