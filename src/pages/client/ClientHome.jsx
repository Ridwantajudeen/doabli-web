import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getRunners } from '../../lib/supabase';
import { useTheme } from '../../context/ThemeContext';
import { ThemedView, ThemedText, ThemedCard, ThemedTextInput } from '../../components/ThemedComponents';
import Button from '../../components/Button';
import Avatar from '../../components/Avatar';
import { FiStar, FiBriefcase } from 'react-icons/fi';

export default function ClientHome() {
  const navigate = useNavigate();
  const { theme, Colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState('any');
  const [budgetFilter, setBudgetFilter] = useState('any');
  const [locationFilter, setLocationFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);

  const { data: runners = [], isLoading, error, refetch } = useQuery({
    queryKey: ['runners'],
    queryFn: async () => {
      const { data, error: fetchError } = await getRunners();
      if (fetchError) {
        console.error('Error fetching runners:', fetchError);
        throw new Error(fetchError);
      }
      return data;
    },
  });

  const formatCurrency = (value) =>
    new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0,
    }).format(value || 0);

  const getRunnerLocation = (runner) => {
    return (
      runner.location ||
      runner.city ||
      runner.state ||
      runner.address ||
      ''
    );
  };

  const getRunnerMinPrice = (runner) => {
    if (!runner.services || runner.services.length === 0) return null;
    return Math.min(...runner.services.map((service) => Number(service.price) || 0));
  };

  const displayedRunners = useMemo(() => {
    let filtered = runners.filter((runner) => {
      const name = `${runner.first_name || ''} ${runner.last_name || ''}`.toLowerCase();
      const matchesSearch =
        !searchQuery.trim() ||
        name.includes(searchQuery.toLowerCase()) ||
        (runner.services || []).some((s) => s.title?.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesRating =
        ratingFilter === 'any' ||
        (runner.average_rating || 0) >= parseFloat(ratingFilter);

      const runnerLocation = getRunnerLocation(runner).toLowerCase();
      const matchesLocation =
        !locationFilter.trim() ||
        runnerLocation.includes(locationFilter.toLowerCase());

      const minPrice = getRunnerMinPrice(runner);
      const matchesBudget =
        budgetFilter === 'any' ||
        (minPrice !== null && (
          (budgetFilter === 'under5' && minPrice <= 5000) ||
          (budgetFilter === '5to10' && minPrice > 5000 && minPrice <= 10000) ||
          (budgetFilter === '10plus' && minPrice > 10000)
        ));

      return matchesSearch && matchesRating && matchesLocation && matchesBudget;
    });

    const getSortValue = (runner) => {
      if (sortBy === 'highestBudget') {
        const prices = (runner.services || []).map((service) => Number(service.price) || 0);
        return Math.max(...prices, 0);
      }
      if (sortBy === 'closest') {
        return runner.distance_km ?? runner.distance ?? getRunnerLocation(runner);
      }
      return new Date(runner.created_at || 0).getTime();
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
  }, [runners, searchQuery, ratingFilter, budgetFilter, locationFilter, sortBy]);

  const resetFilters = () => {
    setSearchQuery('');
    setRatingFilter('any');
    setBudgetFilter('any');
    setLocationFilter('');
    setSortBy('newest');
  };

  return (
    <ThemedView style={{ padding: 24, maxWidth: 1200, margin: '0 auto', minHeight: '100vh' }}>
      {/* Header */}
      <div
        style={{
          marginBottom: 28,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 16,
          justifyContent: 'space-between',
        }}
      >
        <div>
          <ThemedText title style={{ fontSize: 32, fontWeight: 700, marginBottom: 6, display: 'block' }}>
            Welcome back
          </ThemedText>
          <ThemedText style={{ fontSize: 14, color: theme.text }}>
            Find trusted runners and post errands in minutes.
          </ThemedText>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Button variant="primary" size="md" onClick={() => navigate('/client/create-errand')}>
            Post an errand
          </Button>
        </div>
      </div>

      {/* Filter Strip */}
      <div
        style={{
          display: 'grid',
          gap: 12,
          gridTemplateColumns: '1fr auto',
          alignItems: 'center',
          marginBottom: 14,
        }}
      >
        <ThemedTextInput
          placeholder="Search runners, services..."
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
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="px-4 py-2 rounded-xl text-sm"
            style={{
              backgroundColor: theme.background,
              border: `1px solid ${theme.uiBackground}`,
              color: theme.text,
            }}
          >
            <option value="any">Any rating</option>
            <option value="4">4.0+</option>
            <option value="4.5">4.5+</option>
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

      {/* Runners Grid */}
      <div id="runner-list">
        <ThemedText title style={{ fontSize: 22, fontWeight: 600, marginBottom: 14 }}>
          Available Runners ({displayedRunners.length})
        </ThemedText>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <ThemedText>Loading runners...</ThemedText>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <ThemedText style={{ color: Colors.warning }}>Failed to load runners</ThemedText>
            <Button onClick={() => refetch()} style={{ marginTop: 12 }}>
              Retry
            </Button>
          </div>
        ) : displayedRunners.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <ThemedText title style={{ fontSize: 18, marginBottom: 8 }}>
              No runners match your filters.
            </ThemedText>
            <ThemedText style={{ fontSize: 14, color: theme.text, marginBottom: 16 }}>
              Try resetting filters or adjust your search to see more results.
            </ThemedText>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button variant="secondary" size="md" onClick={resetFilters}>
                Reset filters
              </Button>
              <Button variant="primary" size="md" onClick={() => navigate('/client/create-errand')}>
                Post an errand
              </Button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {displayedRunners.map((runner) => (
              <ThemedCard
                key={runner.id}
                clickable
                onClick={() => navigate(`/client/runner-profile/${runner.id}`)}
                style={{ cursor: 'pointer', transition: 'all 0.2s ease', padding: 14 }}
              >
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <Avatar url={runner.avatar_url} size={64} kycVerified={runner.kyc_verified} />

                  <div style={{ flex: 1 }}>
                    <ThemedText style={{ fontSize: 18, fontWeight: 700 }}>
                      {`${runner.first_name || ''} ${runner.last_name || ''}`}
                    </ThemedText>

                    <div style={{ display: 'flex', alignItems: 'center', marginTop: 2 }}>
                      <span style={{ color: '#f59e0b', marginRight: 8 }}>
                        {runner.average_rating ? <FiStar /> : <FiStar style={{ opacity: 0.3 }} />}
                      </span>
                      <ThemedText style={{ fontSize: 13, opacity: 0.7 }}>
                        {runner.average_rating ? runner.average_rating.toFixed(1) : 'No rating'}
                      </ThemedText>
                    </div>

                    {runner.services && runner.services.length > 0 ? (
                      <div style={{ marginTop: 8 }}>
                        {runner.services.slice(0, 2).map((service) => (
                          <div key={service.id} style={{ display: 'flex', alignItems: 'center', marginBottom: 2 }}>
                            <span style={{ fontSize: 12, marginRight: 8 }}>
                              <FiBriefcase size={12} />
                            </span>
                            <ThemedText style={{ fontSize: 13 }}>
                              {service.title} - {formatCurrency(Number(service.price))}
                            </ThemedText>
                          </div>
                        ))}
                        {runner.services.length > 2 && (
                          <ThemedText style={{ fontSize: 12, opacity: 0.6 }}>
                            +{runner.services.length - 2} more
                          </ThemedText>
                        )}
                      </div>
                    ) : (
                      <ThemedText style={{ fontSize: 13, opacity: 0.6, marginTop: 8 }}>
                        No services listed
                      </ThemedText>
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
