import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { showSuccess } from '../../lib/notify';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { ThemedView, ThemedText, ThemedCard } from '../../components/ThemedComponents';
import Button from '../../components/Button';
import { FiEdit, FiX, FiLogOut, FiUser, FiCamera, FiArrowLeft, FiStar } from 'react-icons/fi';

export default function RunnerProfile() {
  const { id: runnerId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const applicationId = searchParams.get('applicationId');
  const errandId = searchParams.get('errandId');
  const { theme, Colors } = useTheme();
  const { user } = useAuth();

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

  // Fetch reviews for runner
  const { data: reviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: ['reviews', runnerId],
    queryFn: async () => {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${apiUrl}/api/review/runner/${runnerId}?page=1&limit=5`);
      if (!response.ok) throw new Error('Failed to fetch reviews');
      const data = await response.json();
      return data.reviews || [];
    },
  });

  // Accept application
  const acceptMutation = useMutation({
    mutationFn: async () => {
      // Update application
      await supabase
        .from('runner_applications')
        .update({ status: 'accepted' })
        .eq('id', applicationId);

      // Update errand with runner's user_id
      await supabase
        .from('errands')
        .update({ assigned_to: runnerId, status: 'assigned' })
        .eq('id', errandId);

      // Update escrow with runner's profile.id (FK constraint)
      await supabase
        .from('escrow')
        .update({ runner_id: runner.id })
        .eq('errand_id', errandId);
    },
    onSuccess: () => {
      showSuccess('Runner accepted!');
      navigate('/client/errands');
    },
  });

  const handleAccept = () => {
    if (window.confirm('Accept this runner for the errand?')) {
      acceptMutation.mutate();
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
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '24px',
        }}
      >
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            backgroundColor: Colors.primary + '20',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: Colors.primary,
          }}
        >
          <FiUser size={40} />
        </div>
      </div>

      {/* Name & Rating */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <ThemedText
          title
          style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px', display: 'block' }}
        >
          {runner.first_name} {runner.last_name}
        </ThemedText>
        {runner.average_rating > 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><FiStar size={14} fill="currentColor" /> {runner.average_rating.toFixed(1)}</span>
            <ThemedText style={{ fontSize: '14px', opacity: 0.6 }}>
              ({runner.completed_errands || 0} completed)
            </ThemedText>
          </div>
        )}
      </div>

      {/* Contact Info */}
      <ThemedCard style={{ marginBottom: '24px' }}>
        <ThemedText
          title
          style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', display: 'block' }}
        >
          Contact Information
        </ThemedText>

        <div style={{ marginBottom: '12px' }}>
          <ThemedText style={{ fontSize: '12px', opacity: 0.6, marginBottom: '4px', display: 'block' }}>
            Email
          </ThemedText>
          <ThemedText style={{ fontSize: '14px', display: 'block' }}>{runner.email}</ThemedText>
        </div>

        <div
          style={{
            height: '1px',
            backgroundColor: theme.uiBackground,
            margin: '12px 0',
          }}
        />

        <div>
          <ThemedText style={{ fontSize: '12px', opacity: 0.6, marginBottom: '4px', display: 'block' }}>
            Phone
          </ThemedText>
          <ThemedText style={{ fontSize: '14px', display: 'block' }}>
            {runner.phone_number || 'Not provided'}
          </ThemedText>
        </div>

        {runner.address && (
          <>
            <div
              style={{
                height: '1px',
                backgroundColor: theme.uiBackground,
                margin: '12px 0',
              }}
            />
            <div>
              <ThemedText style={{ fontSize: '12px', opacity: 0.6, marginBottom: '4px', display: 'block' }}>
                Address
              </ThemedText>
              <ThemedText style={{ fontSize: '14px', display: 'block' }}>{runner.address}</ThemedText>
            </div>
          </>
        )}
      </ThemedCard>

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
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                  <div>
                    <ThemedText style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px', display: 'block' }}>
                      {service.title}
                    </ThemedText>
                    <ThemedText style={{ fontSize: '13px', opacity: 0.7, display: 'block' }}>
                      {service.description}
                    </ThemedText>
                  </div>
                  <ThemedText
                    style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: Colors.primary,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    ₦{Number(service.price).toLocaleString()}
                  </ThemedText>
                </div>
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
          onClick={() => navigate(`/client/chat/${runner.user_id}`)}
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
          <div style={{ display: 'grid', gap: '12px' }}>
            {reviews.map((review) => (
              <ThemedCard key={review.id} style={{ padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                  <ThemedText style={{ fontSize: '14px', fontWeight: '600', display: 'block' }}>
                    {review.client?.full_name || 'Anonymous'}
                  </ThemedText>
                  <span style={{ fontSize: '16px' }}>{'⭐'.repeat(review.rating)}</span>
                </div>
                <ThemedText style={{ fontSize: '13px', opacity: 0.7, marginBottom: '8px', display: 'block' }}>
                  {review.comment}
                </ThemedText>
                <ThemedText style={{ fontSize: '12px', opacity: 0.5 }}>
                  {new Date(review.created_at).toLocaleDateString()}
                </ThemedText>
              </ThemedCard>
            ))}
          </div>
        ) : (
          <ThemedText style={{ fontSize: '14px', opacity: 0.6, textAlign: 'center' }}>
            No reviews yet
          </ThemedText>
        )}
      </div>
      </div>
    </ThemedView>
  );
}