import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { showSuccess, showError } from '../../lib/notify';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { ThemedView, ThemedText, ThemedCard, ThemedTextInput } from '../../components/ThemedComponents';
import Button from '../../components/Button';
import BrandLogo from '../../components/BrandLogo';
import { FiEdit, FiX, FiLogOut, FiUser, FiCamera, FiArrowLeft, FiStar, FiCheck } from 'react-icons/fi';
import Avatar from '../../components/Avatar';
import { useState, useEffect } from 'react';
import { fetchMessagingAccess } from '../../lib/contactAccess';

export default function RunnerProfile() {
  const { id: runnerId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const applicationId = searchParams.get('applicationId');
  const errandId = searchParams.get('errandId');
  const { theme, Colors } = useTheme();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Direct hire state
  const [showDirectHireModal, setShowDirectHireModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [directHireForm, setDirectHireForm] = useState({ 
    title: '', 
    description: '', 
    location: '',
    proposed_price: ''
  });

  // Fetch runner profile
  const { data: runner, isLoading } = useQuery({
    queryKey: ['runner', runnerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', runnerId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Fetch services
  const { data: services = [] } = useQuery({
    queryKey: ['services', runnerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('runner_id', runnerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const { data: messagingAccess } = useQuery({
    queryKey: ['message-access', user?.id, runnerId],
    queryFn: async () => fetchMessagingAccess(supabase, user?.id, runnerId),
    enabled: !!user?.id && !!runnerId,
  });

  const canMessage = !!messagingAccess?.canMessage;

  // review visibility state (only show first, load more on demand)
  const [visibleCount, setVisibleCount] = useState(1);

  // Fetch reviews for runner (get plenty so we can paginate locally)
  const { data: reviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: ['reviews', runnerId],
    queryFn: async () => {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/review/runner/${runnerId}?page=1&limit=1000`);
      if (!response.ok) {
        const body = await response.text().catch(() => '');
        throw new Error(`Failed to fetch reviews (${response.status}) ${body}`);
      }
      const data = await response.json();
      return data.reviews || [];
    },
  });

  // reset pagination whenever fresh reviews arrive
  useEffect(() => {
    setVisibleCount(1);
  }, [reviews]);

  // Accept application
  const acceptMutation = useMutation({
    mutationFn: async () => {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Authentication required');

      const res = await fetch(`${apiBase}/api/errands/application/${applicationId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          errand_id: errandId,
          runner_id: runnerId,
          client_id: user.id,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to accept application');
      }

      return await res.json();
    },
    onSuccess: () => {
      showSuccess('Runner accepted!');
      queryClient.invalidateQueries({ queryKey: ['applications', errandId] });
      queryClient.invalidateQueries({ queryKey: ['errand', errandId] });
      queryClient.invalidateQueries({ queryKey: ['client-errands'] });
      setTimeout(() => {
        navigate('/client/errands');
      }, 1000);
    },
  });

  const handleAccept = () => {
    if (window.confirm('Accept this runner for the errand?')) {
      acceptMutation.mutate();
    }
  };

  // Direct hire mutation
  const directHireMutation = useMutation({
    mutationFn: async () => {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Authentication required');

      const res = await fetch(`${apiBase}/api/errands/direct-hire`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          client_id: user.id,
          runner_id: runnerId,
          service_id: selectedService.id,
          title: directHireForm.title.trim() || selectedService.title,
          description: directHireForm.description.trim() || selectedService.description,
          location: directHireForm.location.trim(),
          price: selectedService.price,
          proposed_price: Number(directHireForm.proposed_price) || selectedService.price,
          is_hourly: !!(selectedService.pricing_type === 'hourly' || selectedService.is_hourly),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create direct hire request');
      }

      return await res.json();
    },
    onSuccess: (data) => {
      showSuccess('Direct hire request sent! Runner will review and accept or reject.');
      setShowDirectHireModal(false);
      setSelectedService(null);
      setDirectHireForm({ title: '', description: '', location: '', proposed_price: '' });
      setTimeout(() => {
        navigate('/client/errands');
      }, 1000);
    },
    onError: (err) => {
      showError('direct-hire', err);
    },
  });

  const handleDirectHire = (service) => {
    setSelectedService(service);
    setDirectHireForm({
      title: service.title,
      description: service.description,
      location: '',
      proposed_price: service.price || ''
    });
    setShowDirectHireModal(true);
  };

  const handleSendDirectHire = () => {
    if (!directHireForm.location.trim()) {
      showError('validation', 'Please provide a location for the errand');
      return;
    }

    if (window.confirm(`Hire ${runner.first_name} for ₦${Number(selectedService.price).toLocaleString()}?`)) {
      directHireMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <ThemedView style={{ minHeight: '100vh', padding: '40px' }}>
        <div style={{ textAlign: 'center' }}>
          <ThemedText>Loading runner...</ThemedText>
        </div>
      </ThemedView>
    );
  }

  if (!runner) {
    return (
      <ThemedView style={{ minHeight: '100vh', padding: '40px' }}>
        <div style={{ textAlign: 'center' }}>
          <ThemedText style={{ color: Colors.warning }}>Runner not found</ThemedText>
        </div>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={{ minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      <div style={{ marginBottom: '16px' }}>
        <BrandLogo width={140} height={36} />
      </div>
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: Colors.primary,
          marginBottom: '20px',
          fontSize: '16px',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        <FiArrowLeft size={16} /> Back
      </button>

      {/* Avatar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
        <Avatar
          url={runner.avatar_url}
          size={80}
          kycVerified={runner.kyc_verified}
        />
      </div>

      {/* Name & Rating */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <ThemedText
            title
            style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px', display: 'block' }}
          >
            {runner.first_name} {runner.last_name}
          </ThemedText>
        </div>
        {runner.average_rating > 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><FiStar size={14} fill="currentColor" /> {runner.average_rating.toFixed(1)}</span>
            <ThemedText style={{ fontSize: '14px', opacity: 0.6 }}>
              ({runner.completed_errands || 0} completed)
            </ThemedText>
          </div>
        )}
      </div>

      {/* Contact details are intentionally hidden on profile view */}

      {/* Bio */}
      {runner.bio && (
        <ThemedCard style={{ marginBottom: '24px' }}>
          <ThemedText
            title
            style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', display: 'block' }}
          >
            About
          </ThemedText>
          <ThemedText style={{ fontSize: '14px', lineHeight: '1.6', display: 'block' }}>
            {runner.bio}
          </ThemedText>
        </ThemedCard>
      )}

      {/* Services */}
      {services.length > 0 && (
        <ThemedCard style={{ marginBottom: '24px' }}>
          <ThemedText
            title
            style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', display: 'block' }}
          >
            Services
          </ThemedText>

          <div style={{ display: 'grid', gap: '12px' }}>
            {services.map((service) => (
              <div
                key={service.id}
                style={{
                  padding: '12px',
                  backgroundColor: theme.background,
                  borderRadius: '8px',
                  borderLeft: `3px solid ${Colors.primary}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <ThemedText style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px', display: 'block' }}>
                      {service.title}
                    </ThemedText>
                    <ThemedText style={{ fontSize: '13px', opacity: 0.7, marginBottom: '6px', display: 'block' }}>
                      {service.description}
                    </ThemedText>
                    <ThemedText
                      style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: Colors.primary,
                        display: 'block',
                      }}
                    >
                      ₦{Number(service.price).toLocaleString()}
                    </ThemedText>
                  </div>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleDirectHire(service)}
                  style={{ width: '100%', fontSize: '12px', padding: '8px' }}
                >
                  Hire for This Service
                </Button>
              </div>
            ))}
          </div>
        </ThemedCard>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
        <ThemedCard style={{ textAlign: 'center', padding: '16px' }}>
          <ThemedText style={{ fontSize: '12px', opacity: 0.6, marginBottom: '8px', display: 'block' }}>
            Rating
          </ThemedText>
          <ThemedText
            title
            style={{ fontSize: '24px', fontWeight: 'bold', display: 'block' }}
          >
            {runner.average_rating?.toFixed(1) || '—'}
          </ThemedText>
        </ThemedCard>

        <ThemedCard style={{ textAlign: 'center', padding: '16px' }}>
          <ThemedText style={{ fontSize: '12px', opacity: 0.6, marginBottom: '8px', display: 'block' }}>
            Completed
          </ThemedText>
          <ThemedText
            title
            style={{ fontSize: '24px', fontWeight: 'bold', display: 'block' }}
          >
            {runner.completed_errands || 0}
          </ThemedText>
        </ThemedCard>
      </div>

      {/* Actions */}
      <div style={{ display: 'grid', gap: '12px' }}>
        <Button
          variant="primary"
          onClick={() => canMessage && navigate(`/client/chat/${runner.id}`)}
          disabled={!canMessage}
          style={{ width: '100%' }}
        >
          Contact Runner
        </Button>

        {applicationId && errandId && (
          <Button
            variant="primary"
            onClick={handleAccept}
            disabled={acceptMutation.isPending}
            style={{ width: '100%' }}
          >
            {acceptMutation.isPending ? 'Accepting...' : 'Accept Runner'}
          </Button>
        )}

        <Button
          variant="secondary"
          onClick={() => navigate('/client/home')}
          style={{ width: '100%' }}
        >
          Hire for New Job
        </Button>
      </div>

      {/* Reviews Section */}
      <div style={{ marginTop: '32px' }}>
        <ThemedText
          title
          style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px', display: 'block' }}
        >
          Reviews ({reviews.length})
        </ThemedText>

        {reviewsLoading ? (
          <ThemedText style={{ textAlign: 'center', opacity: 0.6 }}>Loading reviews...</ThemedText>
        ) : reviews.length > 0 ? (
          <>
            <div style={{ display: 'grid', gap: '12px' }}>
              {reviews.slice(0, visibleCount).map((review) => (
                <ThemedCard key={review.id} style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                    {/* ✅ FIX: use first_name + last_name instead of full_name */}
                    <ThemedText style={{ fontSize: '14px', fontWeight: '600', display: 'block' }}>
                      {review.client
                        ? `${review.client.first_name || ''} ${review.client.last_name || ''}`.trim() || 'Anonymous'
                        : 'Anonymous'}
                    </ThemedText>
                    <span style={{ fontSize: '16px' }}>{'⭐'.repeat(review.rating)}</span>
                  </div>
                  {review.errand && (
                    <ThemedText style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
                      Errand: {review.errand.title} • ₦{Number(review.errand.price).toLocaleString()}
                    </ThemedText>
                  )}
                  <ThemedText style={{ fontSize: '13px', opacity: 0.7, marginBottom: '8px', display: 'block' }}>
                    {review.comment}
                  </ThemedText>
                  <ThemedText style={{ fontSize: '12px', opacity: 0.5 }}>
                    {new Date(review.created_at).toLocaleDateString()}
                  </ThemedText>
                </ThemedCard>
              ))}
            </div>
            {visibleCount < reviews.length && (
              <div style={{ textAlign: 'center', marginTop: '12px' }}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setVisibleCount((prev) => Math.min(reviews.length, prev + 3))}
                >
                  Show more
                </Button>
              </div>
            )}
          </>
        ) : (
          <ThemedText style={{ fontSize: '14px', opacity: 0.6, textAlign: 'center' }}>
            No reviews yet
          </ThemedText>
        )}
      </div>

      {/* Direct Hire Modal */}
      {showDirectHireModal && selectedService && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: Colors.warning + '33',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => !directHireMutation.isPending && setShowDirectHireModal(false)}
        >
          <ThemedCard
            style={{
              padding: '24px',
              maxWidth: '600px',
              width: '90%',
              borderRadius: '12px',
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <ThemedText
                title
                style={{
                  fontSize: '18px',
                  fontWeight: '700',
                  display: 'block',
                }}
              >
                Hire Runner
              </ThemedText>
              <button
                onClick={() => !directHireMutation.isPending && setShowDirectHireModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '20px',
                  padding: 0,
                }}
                disabled={directHireMutation.isPending}
              >
                <FiX />
              </button>
            </div>

            <div style={{ display: 'grid', gap: '16px' }}>
              <div style={{ backgroundColor: theme.background, padding: '12px', borderRadius: '8px' }}>
                <ThemedText style={{ fontSize: '12px', opacity: 0.6, marginBottom: '4px', display: 'block' }}>
                  Service
                </ThemedText>
                <ThemedText style={{ fontSize: '14px', fontWeight: '600', display: 'block' }}>
                  {selectedService.title}
                </ThemedText>
                <ThemedText
                  style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: Colors.primary,
                    marginTop: '4px',
                    display: 'block',
                  }}
                >
                  ₦{Number(selectedService.price).toLocaleString()}
                </ThemedText>
              </div>

              <div>
                <ThemedText
                  style={{
                    fontSize: '12px',
                    opacity: 0.6,
                    marginBottom: '6px',
                    display: 'block',
                    fontWeight: '500',
                  }}
                >
                  Errand Location *
                </ThemedText>
                <ThemedTextInput
                  placeholder="e.g., Ikoyi, Lagos"
                  value={directHireForm.location}
                  onChange={(value) => setDirectHireForm({ ...directHireForm, location: value })}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <ThemedText
                  style={{
                    fontSize: '12px',
                    opacity: 0.6,
                    marginBottom: '6px',
                    display: 'block',
                    fontWeight: '500',
                  }}
                >
                  Errand Description 
                </ThemedText>
                <textarea
                  placeholder="Describe the errand: tasks, deliverables, duration, expectations..."
                  value={directHireForm.description}
                  onChange={(e) => setDirectHireForm({ ...directHireForm, description: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: `1px solid ${Colors.muted}`,
                    backgroundColor: theme.background,
                    color: theme.text,
                    fontFamily: 'inherit',
                    fontSize: '14px',
                    minHeight: '120px',
                    resize: 'vertical',
                    overflowY: 'auto',
                  }}
                />
              </div>

              <div style={{ backgroundColor: theme.background, padding: '12px', borderRadius: '8px' }}>
                <ThemedText style={{ fontSize: '12px', opacity: 0.6, marginBottom: '8px', display: 'block' }}>
                  Proposed Price
                </ThemedText>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <ThemedTextInput
                    placeholder="e.g., 5000"
                    value={directHireForm.proposed_price}
                    onChange={(value) => setDirectHireForm({ ...directHireForm, proposed_price: value })}
                    style={{ width: '100%' }}
                    type="number"
                  />
                  {selectedService?.pricing_type === 'hourly' || selectedService?.is_hourly ? (
                    <ThemedText style={{ fontSize: '12px', opacity: 0.7 }}>per hour</ThemedText>
                  ) : null}
                </div>
              </div>

              <div style={{ backgroundColor: theme.background, padding: '12px', borderRadius: '8px' }}>
                <ThemedText style={{ fontSize: '12px', opacity: 0.6, marginBottom: '8px', display: 'block' }}>
                  Runner
                </ThemedText>
                <ThemedText style={{ fontSize: '14px', fontWeight: '600', display: 'block' }}>
                  {runner.first_name} {runner.last_name}
                </ThemedText>
                <ThemedText style={{ fontSize: '13px', opacity: 0.7, display: 'block' }}>
                  {runner.average_rating?.toFixed(1) || 'N/A'} ⭐ • {runner.completed_errands || 0} jobs
                </ThemedText>
              </div>
            </div>

            <ThemedText
              style={{
                fontSize: '12px',
                opacity: 0.6,
                marginTop: '16px',
                display: 'block',
              }}
            >
              Runner will review your request and accept or reject. Once accepted, you'll fund your errand and work together.
            </ThemedText>

            <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: '1fr 1fr', marginTop: '20px' }}>
              <Button
                variant="secondary"
                size="md"
                onClick={() => setShowDirectHireModal(false)}
                disabled={directHireMutation.isPending}
                style={{ width: '100%' }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleSendDirectHire}
                disabled={directHireMutation.isPending}
                style={{ width: '100%' }}
              >
                {directHireMutation.isPending ? 'Sending...' : 'Send Hire Request'}
              </Button>
            </div>
          </ThemedCard>
        </div>
      )}
      </div>
    </ThemedView>
  );
}
