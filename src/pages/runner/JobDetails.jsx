import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { ThemedText, ThemedCard } from '../../components/ThemedComponents';
import Button from '../../components/Button';

export default function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { theme, Colors } = useTheme();
  const { user } = useAuth();
  
  // State for mark done with optional image
  const [showMarkDoneModal, setShowMarkDoneModal] = useState(false);
  const [completionImage, setCompletionImage] = useState(null);

  // Fetch job
  const { data: job, isLoading, error } = useQuery({
    queryKey: ['job', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('errands')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      // Fetch related escrow separately
      const { data: escrowData } = await supabase
        .from('escrow')
        .select('*')
        .eq('errand_id', id)
        .single();

      return { ...data, escrow_id: escrowData?.id, escrow: escrowData };
    },
  });

  // Fetch escrow status (refetches when job changes)
  const { data: escrow } = useQuery({
    queryKey: ['escrow', job?.escrow_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('escrow')
        .select('*')
        .eq('id', job?.escrow_id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!job?.escrow_id,
  });

  // Fetch client info
  const { data: client } = useQuery({
    queryKey: ['client', job?.posted_by],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', job?.posted_by)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!job?.posted_by,
  });

  // Check if already applied
  const { data: existingApp } = useQuery({
    queryKey: ['my-application', id, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('runner_applications')
        .select('*')
        .eq('errand_id', id)
        .eq('runner_id', user?.id)
        .single();

      return data;
    },
    enabled: !!id && !!user,
  });

  // Apply for job
  const applyMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('runner_applications')
        .insert([
          {
            errand_id: id,
            runner_id: user.id,
            status: 'pending',
          },
        ]);

      if (error) throw error;
    },
    onSuccess: () => {
      alert('Application sent!');
      queryClient.invalidateQueries(['my-application', id, user?.id]);
    },
    onError: (err) => {
      alert('Error: ' + err.message);
    },
  });

  // Mark Job as Done (Runner)
  const markDoneMutation = useMutation({
    mutationFn: async () => {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';

      let completionImageBase64 = null;
      if (completionImage) {
        completionImageBase64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(completionImage);
        });
      }

      const res = await fetch(`${apiBase}/escrow/mark-done`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          escrow_id: job?.escrow_id,
          user_id: user?.id,
          completion_image_base64: completionImageBase64,
        }),
      });

      let data = null;
      try {
        data = await res.json();
      } catch (e) {
        console.error('Failed parsing response JSON from mark-done', e);
      }

      console.log('[mark-done] response:', res.status, data);

      if (!res.ok) throw new Error((data && data.error) || 'Failed to mark done');
      return data;
    },
    onSuccess: () => {
      alert('Job marked as done! Waiting for client confirmation.');
      setCompletionImage(null);
      setShowMarkDoneModal(false);
      queryClient.invalidateQueries(['job', id]);
    },
    onError: (err) => {
      alert('Error: ' + err.message);
    },
  });

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <ThemedText>Loading job...</ThemedText>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <ThemedText style={{ color: Colors.warning }}>Job not found</ThemedText>
        <Button onClick={() => navigate('/runner/home')} style={{ marginTop: '20px' }}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '20px' }}>
      {/* Back Button */}
      <button
        onClick={() => navigate('/runner/home')}
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

      {/* Title & Budget */}
      <div style={{ marginBottom: '24px' }}>
        <ThemedText title style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '12px', display: 'block' }}>
          {job.title}
        </ThemedText>
        <div
          style={{
            backgroundColor: Colors.primary,
            color: 'white',
            padding: '16px',
            borderRadius: '8px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '4px' }}>Budget</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
            ₦{job.price.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Details */}
      <ThemedCard style={{ marginBottom: '24px' }}>
        <ThemedText
          title
          style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', display: 'block' }}
        >
          Details
        </ThemedText>

        <div style={{ marginBottom: '12px' }}>
          <ThemedText style={{ fontSize: '12px', opacity: 0.6, marginBottom: '4px', display: 'block' }}>
            Location
          </ThemedText>
          <ThemedText style={{ fontSize: '14px', display: 'block' }}>📍 {job.location}</ThemedText>
        </div>

        <div style={{ borderTop: `1px solid ${theme.uiBackground}`, margin: '12px 0' }} />

        <div>
          <ThemedText style={{ fontSize: '12px', opacity: 0.6, marginBottom: '4px', display: 'block' }}>
            Posted
          </ThemedText>
          <ThemedText style={{ fontSize: '14px', display: 'block' }}>
            {new Date(job.created_at).toLocaleString()}
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
        <ThemedText style={{ fontSize: '14px', lineHeight: '1.6', display: 'block' }}>
          {job.description}
        </ThemedText>
      </ThemedCard>

      {/* Client Info */}
      {client && (
        <ThemedCard style={{ marginBottom: '24px' }}>
          <ThemedText
            title
            style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', display: 'block' }}
          >
            Client
          </ThemedText>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '30px',
                backgroundColor: Colors.primary + '20',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
              }}
            >
              👤
            </div>

            <div>
              <ThemedText
                title
                style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px', display: 'block' }}
              >
                {client.first_name} {client.last_name}
              </ThemedText>
              <ThemedText style={{ fontSize: '13px', opacity: 0.7, display: 'block' }}>
                {client.email}
              </ThemedText>
              {client.phone_number && (
                <ThemedText style={{ fontSize: '13px', opacity: 0.7, display: 'block' }}>
                  {client.phone_number}
                </ThemedText>
              )}
            </div>
          </div>
        </ThemedCard>
      )}

      {/* Escrow Status Card */}
      {escrow && (
        <ThemedCard style={{ marginBottom: '24px', borderLeft: `4px solid ${Colors.primary}` }}>
          <ThemedText
            title
            style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', display: 'block' }}
          >
            Job Status
          </ThemedText>

          {/* Awaiting Client Approval */}
          {escrow.runner_status === 'completed' && escrow.client_status === 'pending' && (
            <div style={{ padding: '12px', backgroundColor: '#f59e0b20', borderRadius: '8px', marginBottom: '12px' }}>
              <ThemedText style={{ color: '#f59e0b', fontWeight: '600', marginBottom: '4px', display: 'block' }}>
                ⏳ Awaiting Client Approval
              </ThemedText>
              <ThemedText style={{ fontSize: '13px', opacity: 0.7, display: 'block' }}>
                Your work has been submitted. The client has 7 days to review and confirm.
              </ThemedText>
            </div>
          )}

          {/* Payment Available for Withdrawal */}
          {(escrow.status === 'released' || escrow.status === 'releasable') && escrow.client_status === 'confirmed' && (
            <div style={{ padding: '12px', backgroundColor: '#22c55e20', borderRadius: '8px', marginBottom: '12px' }}>
              <ThemedText style={{ color: '#22c55e', fontWeight: '600', marginBottom: '4px', display: 'block' }}>
                ✓ Payment Available for Withdrawal
              </ThemedText>
              <ThemedText style={{ fontSize: '13px', opacity: 0.7, display: 'block' }}>
                The client approved your work. You can now withdraw your payment.
              </ThemedText>
              {escrow.release_at && (
                <ThemedText style={{ fontSize: '12px', opacity: 0.6, marginTop: '6px', display: 'block' }}>
                  Available since: {new Date(escrow.release_at).toLocaleDateString()}
                </ThemedText>
              )}
            </div>
          )}

          {/* Dispute Raised */}
          {escrow.status === 'disputed' || escrow.client_status === 'disputed' && (
            <div style={{ padding: '12px', backgroundColor: '#ef444420', borderRadius: '8px', marginBottom: '12px' }}>
              <ThemedText style={{ color: '#ef4444', fontWeight: '600', marginBottom: '4px', display: 'block' }}>
                ⚠️ Dispute Raised
              </ThemedText>
              <ThemedText style={{ fontSize: '13px', opacity: 0.7, display: 'block' }}>
                The client has raised a dispute. Our support team will review and resolve this.
              </ThemedText>
            </div>
          )}
        </ThemedCard>
      )}

      {/* Apply Button */}
      <div style={{ display: 'grid', gap: '12px' }}>
        {existingApp ? (
          <div
            style={{
              padding: '12px',
              backgroundColor: Colors.primary + '20',
              borderRadius: '8px',
              textAlign: 'center',
            }}
          >
            <ThemedText style={{ color: Colors.primary, fontWeight: '600' }}>
              ✓ You already applied ({existingApp.status})
            </ThemedText>
          </div>
        ) : (
          <Button
            variant="primary"
            size="md"
            onClick={() => applyMutation.mutate()}
            disabled={applyMutation.isPending}
            style={{ width: '100%' }}
          >
            {applyMutation.isPending ? 'Applying...' : 'Apply for This Job'}
          </Button>
        )}

        <Button
          variant="ghost"
          onClick={() => navigate('/runner/home')}
          style={{ width: '100%' }}
        >
          Browse More Jobs
        </Button>

        {/* Runner: Mark Job as Done */}
        {existingApp?.status === 'accepted' && (!escrow || escrow.runner_status !== 'completed') && job.escrow_id && (
          <Button
            variant="primary"
            size="md"
            onClick={() => setShowMarkDoneModal(true)}
            style={{ width: '100%' }}
          >
            Mark Job as Done
          </Button>
        )}
      </div>

      {/* Mark Done Modal */}
      {showMarkDoneModal && (
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
          onClick={() => setShowMarkDoneModal(false)}
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
              onClick={() => setShowMarkDoneModal(false)}
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
              Mark Job as Done
            </ThemedText>

            <ThemedText style={{ fontSize: '14px', marginBottom: '16px', opacity: 0.7, display: 'block' }}>
              Confirm that you have completed the job. You can optionally attach an image showing the completed work.
            </ThemedText>

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
                Completion Image (Optional)
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
                onClick={() => document.getElementById('completionImageInput')?.click()}
              >
                {completionImage ? (
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: Colors.primary }}>
                      ✓ Image Selected
                    </div>
                    <div style={{ fontSize: '12px', opacity: 0.6 }}>
                      {completionImage.name}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCompletionImage(null);
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
                id="completionImageInput"
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setCompletionImage(file);
                  }
                }}
              />
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Button
                variant="ghost"
                onClick={() => setShowMarkDoneModal(false)}
                style={{ width: '100%' }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => markDoneMutation.mutate()}
                disabled={markDoneMutation.isPending}
                style={{ width: '100%' }}
              >
                {markDoneMutation.isPending ? 'Submitting...' : 'Submit'}
              </Button>
            </div>
          </ThemedCard>
        </div>
      )}
    </div>
  );
}
