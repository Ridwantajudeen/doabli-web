//errand details page - shows all details about a specific errand, including status, assigned runner, applications, and allows actions like confirming completion, raising disputes, and leaving reviews.

import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { showError, showSuccess } from '../../lib/notify';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { ThemedView, ThemedText, ThemedCard } from '../../components/ThemedComponents';
import Button from '../../components/Button';
import { FiClock, FiUser, FiCheck, FiX, FiMapPin, FiStar, FiArrowLeft, FiAlertTriangle, FiCamera } from 'react-icons/fi';
import Avatar from '../../components/Avatar';
import { fetchMessagingAccess, fetchViewerContactAccess, updateOwnerContactShare } from '../../lib/contactAccess';
import { getApiBase } from '../../lib/apiBase';

// ✅ CHANGE 1: Added 'offered' and 'pending_funding' so the badge shows correct labels
const STATUS_CONFIG = {
  posted:          { color: '#3b82f6', label: 'Posted',           icon: <FiClock /> },
  offered:         { color: '#a855f7', label: 'Offer Sent',       icon: <FiClock /> },
  pending_funding: { color: '#f59e0b', label: 'Awaiting Payment', icon: <FiClock /> },
  assigned:        { color: '#f59e0b', label: 'Assigned',         icon: <FiUser />  },
  completed:       { color: '#22c55e', label: 'Completed',        icon: <FiCheck /> },
  canceled:        { color: '#ef4444', label: 'Canceled',         icon: <FiX />     },
  disputed:        { color: '#ef4444', label: 'Disputed',         icon: <FiX />     },
};

const formatStatusLabel = (status) => {
  if (!status) return 'Unknown';
  const overrides = {
    pending_payment: 'Pending Payment',
  };
  if (overrides[status]) return overrides[status];
  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export default function ErrandDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme, Colors } = useTheme();
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const apiBase = getApiBase();
  
  // Dispute modal state
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeDetails, setDisputeDetails] = useState('');
  const [disputeImage, setDisputeImage] = useState(null);
  const [disputeSubmitAttempted, setDisputeSubmitAttempted] = useState(false);
  
  // Defense modal state (runner defense when dispute is open)
  const [showDefenseModal, setShowDefenseModal] = useState(false);
  const [defenseDetails, setDefenseDetails] = useState('');
  const [defenseImage, setDefenseImage] = useState(null);
  const [defenseSubmitAttempted, setDefenseSubmitAttempted] = useState(false);
  
  // Completion image state
  const [completionImage, setCompletionImage] = useState(null);

  // Counteroffer state (client can edit proposed price to respond to runner)
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [counterofferPrice, setCounterofferPrice] = useState('');

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

  const { data: escrowImages } = useQuery({
    queryKey: ['escrow-images', escrow?.id],
    queryFn: async () => {
      if (!escrow?.id) return null;
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Authentication required');
      const res = await fetch(`${apiUrl}/api/escrow/${escrow.id}/images`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to load escrow images');
      return data;
    },
    enabled: !!escrow?.id,
  });

  const disputeImageUrl = escrowImages?.dispute_image_signed_url || escrowImages?.dispute_image_url || escrow?.dispute_image_url || null;
  const defenseImageUrl = escrowImages?.runner_defense_image_signed_url || escrowImages?.runner_defense_image_url || escrow?.runner_defense_image_url || null;

  // Fetch runner if assigned
  const { data: runner } = useQuery({
    queryKey: ['runner', errand?.assigned_to],
    queryFn: async () => {
      if (!errand?.assigned_to) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', errand.assigned_to)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!errand?.assigned_to && !!errand?.status && !['posted', 'pending_payment'].includes(errand.status),
  });

  const { data: messagingAccess } = useQuery({
    queryKey: ['message-access', user?.id, runner?.id],
    queryFn: async () => fetchMessagingAccess(supabase, user?.id, runner?.id, errand?.id),
    enabled: !!user?.id && !!runner?.id && !!errand?.id,
  });

  const { data: clientShareToRunner, refetch: refetchClientShare } = useQuery({
    queryKey: ['contact-share-client-to-runner', user?.id, runner?.id, id],
    queryFn: async () => fetchViewerContactAccess(user?.id, runner?.id, id),
    enabled: !!runner?.id && !!user?.id && !!id,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 5000,
  });

  const { data: runnerShareToClient } = useQuery({
    queryKey: ['contact-share-runner-to-client', runner?.id, user?.id, id],
    queryFn: async () => fetchViewerContactAccess(runner?.id, user?.id, id),
    enabled: !!runner?.id && !!user?.id && !!id,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 5000,
  });

  const shareContactMutation = useMutation({
    mutationFn: async ({ shareEmail, sharePhone }) =>
      updateOwnerContactShare({
        ownerId: user?.id,
        viewerId: runner?.id,
        errandId: id,
        shareEmail,
        sharePhone,
      }),
    onSuccess: async () => {
      await refetchClientShare();
      showSuccess('Contact sharing updated.');
    },
    onError: (err) => showError('contact-sharing', err),
  });

  const canOwnerManageShare = !!clientShareToRunner?.can_owner_manage;
  const canViewRunnerEmail = !!runnerShareToClient?.can_view_email;
  const canViewRunnerPhone = !!runnerShareToClient?.can_view_phone;
  const canMessage = !!messagingAccess?.canMessage;

  // Fetch applications if not assigned
  const { data: applications = [] } = useQuery({
    queryKey: ['applications', id],
    queryFn: async () => {
      if (!errand || errand.status !== 'posted') return [];
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
        .in('id', runnerIds);

      return data.map((app) => ({
        ...app,
        runner: runnerData?.find((r) => r.id === app.runner_id),
      }));
    },
    enabled: !!errand && errand.status === 'posted',
  });

  // Fetch runner_application for direct-hire (to check if runner accepted)
  const { data: directHireApp } = useQuery({
    queryKey: ['directHireApp', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('runner_applications')
        .select('*')
        .eq('errand_id', id)
        .neq('status', 'pending')
        .limit(1)
        .single();

      if (error) return null;
      return data;
    },
    enabled: !!id,
  });

  // Confirm job completion and release payment
  const confirmMutation = useMutation({
    mutationFn: async () => {
      const apiUrl = apiBase;
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) throw new Error('Authentication required');
      const response = await fetch(`${apiUrl}/api/escrow/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ escrow_id: escrow.id, user_id: profile?.id || user.id }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to confirm escrow');
      }

      return await response.json();
    },
    onSuccess: () => {
      showSuccess('Job accepted! Payment is now available for withdrawal.');
      queryClient.invalidateQueries({ queryKey: ['errand', id] });
      queryClient.invalidateQueries({ queryKey: ['escrow', id] });
      queryClient.invalidateQueries({ queryKey: ['client-errands'] });
    },
    onError: (err) => {
      showError('generic', err);
    },
  });

  // Raise dispute
  const disputeMutation = useMutation({
    mutationFn: async () => {
      let imageBase64 = null;
      if (disputeImage) {
        const reader = new FileReader();
        imageBase64 = await new Promise((resolve) => {
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsDataURL(disputeImage);
        });
      }

      const apiUrl = apiBase;
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) throw new Error('Authentication required');
      const response = await fetch(`${apiUrl}/api/escrow/raise-dispute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
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
      showSuccess('Dispute raised successfully. Our support team will review it shortly.');
      setShowDisputeModal(false);
      setDisputeDetails('');
      setDisputeImage(null);
      queryClient.invalidateQueries({ queryKey: ['errand', id] });
      queryClient.invalidateQueries({ queryKey: ['escrow', id] });
    },
    onError: (err) => {
      showError('generic', err);
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

      const apiUrl = apiBase;
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) throw new Error('Authentication required');
      const response = await fetch(`${apiUrl}/api/escrow/defend-dispute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          escrow_id: escrow.id,
          user_id: profile?.id || user.id,
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
      showSuccess('Defense submitted successfully. Our support team will review both sides.');
      setShowDefenseModal(false);
      setDefenseDetails('');
      setDefenseImage(null);
      queryClient.invalidateQueries({ queryKey: ['errand', id] });
      queryClient.invalidateQueries({ queryKey: ['escrow', id] });
    },
    onError: (err) => {
      showError('generic', err);
    },
  });

  // Submit review
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });
  const [reviewSubmitAttempted, setReviewSubmitAttempted] = useState(false);
  const reviewMutation = useMutation({
    mutationFn: async () => {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) throw new Error('Authentication required');

      const response = await fetch(`${apiBase}/review/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          escrow_id: escrow.id,
          client_id: profile?.id ?? user.id,
          rating: reviewData.rating,
          comment: reviewData.comment,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to submit review');
      }

      return await response.json();
    },
    onSuccess: () => {
      showSuccess('Review submitted!');
      setReviewData({ rating: 5, comment: '' });
      queryClient.invalidateQueries({ queryKey: ['errand', id] });
      queryClient.invalidateQueries({ queryKey: ['escrow', id] });
      queryClient.invalidateQueries({ queryKey: ['runner', errand?.assigned_to] });
    },
    onError: (err) => {
      showError('generic', err);
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
      showSuccess('Errand canceled');
      navigate('/client/errands');
    },
  });

  const handleCancel = () => {
    if (window.confirm('Cancel this errand?')) {
      cancelMutation.mutate();
    }
  };

  // Counteroffer mutation
  const counterofferMutation = useMutation({
    mutationFn: async () => {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) throw new Error('Authentication required');
      const price = Number(counterofferPrice);

      if (!price || price <= 0) {
        throw new Error('Please enter a valid price');
      }

      const res = await fetch(`${apiBase}/api/errands/${id}/propose-price`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: profile?.id || user.id,
          proposed_price: price,
          note: 'Updated offer',
          receiver_id: errand.assigned_to,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to send counteroffer');
      }

      return await res.json();
    },
    onSuccess: () => {
      showSuccess('Price offer updated! Runner will see the update in chat.');
      setIsEditingPrice(false);
      setCounterofferPrice('');
      queryClient.invalidateQueries({ queryKey: ['errand', id] });
    },
    onError: (err) => {
      showError('counteroffer', err);
    },
  });

  // Fund errand mutation.
  // Opens Paystack inline directly (no server-side Paystack init) — same pattern
  // as the working createErrand flow. After payment succeeds, calls /verify on the
  // backend which updates escrow, errand, and runner_applications.
  const fundMutation = useMutation({
    mutationFn: async () => {
      if (!escrow?.id || !escrow?.amount) {
        throw new Error('Escrow data not loaded yet — please try again');
      }

      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) throw new Error('Authentication required');

      // Ensure Paystack inline script is loaded
      if (!window.PaystackPop) {
        const script = document.createElement('script');
        script.src = 'https://js.paystack.co/v1/inline.js';
        script.async = true;
        document.body.appendChild(script);
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = () => reject(new Error('Failed to load Paystack'));
        });
      }

      const payKey = import.meta.env.VITE_PAYSTACK_KEY;
      if (!payKey) throw new Error('VITE_PAYSTACK_KEY is not set');

      return new Promise((resolve, reject) => {
        const handler = window.PaystackPop.setup({
          key: payKey,
          email: user?.email || profile?.email,
          amount: Math.round(escrow.amount * 100), // naira → kobo
          currency: 'NGN',

          callback: function (response) {
            // Payment completed — verify with backend using Paystack's reference.
            // Backend's resolveMetadata will recover escrow_id from our DB since
            // Paystack won't have our metadata (we didn't pre-initialize with it).
            const paystackRef = response.reference;
            console.log('[Paystack callback] Payment complete, ref:', paystackRef);

            // Tell backend: "this Paystack reference belongs to this escrow"
            fetch(`${apiBase}/api/pay/verify/${encodeURIComponent(paystackRef)}?escrow_id=${escrow.id}&errand_id=${id}&type=direct_hire_funding`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            })
              .then(async (verifyRes) => {
                const verifyData = await verifyRes.json().catch(() => ({}));
                if (verifyRes.ok && verifyData.success) {
                  showSuccess('Payment verified! Errand is now assigned.');
                  queryClient.invalidateQueries({ queryKey: ['escrow', id] });
                  queryClient.invalidateQueries({ queryKey: ['errand', id] });
                  queryClient.invalidateQueries({ queryKey: ['directHireApp', id] });
                  queryClient.invalidateQueries({ queryKey: ['runner', errand?.assigned_to] });
                  queryClient.invalidateQueries({ queryKey: ['client-errands'] });
                  resolve(verifyData);
                } else {
                  console.error('[Paystack callback] verify failed:', verifyData);
                  showError('generic', verifyData?.error || 'Verification failed — please refresh the page.');
                  reject(new Error(verifyData?.error || 'Verification failed'));
                }
              })
              .catch((err) => {
                console.error('[Paystack callback] network error:', err);
                showError('generic', 'Verification error — please refresh to see your status.');
                reject(err);
              });
          },

          onClose: function () {
            console.log('[Paystack] Modal closed by user');
            resolve(null); // not an error — user just closed
          },
        });

        if (handler) {
          handler.openIframe();
        } else {
          reject(new Error('Paystack failed to initialize'));
        }
      });
    },
    onError: (err) => {
      console.error('[fundMutation] Error:', err);
      showError('funding', err?.message || 'Failed to initiate payment');
    },
  });

  // Poll for status update after returning from Paystack redirect (fallback for redirect flow)
  useEffect(() => {
    if (!id) return;

    const returnErrandId = sessionStorage.getItem('paystack_return_errand');
    if (returnErrandId !== id) return;

    const poll = async () => {
      console.log('[poll] Refetching errand/escrow after Paystack redirect return');
      await queryClient.invalidateQueries({ queryKey: ['escrow', id] });
      await queryClient.invalidateQueries({ queryKey: ['errand', id] });
      await queryClient.invalidateQueries({ queryKey: ['directHireApp', id] });
      sessionStorage.removeItem('paystack_return_errand');
    };

    const timer = setTimeout(poll, 1500);
    return () => clearTimeout(timer);
  }, [id]);

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
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        <FiArrowLeft size={16} /> Back
      </button>

      {/* Title & Status */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'start', marginBottom: '8px' }}>
          <ThemedText
            title
            style={{ fontSize: '32px', fontWeight: 'bold', flex: 1, display: 'block' }}
          >
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
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {config.icon} {config.label}
          </div>
        </div>
        <ThemedText style={{ fontSize: '14px', opacity: 0.6, display: 'block' }}>
          Posted {new Date(errand.created_at).toLocaleDateString()}
        </ThemedText>
      </div>

      {/* Price & Negotiation */}
      <ThemedCard
        style={{
          backgroundColor: Colors.primary,
          color: 'white',
          padding: '20px',
          marginBottom: '24px',
        }}
      >
        <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>
          {errand.proposed_price && errand.proposed_price !== errand.price ? 'Negotiated Price' : 'Payment'}
        </div>
        <div style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '12px' }}>
          ₦{(errand.proposed_price || errand.price).toLocaleString()}
          {errand.is_hourly && <span style={{ fontSize: '20px' }}>/hr</span>}
        </div>
        {errand.proposed_price && errand.proposed_price !== errand.price && (
          <div style={{ fontSize: '12px', opacity: 0.8, borderTop: '1px solid rgba(255,255,255,0.3)', paddingTop: '8px' }}>
            Base price: ₦{errand.price.toLocaleString()}
          </div>
        )}
      </ThemedCard>

      {/* Payment Details */}
      {escrow && (
        <ThemedCard style={{ marginBottom: '24px' }}>
          <ThemedText
            title
            style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', display: 'block' }}
          >
            Payment Details
          </ThemedText>
          <div style={{ marginBottom: '12px' }}>
            <ThemedText style={{ fontSize: '12px', opacity: 0.6, marginBottom: '4px', display: 'block' }}>
              Status
            </ThemedText>
            <ThemedText style={{ fontSize: '14px', fontWeight: '600', display: 'block' }}>
              {formatStatusLabel(escrow.status)}
            </ThemedText>
          </div>
          <div style={{ marginBottom: '8px' }}>
            <ThemedText style={{ fontSize: '12px', opacity: 0.6, marginBottom: '4px', display: 'block' }}>
              Payment ID
            </ThemedText>
            <ThemedText style={{ fontSize: '12px', fontFamily: 'monospace', opacity: 0.8, display: 'block' }}>
              {escrow.payment_reference || '—'}
            </ThemedText>
          </div>
          <ThemedText style={{ fontSize: '12px', opacity: 0.6, display: 'block' }}>
            Share this ID with support if you have any payment issues.
          </ThemedText>
        </ThemedCard>
      )}

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
            Errand ID
          </ThemedText>
          <ThemedText style={{ fontSize: '13px', fontFamily: 'monospace', opacity: 0.8, display: 'block' }}>
            {errand.id}
          </ThemedText>
        </div>

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
              <Avatar
                url={runner?.avatar_url}
                size={60}
                kycVerified={runner?.kyc_verified}
              />

            <div style={{ flex: 1 }}>
              <ThemedText
                title
                style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px', display: 'block' }}
              >
                {runner.first_name} {runner.last_name}
              </ThemedText>
              {canViewRunnerEmail && (
                <ThemedText style={{ fontSize: '14px', opacity: 0.7, display: 'block', marginBottom: '4px' }}>
                  {runner.email}
                </ThemedText>
              )}
              {canViewRunnerPhone && (
                <ThemedText style={{ fontSize: '14px', opacity: 0.7, display: 'block' }}>
                  {runner.phone_number || 'Not provided'}
                </ThemedText>
              )}
              {!canViewRunnerEmail && !canViewRunnerPhone && (
                <ThemedText style={{ fontSize: '12px', opacity: 0.6, display: 'block' }}>
                  Runner has not shared contact details yet.
                </ThemedText>
              )}
            </div>

            <Button
              onClick={() => navigate(`/client/runner-profile/${runner.id}`)}
              variant="secondary"
              size="sm"
            >
              View Profile
            </Button>
          </div>
        </ThemedCard>
      )}

      {/* Price Negotiation - Client can edit/counter the price */}
      {runner && errand.status === 'offered' && (!directHireApp || directHireApp.status === 'pending') && (
        <ThemedCard style={{ marginBottom: '24px', backgroundColor: Colors.primary + '10', borderLeft: `4px solid ${Colors.primary}` }}>
          <ThemedText
            title
            style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', display: 'block', color: Colors.primary }}
          >
            Price Negotiation
          </ThemedText>
          <ThemedText style={{ fontSize: '14px', marginBottom: '16px', opacity: 0.8, display: 'block' }}>
            Current offer: ₦{(errand.proposed_price || errand.price).toLocaleString()}
            {errand.is_hourly ? '/hr' : ''}
          </ThemedText>

          {!isEditingPrice ? (
            <Button
              variant="secondary"
              onClick={() => {
                setIsEditingPrice(true);
                setCounterofferPrice(String(errand.proposed_price || errand.price));
              }}
              style={{ width: '100%' }}
            >
              Edit Price Offer
            </Button>
          ) : (
            <div>
              <input
                type="number"
                value={counterofferPrice}
                onChange={(e) => setCounterofferPrice(e.target.value)}
                placeholder="Enter new price"
                step="0.01"
                min="0"
                style={{
                  width: '100%',
                  padding: '12px',
                  marginBottom: '12px',
                  border: `1px solid ${theme.uiBackground}`,
                  borderRadius: '6px',
                  backgroundColor: Colors.background,
                  color: Colors.text,
                  fontSize: '16px',
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <Button
                  variant="primary"
                  onClick={() => counterofferMutation.mutate()}
                  disabled={counterofferMutation.isPending}
                  style={{ width: '100%' }}
                >
                  {counterofferMutation.isPending ? 'Sending...' : 'Send Offer'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setIsEditingPrice(false);
                    setCounterofferPrice('');
                  }}
                  disabled={counterofferMutation.isPending}
                  style={{ width: '100%' }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </ThemedCard>
      )}

      {/* Fund Errand - Show when runner has accepted and escrow is pending payment */}
      {directHireApp && directHireApp.status === 'accepted_pending_funding' && escrow?.status === 'pending_payment' && (
        <ThemedCard style={{ marginBottom: '24px', backgroundColor: '#22c55e20', borderLeft: `4px solid #22c55e` }}>
          <ThemedText
            title
            style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', display: 'block', color: '#22c55e' }}
          >
            ✓ Runner Accepted!
          </ThemedText>
          <ThemedText style={{ fontSize: '14px', marginBottom: '16px', opacity: 0.8, display: 'block' }}>
            Great! {runner?.first_name} has accepted your offer. Now fund the errand to confirm the booking.
          </ThemedText>
          <div style={{ marginBottom: '16px', backgroundColor: Colors.background, padding: '12px', borderRadius: '8px' }}>
            <ThemedText style={{ fontSize: '12px', opacity: 0.7, marginBottom: '4px', display: 'block' }}>
              Amount to fund:
            </ThemedText>
            <ThemedText style={{ fontSize: '24px', fontWeight: '600', color: '#22c55e', display: 'block' }}>
              ₦{escrow?.amount?.toLocaleString()}
              {errand.is_hourly ? '/hr' : ''}
            </ThemedText>
          </div>
          <Button
            variant="primary"
            onClick={() => fundMutation.mutate()}
            disabled={fundMutation.isPending}
            style={{ width: '100%', backgroundColor: '#22c55e' }}
          >
            {fundMutation.isPending ? 'Processing...' : 'Fund Errand Now'}
          </Button>
        </ThemedCard>
      )}

      {/* Payment Pending Verification - show after Paystack redirect returns but verify not yet done */}
      {escrow?.status === 'pending_payment' && errand?.status === 'pending_funding' && !directHireApp && (
        <ThemedCard style={{ marginBottom: '24px', backgroundColor: '#f59e0b20', borderLeft: '4px solid #f59e0b' }}>
          <ThemedText
            title
            style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', display: 'block', color: '#f59e0b' }}
          >
            Payment Pending Verification
          </ThemedText>
          <ThemedText style={{ fontSize: '14px', opacity: 0.8, display: 'block' }}>
            Your payment was submitted and is being verified. This page will update automatically.
          </ThemedText>
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
                  navigate(`/client/runner-profile/${app.runner?.id}?applicationId=${app.id}&errandId=${id}`)
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
                  <Avatar
                    url={app.runner?.avatar_url}
                    size={50}
                    kycVerified={app.runner?.kyc_verified}
                  />

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

      {/* Dispute Resolved in Client's Favor */}
      {escrow && escrow.status === 'refunded' && escrow.dispute_resolved_at && (
        <ThemedCard style={{ marginBottom: '24px', backgroundColor: '#22c55e20', borderLeft: `4px solid #22c55e` }}>
          <ThemedText
            title
            style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', display: 'block', color: '#22c55e' }}
          >
            ✓ Dispute Resolved
          </ThemedText>
          <ThemedText style={{ fontSize: '14px', marginBottom: '16px', display: 'block' }}>
            Your dispute has been reviewed and resolved in your favor. The errand has been reopened and is available for other runners to apply.
          </ThemedText>
          {escrow.admin_notes && (
            <div style={{ backgroundColor: Colors.background, padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
              <ThemedText style={{ fontSize: '12px', fontWeight: '600', opacity: 0.7, marginBottom: '6px', display: 'block', textTransform: 'uppercase' }}>
                Admin Resolution Notes:
              </ThemedText>
              <ThemedText style={{ fontSize: '13px', display: 'block' }}>
                {escrow.admin_notes}
              </ThemedText>
            </div>
          )}
        </ThemedCard>
      )}

      {/* Dispute Resolved in Runner's Favor */}
      {escrow && escrow.status === 'released' && escrow.dispute_resolved_at && (
        <ThemedCard style={{ marginBottom: '24px', backgroundColor: '#ef444420', borderLeft: `4px solid #ef4444` }}>
          <ThemedText
            title
            style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', display: 'block', color: '#ef4444' }}
          >
            Dispute Resolved
          </ThemedText>
          <ThemedText style={{ fontSize: '14px', marginBottom: '16px', display: 'block' }}>
            The dispute has been resolved in favor of the runner. Payment has been released.
          </ThemedText>
          {escrow.admin_notes && (
            <div style={{ backgroundColor: Colors.background, padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
              <ThemedText style={{ fontSize: '12px', fontWeight: '600', opacity: 0.7, marginBottom: '6px', display: 'block', textTransform: 'uppercase' }}>
                Admin Resolution Notes:
              </ThemedText>
              <ThemedText style={{ fontSize: '13px', display: 'block' }}>
                {escrow.admin_notes}
              </ThemedText>
            </div>
          )}
        </ThemedCard>
      )}

      {/* Job Completion Section */}
      {escrow && escrow.runner_status === 'completed' && escrow.client_status === 'pending' && !escrow.dispute_resolved_at && escrow.status !== 'refunded' && (
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
              onClick={() => { setDisputeSubmitAttempted(false); setShowDisputeModal(true); }}
              style={{ width: '100%' }}
            >
              Raise Dispute
            </Button>
          </div>
        </ThemedCard>
      )}

      {escrow && (escrow.status === 'disputed' || escrow.dispute_resolved_at) && (
        <ThemedCard style={{ marginBottom: '24px', backgroundColor: '#ef444420', borderLeft: `4px solid #ef4444` }}>
          <ThemedText
            title
            style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', display: 'block', color: '#ef4444' }}
          >
            Dispute Evidence
          </ThemedText>
          <ThemedText style={{ fontSize: '13px', opacity: 0.8, marginBottom: '12px', display: 'block' }}>
            This section shows the images attached to the dispute and the runner's defense (if provided).
          </ThemedText>
          <div style={{ display: 'grid', gap: '12px' }}>
            {disputeImageUrl && (
              <div>
                <ThemedText style={{ fontSize: '12px', fontWeight: '600', marginBottom: '6px', display: 'block' }}>Client Dispute Image</ThemedText>
                <a href={disputeImageUrl} target="_blank" rel="noreferrer" style={{ display: 'block' }}>
                  <img src={disputeImageUrl} alt="dispute evidence" style={{ maxWidth: '100%', maxHeight: '320px', borderRadius: '8px', border: `1px solid ${Colors.border}`, cursor: 'pointer' }} />
                </a>
              </div>
            )}
            {defenseImageUrl && (
              <div>
                <ThemedText style={{ fontSize: '12px', fontWeight: '600', marginBottom: '6px', display: 'block' }}>Runner Defense Image</ThemedText>
                <a href={defenseImageUrl} target="_blank" rel="noreferrer" style={{ display: 'block' }}>
                  <img src={defenseImageUrl} alt="runner defense evidence" style={{ maxWidth: '100%', maxHeight: '260px', borderRadius: '8px', border: `1px solid ${Colors.border}`, cursor: 'pointer' }} />
                </a>
              </div>
            )}
            {!disputeImageUrl && !defenseImageUrl && (
              <ThemedText style={{ fontSize: '13px', opacity: 0.7 }}>No dispute images have been attached yet.</ThemedText>
            )}
          </div>
        </ThemedCard>
      )}

      {/* Runner Defense Section */}
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
          onClick={() => { setDefenseSubmitAttempted(false); setShowDefenseModal(false); }}
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
              onClick={() => { setDefenseSubmitAttempted(false); setShowDefenseModal(false); }}
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
              Explain your side of the story and optionally provide evidence to support your position.
            </ThemedText>

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
                  fontSize: '16px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  minHeight: '120px',
                  boxSizing: 'border-box',
                }}
              />
              <ThemedText
                style={{
                  fontSize: '11px',
                  marginTop: '6px',
                  display: 'block',
                  color:
                    defenseSubmitAttempted &&
                    (defenseDetails.trim().length < 3 || defenseDetails.trim().length > 2000)
                      ? Colors.warning
                      : Colors.text,
                  opacity:
                    defenseSubmitAttempted &&
                    (defenseDetails.trim().length < 3 || defenseDetails.trim().length > 2000)
                      ? 1
                      : 0.6,
                }}
              >
                {defenseDetails.trim().length} / 2000 (min 3)
              </ThemedText>
            </div>

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
                    <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <FiCamera size={16} /> Click to upload image
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
                  if (file) setDefenseImage(file);
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Button
                variant="ghost"
                onClick={() => { setDefenseSubmitAttempted(false); setShowDefenseModal(false); }}
                style={{ width: '100%' }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => { setDefenseSubmitAttempted(true); defendMutation.mutate(); }}
                disabled={defendMutation.isPending || !defenseDetails.trim()}
                style={{ width: '100%' }}
              >
                {defendMutation.isPending ? 'Submitting...' : 'Submit Defense'}
              </Button>
            </div>
          </ThemedCard>
        </div>
      )}

      {/* Review Section */}
      {escrow && ['released', 'withdrawn', 'releasable'].includes(escrow.status) && escrow.client_status === 'confirmed' && !escrow.review_submitted && (
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
            <ThemedText
              style={{
                fontSize: '11px',
                marginTop: '6px',
                display: 'block',
                color:
                  reviewSubmitAttempted &&
                  reviewData.comment.trim().length > 0 &&
                  (reviewData.comment.trim().length < 3 || reviewData.comment.trim().length > 2000)
                    ? Colors.warning
                    : theme.text,
                opacity:
                  reviewSubmitAttempted &&
                  reviewData.comment.trim().length > 0 &&
                  (reviewData.comment.trim().length < 3 || reviewData.comment.trim().length > 2000)
                    ? 1
                    : 0.6,
              }}
            >
              {reviewData.comment.trim().length} / 2000 (min 3)
            </ThemedText>
          </div>

          <Button
            variant="primary"
            onClick={() => { setReviewSubmitAttempted(true); reviewMutation.mutate(); }}
            disabled={reviewMutation.isPending}
            style={{ width: '100%' }}
          >
            {reviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
          </Button>
        </ThemedCard>
      )}

      {/* Actions */}
      <div style={{ display: 'grid', gap: '12px' }}>
        {runner && canOwnerManageShare && (
          <ThemedCard>
            <ThemedText style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px', display: 'block' }}>
              Your contact sharing for this runner
            </ThemedText>
            <div style={{ display: 'grid', gap: '8px' }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  shareContactMutation.mutate({
                    shareEmail: !clientShareToRunner?.can_view_email,
                    sharePhone: !!clientShareToRunner?.can_view_phone,
                  })
                }
                disabled={shareContactMutation.isPending}
              >
                {clientShareToRunner?.can_view_email ? 'Hide my email from runner' : 'Reveal my email to runner'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  shareContactMutation.mutate({
                    shareEmail: !!clientShareToRunner?.can_view_email,
                    sharePhone: !clientShareToRunner?.can_view_phone,
                  })
                }
                disabled={shareContactMutation.isPending}
              >
                {clientShareToRunner?.can_view_phone ? 'Hide my phone from runner' : 'Reveal my phone to runner'}
              </Button>
              <ThemedText style={{ fontSize: '12px', opacity: 0.7, display: 'block' }}>
                Keep communication inside Doabli for security and dispute support.
              </ThemedText>
            </div>
          </ThemedCard>
        )}

        {runner && (
          <Button
            variant="primary"
            onClick={() => canMessage && navigate(`/client/chat/${errand.id}/${runner.id}`)}
            disabled={!canMessage}
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
          onClick={() => { setDisputeSubmitAttempted(false); setShowDisputeModal(false); }}
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
              <ThemedText
                style={{
                  fontSize: '11px',
                  marginTop: '6px',
                  display: 'block',
                  color:
                    disputeSubmitAttempted &&
                    (disputeDetails.trim().length < 3 || disputeDetails.trim().length > 2000)
                      ? Colors.warning
                      : Colors.text,
                  opacity:
                    disputeSubmitAttempted &&
                    (disputeDetails.trim().length < 3 || disputeDetails.trim().length > 2000)
                      ? 1
                      : 0.6,
                }}
              >
                {disputeDetails.trim().length} / 2000 (min 3)
              </ThemedText>
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
                  setDisputeSubmitAttempted(false);
                }}
                style={{ width: '100%' }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => { setDisputeSubmitAttempted(true); disputeMutation.mutate(); }}
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

