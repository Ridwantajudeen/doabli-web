import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { ThemedView, ThemedText, ThemedCard } from '../../components/ThemedComponents';
import Button from '../../components/Button';
import { FiClock, FiUser, FiCheck, FiX, FiMapPin, FiStar } from 'react-icons/fi';

const STATUS_CONFIG = {
  posted: { color: '#3b82f6', label: 'Posted', icon: <FiClock /> },
  assigned: { color: '#f59e0b', label: 'Assigned', icon: <FiUser /> },
  completed: { color: '#22c55e', label: 'Completed', icon: <FiCheck /> },
  canceled: { color: '#ef4444', label: 'Canceled', icon: <FiX /> },
  disputed: { color: '#ef4444', label: 'Disputed', icon: <FiX /> },
};

export default function ErrandDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme, Colors } = useTheme();
  const { user, profile } = useAuth();
  
  // Dispute modal state
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeDetails, setDisputeDetails] = useState('');
  const [disputeImage, setDisputeImage] = useState(null);
  
  // Defense modal state (runner defense when dispute is open)
  const [showDefenseModal, setShowDefenseModal] = useState(false);
  const [defenseDetails, setDefenseDetails] = useState('');
  const [defenseImage, setDefenseImage] = useState(null);
  
  // Completion image state
  const [completionImage, setCompletionImage] = useState(null);

  // Fetch errand
  const { data: errand, isLoading, error } = useQuery({
    queryKey: ['errand', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('errands')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Fetch escrow status
  const { data: escrow } = useQuery({
    queryKey: ['escrow', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('escrow')
        .select('*')
        .eq('errand_id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch runner if assigned
  const { data: runner } = useQuery({
    queryKey: ['runner', errand?.assigned_to],
    queryFn: async () => {
      if (!errand?.assigned_to) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', errand.assigned_to)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!errand?.assigned_to,
  });

  // Fetch applications if not assigned
  const { data: applications = [] } = useQuery({
    queryKey: ['applications', id],
    queryFn: async () => {
      if (errand?.assigned_to) return [];
      const { data, error } = await supabase
        .from('runner_applications')
        .select('*')
        .eq('errand_id', id)
        .eq('status', 'pending');

      if (error) throw error;

      // Fetch runner profiles for applications
      const runnerIds = data.map((a) => a.runner_id);
      const { data: runnerData } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', runnerIds);

      return data.map((app) => ({
        ...app,
        runner: runnerData?.find((r) => r.user_id === app.runner_id),
      }));
    },
    enabled: !!errand && !errand.assigned_to,
  });

  // Confirm job completion and release payment
  const confirmMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('escrow')
        .update({
          client_status: 'confirmed',
          status: 'released',
          release_at: new Date(),
        })
        .eq('id', escrow.id);

      if (error) throw error;
    },
    onSuccess: () => {
      alert('Job accepted! Payment is now available for withdrawal.');
    },
    onError: (err) => {
      alert('Error: ' + err.message);
    },
  });

  // Raise dispute
  const disputeMutation = useMutation({
    mutationFn: async () => {
      // Convert image to base64 if provided
      let imageBase64 = null;
      if (disputeImage) {
        const reader = new FileReader();
        imageBase64 = await new Promise((resolve) => {
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsDataURL(disputeImage);
        });
      }

      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${apiUrl}/escrow/raise-dispute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || ''}`,
        },
        body: JSON.stringify({
          escrow_id: escrow.id,
          user_id: profile?.id || user.id,
          dispute_details: disputeDetails,
          image_base64: imageBase64,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to raise dispute');
      }

      return await response.json();
    },
    onSuccess: () => {
      alert('Dispute raised successfully. Our support team will review it shortly.');
      setShowDisputeModal(false);
      setDisputeDetails('');
      setDisputeImage(null);
    },
    onError: (err) => {
      alert('Error: ' + err.message);
    },
  });

  // Defend dispute (runner responds to dispute)
  const defendMutation = useMutation({
    mutationFn: async () => {
      let imageBase64 = null;
      if (defenseImage) {
        const reader = new FileReader();
        imageBase64 = await new Promise((resolve) => {
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsDataURL(defenseImage);
        });
      }

      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${apiUrl}/escrow/defend-dispute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || ''}`,
        },
        body: JSON.stringify({
          escrow_id: escrow.id,
          runner_id: runner?.id,
          defense_details: defenseDetails,
          image_base64: imageBase64,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit defense');
      }

      return await response.json();
    },
    onSuccess: () => {
      alert('Defense submitted successfully. Our support team will review both sides.');
      setShowDefenseModal(false);
      setDefenseDetails('');
      setDefenseImage(null);
    },
    onError: (err) => {
      alert('Error: ' + err.message);
    },
  });

  // Submit review
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });
  const reviewMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('reviews')
        .insert([
          {
            escrow_id: escrow.id,
            client_id: profile?.id ?? user.id,
            runner_id: runner?.id,
            rating: reviewData.rating,
            comment: reviewData.comment,
          },
        ]);

      if (error) throw error;

      // Update runner's average rating
      const { data: reviews, error: fetchErr } = await supabase
        .from('reviews')
        .select('rating')
        .eq('runner_id', runner?.id);

      if (!fetchErr && reviews) {
        const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        await supabase
          .from('profiles')
          .update({ average_rating: avgRating })
          .eq('id', runner?.id);
      }
    },
    onSuccess: () => {
      alert('Review submitted!');
      setReviewData({ rating: 5, comment: '' });
    },
    onError: (err) => {
      alert('Error: ' + err.message);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('errands')
        .update({ status: 'canceled' })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      alert('Errand canceled');
      navigate('/client/errands');
    },
  });

  const handleCancel = () => {
    if (window.confirm('Cancel this errand?')) {
      cancelMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <ThemedView style={{ minHeight: '100vh', padding: '40px' }}>
        <div style={{ textAlign: 'center' }}>
          <ThemedText>Loading errand...</ThemedText>
        </div>
      </ThemedView>
    );
  }

  if (error || !errand) {
    return (
      <ThemedView style={{ minHeight: '100vh', padding: '40px' }}>
        <div style={{ textAlign: 'center' }}>
          <ThemedText style={{ color: Colors.warning }}>Errand not found</ThemedText>
          <Button onClick={() => navigate('/client/errands')} style={{ marginTop: '20px' }}>
            Go Back
          </Button>
        </div>
      </ThemedView>
    );
  }

  const config = STATUS_CONFIG[errand.status] || STATUS_CONFIG.posted;
  // Allow cancellation only when the errand is still unassigned ('posted').
  // Once assigned, the cancel button is hidden to prevent client-side cancel.
  const canCancel = errand.status === 'posted';

  return (
    <ThemedView style={{ minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Back Button */}
      <button
        onClick={() => navigate('/client/errands')}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: Colors.primary,
          marginBottom: '20px',
          fontSize: '16px',
          fontWeight: '600',
        }}
      >
        ← Back
      </button>

      {/* Title & Status */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'start', marginBottom: '12px' }}>
          <ThemedText title style={{ fontSize: '32px', fontWeight: 'bold', flex: 1, display: 'block' }}>
            {errand.title}
          </ThemedText>
          <div
            style={{
              backgroundColor: config.color,
              color: 'white',
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              whiteSpace: 'nowrap',
            }}
          >
            {config.icon} {config.label}
          </div>
        </div>
        <ThemedText style={{ fontSize: '14px', opacity: 0.6, display: 'block' }}>
          Posted {new Date(errand.created_at).toLocaleDateString()}
        </ThemedText>
      </div>

      {/* Price */}
      <ThemedCard
        style={{
          backgroundColor: Colors.primary,
          color: 'white',
          padding: '20px',
          marginBottom: '24px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>Payment</div>
        <div style={{ fontSize: '36px', fontWeight: 'bold' }}>
          ₦{errand.price.toLocaleString()}
        </div>
      </ThemedCard>

      {/* Details */}
      <ThemedCard style={{ marginBottom: '24px' }}>
        <ThemedText
          title
          style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', display: 'block' }}
        >
          Details
        </ThemedText>

        <div style={{ marginBottom: '16px' }}>
          <ThemedText style={{ fontSize: '12px', opacity: 0.6, marginBottom: '4px', display: 'block' }}>
            Location
          </ThemedText>
          <ThemedText style={{ fontSize: '16px', fontWeight: '500', display: 'block' }}>
            <span style={{ marginRight: 8, verticalAlign: 'middle' }}><FiMapPin /></span>{errand.location}
          </ThemedText>
        </div>

        <div style={{ borderTop: `1px solid ${theme.uiBackground}`, margin: '16px 0' }} />

        <div>
          <ThemedText style={{ fontSize: '12px', opacity: 0.6, marginBottom: '4px', display: 'block' }}>
            Created
          </ThemedText>
          <ThemedText style={{ fontSize: '16px', fontWeight: '500', display: 'block' }}>
            {new Date(errand.created_at).toLocaleString()}
          </ThemedText>
        </div>
      </ThemedCard>

      {/* Description */}
      <ThemedCard style={{ marginBottom: '24px' }}>
        <ThemedText
          title
          style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', display: 'block' }}
        >
          Description
        </ThemedText>
        <ThemedText style={{ fontSize: '15px', lineHeight: '1.6', display: 'block' }}>
          {errand.description}
        </ThemedText>
      </ThemedCard>

      {/* Assigned Runner */}
      {runner && (
        <ThemedCard style={{ marginBottom: '24px' }}>
          <ThemedText
            title
            style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', display: 'block' }}
          >
            Assigned Runner
          </ThemedText>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'start' }}>
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '30px',
                  backgroundColor: Colors.primary + '20',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
              <FiUser size={32} color={Colors.primary} />
            </div>

            <div style={{ flex: 1 }}>
              <ThemedText
                title
                style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px', display: 'block' }}
              >
                {runner.first_name} {runner.last_name}
              </ThemedText>
              <ThemedText style={{ fontSize: '14px', opacity: 0.7, display: 'block', marginBottom: '4px' }}>
                {runner.email}
              </ThemedText>
              {runner.phone_number && (
                <ThemedText style={{ fontSize: '14px', opacity: 0.7, display: 'block' }}>
                  {runner.phone_number}
                </ThemedText>
              )}
            </div>

            <Button
              onClick={() => navigate(`/client/runner-profile/${runner.user_id}`)}
              variant="secondary"
              size="sm"
            >
              View Profile
            </Button>
          </div>
        </ThemedCard>
      )}

      {/* Applications */}
      {applications.length > 0 && (
        <ThemedCard style={{ marginBottom: '24px' }}>
          <ThemedText
            title
            style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', display: 'block' }}
          >
            Applications ({applications.length})
          </ThemedText>

          <div style={{ display: 'grid', gap: '12px' }}>
            {applications.map((app) => (
              <div
                key={app.id}
                onClick={() =>
                  navigate(`/client/runner-profile/${app.runner?.user_id}?applicationId=${app.id}&errandId=${id}`)
                }
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: theme.background,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme.uiBackground;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = theme.background;
                }}
              >
                <div style={{ display: 'flex', gap: '12px', alignItems: 'start' }}>
                  <div
                    style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '25px',
                      backgroundColor: Colors.primary + '20',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FiUser size={24} color={Colors.primary} />
                  </div>

                  <div style={{ flex: 1 }}>
                    <ThemedText
                      title
                      style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px', display: 'block' }}
                    >
                      {app.runner?.first_name} {app.runner?.last_name}
                    </ThemedText>
                    <div style={{ display: 'flex', gap: '8px', fontSize: '12px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FiStar color="#f59e0b" />{app.runner?.average_rating?.toFixed(1) || 'New'}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FiCheck /> {app.runner?.completed_errands || 0} completed</span>
                    </div>
                  </div>

                  <ThemedText
                    style={{
                      fontSize: '12px',
                      backgroundColor: Colors.primary,
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Pending
                  </ThemedText>
                </div>
              </div>
            ))}
          </div>
        </ThemedCard>
      )}

      {/* Job Completion Section - Show when runner marks job done */}
      {escrow && escrow.runner_status === 'completed' && escrow.client_status === 'pending' && (
        <ThemedCard style={{ marginBottom: '24px', backgroundColor: Colors.primary + '10', borderLeft: `4px solid ${Colors.primary}` }}>
          <ThemedText
            title
            style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', display: 'block', color: Colors.primary }}
          >
            Job Marked as Completed
          </ThemedText>
          <ThemedText style={{ fontSize: '14px', marginBottom: '16px', display: 'block' }}>
            The runner has completed this job. Please review and accept to release payment, or raise a dispute if there are issues.
          </ThemedText>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Button
              variant="primary"
              onClick={() => confirmMutation.mutate()}
              disabled={confirmMutation.isPending}
              style={{ width: '100%' }}
            >
              {confirmMutation.isPending ? 'Processing...' : 'Accept Job & Release Payment'}
            </Button>
            <Button
              variant="warning"
              onClick={() => setShowDisputeModal(true)}
              style={{ width: '100%' }}
            >
              Raise Dispute
            </Button>
          </div>
        </ThemedCard>
      )}

      {/* Runner Defense Section - Show when errand is disputed and user is the runner */}
      {errand?.assigned_to === user?.id && escrow && escrow.status === 'disputed' && !escrow.runner_defense_at && (
        <ThemedCard style={{ marginBottom: '24px', backgroundColor: '#ef444420', borderLeft: `4px solid #ef4444` }}>
          <ThemedText
            title
            style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', display: 'block', color: '#ef4444' }}
          >
            ⚠️ Dispute Raised
          </ThemedText>
          <ThemedText style={{ fontSize: '14px', marginBottom: '16px', display: 'block' }}>
            The client has raised a dispute about your completed work. You can submit a defense with details and optional evidence.
          </ThemedText>
          {escrow.dispute_details && (
            <div style={{ backgroundColor: Colors.background, padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
              <ThemedText style={{ fontSize: '12px', fontWeight: '600', opacity: 0.7, marginBottom: '6px', display: 'block', textTransform: 'uppercase' }}>
                Dispute Reason:
              </ThemedText>
              <ThemedText style={{ fontSize: '13px', display: 'block' }}>
                {escrow.dispute_details}
              </ThemedText>
            </div>
          )}
          <Button
            variant="primary"
            onClick={() => setShowDefenseModal(true)}
            style={{ width: '100%' }}
          >
            Submit Defense
          </Button>
        </ThemedCard>
      )}

      {/* Defense Modal */}
      {showDefenseModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowDefenseModal(false)}
        >
          <ThemedCard
            style={{
              width: '100%',
              maxWidth: '500px',
              padding: '24px',
              position: 'relative',
              cursor: 'default',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowDefenseModal(false)}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                opacity: 0.6,
              }}
            >
              ✕
            </button>

            <ThemedText
              title
              style={{
                fontSize: '22px',
                fontWeight: '700',
                marginBottom: '16px',
                display: 'block',
                color: Colors.primary,
              }}
            >
              Submit Your Defense
            </ThemedText>

            <ThemedText style={{ fontSize: '14px', marginBottom: '16px', opacity: 0.7, display: 'block' }}>
              Explain your side of the story and optionally provide evidence (photos, documents, etc.) to support your position.
            </ThemedText>

            {/* Defense Details */}
            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '600',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  opacity: 0.7,
                  color: Colors.primary,
                }}
              >
                Your Explanation
              </label>
              <textarea
                placeholder="Explain why you believe your work is satisfactory..."
                value={defenseDetails}
                onChange={(e) => setDefenseDetails(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: Colors.background,
                  border: `1px solid ${Colors.secondary}`,
                  borderRadius: '8px',
                  color: Colors.text,
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  minHeight: '120px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Image Upload */}
            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '600',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  opacity: 0.7,
                  color: Colors.primary,
                }}
              >
                Evidence Image (Optional)
              </label>
              <div
                style={{
                  border: `2px dashed ${Colors.primary}`,
                  borderRadius: '8px',
                  padding: '20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  backgroundColor: Colors.primary + '10',
                  transition: 'all 0.2s',
                }}
                onClick={() => document.getElementById('defenseImageInput')?.click()}
              >
                {defenseImage ? (
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: Colors.primary }}>
                      ✓ Image Selected
                    </div>
                    <div style={{ fontSize: '12px', opacity: 0.6 }}>
                      {defenseImage.name}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDefenseImage(null);
                      }}
                      style={{
                        marginTop: '8px',
                        padding: '6px 12px',
                        backgroundColor: Colors.primary,
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      Change Image
                    </button>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
                      📷 Click to upload image
                    </div>
                    <div style={{ fontSize: '12px', opacity: 0.6 }}>
                      or drag and drop
                    </div>
                  </div>
                )}
              </div>
              <input
                id="defenseImageInput"
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setDefenseImage(file);
                  }
                }}
              />
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Button
                variant="ghost"
                onClick={() => setShowDefenseModal(false)}
                style={{ width: '100%' }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => defendMutation.mutate()}
                disabled={defendMutation.isPending || !defenseDetails.trim()}
                style={{ width: '100%' }}
              >
                {defendMutation.isPending ? 'Submitting...' : 'Submit Defense'}
              </Button>
            </div>
          </ThemedCard>
        </div>
      )}

      {/* Review Section - Show after payment is released */}
      {escrow && (escrow.status === 'released' || escrow.status === 'withdrawn') && !escrow.review_submitted && (
        <ThemedCard style={{ marginBottom: '24px' }}>
          <ThemedText
            title
            style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', display: 'block' }}
          >
            Leave a Review
          </ThemedText>
          <ThemedText style={{ fontSize: '14px', opacity: 0.7, marginBottom: '16px', display: 'block' }}>
            Share your experience working with this runner
          </ThemedText>

          <div style={{ marginBottom: '16px' }}>
            <ThemedText style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', display: 'block' }}>
              Rating
            </ThemedText>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setReviewData({ ...reviewData, rating: star })}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '32px',
                    cursor: 'pointer',
                    color: star <= reviewData.rating ? '#f59e0b' : theme.uiBackground,
                    transition: 'all 0.2s ease',
                  }}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <ThemedText style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', display: 'block' }}>
              Comment (optional)
            </ThemedText>
            <textarea
              placeholder="Share details about your experience..."
              value={reviewData.comment}
              onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
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
                minHeight: '100px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <Button
            variant="primary"
            onClick={() => reviewMutation.mutate()}
            disabled={reviewMutation.isPending}
            style={{ width: '100%' }}
          >
            {reviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
          </Button>
        </ThemedCard>
      )}

      {/* Actions */}
      <div style={{ display: 'grid', gap: '12px' }}>
        {runner && (
          <Button
            variant="primary"
            onClick={() => navigate(`/client/chat/${runner.user_id}`)}
            style={{ width: '100%' }}
          >
            Contact Runner
          </Button>
        )}
        {canCancel && (
          <Button
            variant="warning"
            onClick={handleCancel}
            disabled={cancelMutation.isPending}
            style={{ width: '100%' }}
          >
            {cancelMutation.isPending ? 'Canceling...' : 'Cancel Errand'}
          </Button>
        )}
      </div>
      
      {/* Dispute Modal */}
      {showDisputeModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowDisputeModal(false)}
        >
          <ThemedCard
            style={{
              width: '90%',
              maxWidth: '500px',
              maxHeight: '80vh',
              overflowY: 'auto',
              padding: '24px',
              borderRadius: '12px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <ThemedText
              title
              style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px', display: 'block' }}
            >
              Raise a Dispute
            </ThemedText>
            <ThemedText style={{ fontSize: '14px', opacity: 0.7, marginBottom: '20px', display: 'block' }}>
              Please provide details about the issue and optionally upload an image for reference.
            </ThemedText>

            <div style={{ marginBottom: '16px' }}>
              <ThemedText style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', display: 'block' }}>
                Dispute Details
              </ThemedText>
              <textarea
                placeholder="Describe the issue in detail..."
                value={disputeDetails}
                onChange={(e) => setDisputeDetails(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: Colors.background,
                  border: `1px solid ${Colors.secondary}`,
                  borderRadius: '8px',
                  color: Colors.text,
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  minHeight: '120px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <ThemedText style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', display: 'block' }}>
                Attach Image (Optional)
              </ThemedText>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setDisputeImage(e.target.files?.[0] || null)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: Colors.background,
                  border: `1px solid ${Colors.secondary}`,
                  borderRadius: '8px',
                  color: Colors.text,
                  fontSize: '14px',
                  cursor: 'pointer',
                  boxSizing: 'border-box',
                }}
              />
              {disputeImage && (
                <ThemedText style={{ fontSize: '12px', marginTop: '8px', color: Colors.primary }}>
                  ✓ {disputeImage.name} selected
                </ThemedText>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowDisputeModal(false);
                  setDisputeDetails('');
                  setDisputeImage(null);
                }}
                style={{ width: '100%' }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => disputeMutation.mutate()}
                disabled={disputeMutation.isPending || !disputeDetails.trim()}
                style={{ width: '100%' }}
              >
                {disputeMutation.isPending ? 'Submitting...' : 'Submit Dispute'}
              </Button>
            </div>
          </ThemedCard>
        </div>
      )}
      </div>
    </ThemedView>
  );
}