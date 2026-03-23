import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../context/ThemeContext';
import { ThemedText, ThemedCard, ThemedTextInput } from '../../components/ThemedComponents';
import Button from '../../components/Button';

export default function RunnerHome() {
  const navigate = useNavigate();
  const { theme, Colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [budgetFilter, setBudgetFilter] = useState('any');
  const [locationFilter, setLocationFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);

  const { data: errands = [], isLoading, error, refetch } = useQuery({
    queryKey: ['available-errands'],
    queryFn: async () => {
      const { data, error: fetchError } = await supabase
        .from('errands')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      return data || [];
    },
  });

  const formatCurrency = (value) =>
    new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0,
    }).format(value || 0);

  const normalizeStatus = (status) => {
    if (!status) return 'available';
    if (status === 'assigned') return 'assigned';
    if (status === 'completed') return 'completed';
    if (status === 'in_progress') return 'assigned';
    if (status === 'pending_payment') return 'pending_payment';
    return status;
  };

  const statusLabel = (status) => {
    if (status === 'assigned' || status === 'in_progress') return 'Assigned';
    if (status === 'completed') return 'Completed';
    if (status === 'pending_payment') return 'Pending Payment';
    return 'Available';
  };

  const statusBadgeStyle = (status) => {
    const label = statusLabel(status);
    if (label === 'Assigned') {
      return {
        backgroundColor: `${Colors.primary}1A`,
        color: Colors.primary,
        border: `1px solid ${Colors.primary}33`,
      };
    }
    if (label === 'Completed') {
      return {
        backgroundColor: `${Colors.primary}12`,
        color: Colors.primary,
        border: `1px solid ${Colors.primary}26`,
      };
    }
    return {
      backgroundColor: `${Colors.primary}14`,
      color: theme.text,
      border: `1px solid ${Colors.primary}26`,
    };
  };

  const isAvailableStatus = (status) => !['assigned', 'completed', 'pending_payment'].includes(status);

  const displayedErrands = useMemo(() => {
    let filtered = errands.filter((errand) => {
      const matchesSearch =
        !searchQuery.trim() ||
        errand.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        errand.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        errand.location.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesBudget =
        budgetFilter === 'any' ||
        (budgetFilter === 'under5' && errand.price <= 5000) ||
        (budgetFilter === '5to10' && errand.price > 5000 && errand.price <= 10000) ||
        (budgetFilter === '10plus' && errand.price > 10000);

      const matchesLocation =
        !locationFilter.trim() ||
        errand.location.toLowerCase().includes(locationFilter.toLowerCase());

      const normalized = normalizeStatus(errand.status);
      if (normalized === 'pending_payment') return false;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'available' && isAvailableStatus(normalized)) ||
        statusFilter === normalized;

      return matchesSearch && matchesBudget && matchesLocation && matchesStatus;
    });

    const getSortValue = (errand) => {
      if (sortBy === 'highestBudget') return errand.price || 0;
      if (sortBy === 'closest') return errand.distance_km ?? errand.distance ?? errand.location;
      return new Date(errand.created_at || 0).getTime();
    };

    filtered = filtered.sort((a, b) => {
      const aValue = getSortValue(a);
      const bValue = getSortValue(b);
      if (sortBy === 'newest') return bValue - aValue;
      if (sortBy === 'highestBudget') return bValue - aValue;
      if (sortBy === 'closest') return String(aValue).localeCompare(String(bValue));
      return 0;
    });

    return filtered;
  }, [errands, searchQuery, budgetFilter, locationFilter, statusFilter, sortBy]);

  const resetFilters = () => {
    setSearchQuery('');
    setBudgetFilter('any');
    setLocationFilter('');
    setStatusFilter('all');
    setSortBy('newest');
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <div
        style={{
          marginBottom: 24,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 16,
          justifyContent: 'space-between',
        }}
      >
        <div>
          <ThemedText title style={{ fontSize: 30, fontWeight: 700, marginBottom: 6, display: 'block' }}>
            Welcome back
          </ThemedText>
          <ThemedText style={{ fontSize: 14, color: theme.text }}>
            Browse available errands and track assigned work in one place.
          </ThemedText>
        </div>
      </div>

      {/* Filter Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          gap: 12,
          marginBottom: 14,
          alignItems: 'center',
        }}
      >
        <ThemedTextInput
          placeholder="Search jobs by title, description, location..."
          value={searchQuery}
          onChange={setSearchQuery}
        />
        <Button
          variant="secondary"
          size="md"
          onClick={() => setShowFilters((prev) => !prev)}
        >
          {showFilters ? 'Hide filters' : 'Filters'}
        </Button>
      </div>

      {showFilters && (
        <div
          style={{
            display: 'grid',
            gap: 12,
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            marginBottom: 24,
            padding: 16,
            borderRadius: 14,
            backgroundColor: theme.uiBackground,
            border: `1px solid ${theme.uiBackground}`,
          }}
        >
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-xl text-sm"
            style={{
              backgroundColor: theme.background,
              border: `1px solid ${theme.uiBackground}`,
              color: theme.text,
            }}
          >
            <option value="all">All statuses</option>
            <option value="available">Available</option>
            <option value="assigned">Assigned</option>
            <option value="completed">Completed</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 rounded-xl text-sm"
            style={{
              backgroundColor: theme.background,
              border: `1px solid ${theme.uiBackground}`,
              color: theme.text,
            }}
          >
            <option value="newest">Newest</option>
            <option value="highestBudget">Highest budget</option>
            <option value="closest">Closest</option>
          </select>
          <select
            value={budgetFilter}
            onChange={(e) => setBudgetFilter(e.target.value)}
            className="px-4 py-2 rounded-xl text-sm"
            style={{
              backgroundColor: theme.background,
              border: `1px solid ${theme.uiBackground}`,
              color: theme.text,
            }}
          >
            <option value="any">Any budget</option>
            <option value="under5">Under NGN 5,000</option>
            <option value="5to10">NGN 5,000 - 10,000</option>
            <option value="10plus">NGN 10,000+</option>
          </select>
          <input
            type="text"
            placeholder="Location"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="px-4 py-2 rounded-xl text-sm"
            style={{
              backgroundColor: theme.background,
              border: `1px solid ${theme.uiBackground}`,
              color: theme.text,
            }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" size="sm" onClick={resetFilters}>
              Reset
            </Button>
            <Button variant="primary" size="sm" onClick={() => setShowFilters(false)}>
              Apply
            </Button>
          </div>
        </div>
      )}

      {/* Jobs List */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <ThemedText>Loading jobs...</ThemedText>
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <ThemedText style={{ color: Colors.warning }}>Failed to load jobs</ThemedText>
          <Button onClick={() => refetch()} style={{ marginTop: 12 }}>
            Retry
          </Button>
        </div>
      ) : displayedErrands.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <ThemedText title style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 8, display: 'block' }}>
            No jobs match your filters.
          </ThemedText>
          <ThemedText style={{ fontSize: 14, opacity: 0.7, display: 'block', marginBottom: 16 }}>
            Try adjusting your filters or check back soon for new opportunities.
          </ThemedText>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button variant="secondary" size="md" onClick={resetFilters}>
              Reset filters
            </Button>
            <Button variant="primary" size="md" onClick={() => navigate('/runner/profile')}>
              Update availability
            </Button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {displayedErrands.map((errand) => (
            <ThemedCard
              key={errand.id}
              clickable
              onClick={() => navigate(`/runner/job-details/${errand.id}`)}
              className="runner-errand-card"
              style={{
                cursor: 'pointer',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span
                    style={{
                      fontSize: 12,
                      padding: '4px 10px',
                      borderRadius: 999,
                      ...statusBadgeStyle(errand.status),
                    }}
                  >
                    {statusLabel(errand.status)}
                  </span>
                </div>

                <ThemedText
                  title
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    marginBottom: 8,
                    display: 'block',
                  }}
                >
                  {errand.title}
                </ThemedText>

                <ThemedText
                  style={{
                    fontSize: 14,
                    opacity: 0.7,
                    marginBottom: 8,
                    display: 'block',
                  }}
                >
                  {errand.description}
                </ThemedText>

                <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: theme.text }}>
                  <span>Location: {errand.location}</span>
                </div>
              </div>

              <div
                className="runner-errand-card__budget"
                style={{
                  backgroundColor: Colors.primary,
                  color: 'white',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  textAlign: 'center',
                  minWidth: '140px',
                }}
              >
                <div style={{ fontSize: '12px', opacity: 0.9 }}>Budget</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                  {formatCurrency(errand.price)}
                </div>
              </div>
            </ThemedCard>
          ))}
        </div>
      )}
    </div>
  );
}
