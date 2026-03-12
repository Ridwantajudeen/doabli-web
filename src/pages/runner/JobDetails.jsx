//Errand details on runner side - shows all details about a specific job, including status, client info, and allows actions like applying, marking as done, and withdrawing payment.
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { showError, showSuccess } from '../../lib/notify';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { ThemedView, ThemedText, ThemedCard } from '../../components/ThemedComponents';
import Button from '../../components/Button';
import { FiArrowLeft, FiMapPin, FiClock, FiCheck, FiAlertTriangle, FiX, FiCamera, FiDollarSign, FiUser } from 'react-icons/fi';
import { fetchViewerContactAccess, updateOwnerContactShare } from '../../lib/contactAccess';

export default function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { theme, Colors } = useTheme();
  const { user, profile } = useAuth();
  
  // State for mark done with optional image
  const [showMarkDoneModal, setShowMarkDoneModal] = useState(false);
  const [completionImage, setCompletionImage] = useState(null);

  // ✅ NEW: State for withdrawal flow
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [withdrawalStep, setWithdrawalStep] = useState('confirm'); // 'confirm' or 'processing'
  // Local flag to hide withdraw button after a request is submitted
  const [withdrawalSubmitted, setWithdrawalSubmitted] = useState(false);

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
        .eq('id', job?.posted_by)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!job?.posted_by,
  });

  const { data: clientShareToRunner } = useQuery({
    queryKey: ['contact-share-client-to-runner', client?.id, user?.id, id],
    queryFn: async () => fetchViewerContactAccess(client?.id, user?.id, id),
    enabled: !!user?.id && !!client?.id,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 5000,
  });

  const { data: runnerShareToClient, refetch: refetchRunnerShare } = useQuery({
    queryKey: ['contact-share-runner-to-client', user?.id, client?.id, id],
    queryFn: async () => fetchViewerContactAccess(user?.id, client?.id, id),
    enabled: !!user?.id && !!client?.id && !!id,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 5000,
  });

  const shareContactMutation = useMutation({
    mutationFn: async ({ shareEmail, sharePhone }) =>
      updateOwnerContactShare({
        ownerId: user?.id,
        viewerId: client?.id,
        errandId: id,
        shareEmail,
        sharePhone,
      }),
    onSuccess: async () => {
      await refetchRunnerShare();
      showSuccess('Contact sharing updated.');
    },
    onError: (err) => showError('contact-sharing', err),
  });

  const canOwnerManageShare = !!runnerShareToClient?.can_owner_manage;
  const canViewClientEmail = !!clientShareToRunner?.can_view_email;
  const canViewClientPhone = !!clientShareToRunner?.can_view_phone;

  const isRunnerLastOffer = job?.last_price_updated_by === profile?.id;
  const displayPrice = isRunnerLastOffer ? job?.price : (job?.proposed_price || job?.price);
  const showPendingOffer = isRunnerLastOffer && job?.proposed_price && job?.proposed_price !== job?.price;

  // ✅ NEW: Fetch runner's bank account details
  const { data: bankAccount } = useQuery({
    queryKey: ['runner-bank-account', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('user_id', user?.id)
        .limit(1);

      // Handle the case where no bank account exists (returns empty array)
      if (error) {
        // Only throw if it's a real error, not "no rows found"
        if (error.code !== 'PGRST116') throw error;
        return null;
      }

      // Return first item if exists, otherwise null
      return data?.length > 0 ? data[0] : null;
    },
    enabled: !!user?.id,
  });

  // Check if already applied
  const { data: existingApp } = useQuery({
    queryKey: ['my-application', id, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('runner_applications')
        .select('*')
        .eq('errand_id', id)
        .eq('runner_id', profile?.id)
        .single();

      return data;
    },
    enabled: !!id && !!profile,
  });

  // Apply for job
  const applyMutation = useMutation({
    mutationFn: async () => {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Authentication required');
      
      const res = await fetch(`${apiBase}/api/errands/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          errand_id: id,
          runner_id: profile.id,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to apply');
      }

      return await res.json();
    },
    onSuccess: () => {
      showSuccess('Application sent!');
      queryClient.invalidateQueries({ queryKey: ['my-application', id, profile?.id] });
      queryClient.invalidateQueries({ queryKey: ['runner-applications'] });
    },
    onError: (err) => {
      showError('send-message', err);
    },
  });

  // Mark Job as Done (Runner)
  const markDoneMutation = useMutation({
    mutationFn: async () => {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Authentication required');

      let completionImageBase64 = null;
      if (completionImage) {
        completionImageBase64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(completionImage);
        });
      }

     const res = await fetch(`${apiBase}/api/escrow/mark-done`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
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
      showSuccess('Job marked as done! Waiting for client confirmation.');
      setCompletionImage(null);
      setShowMarkDoneModal(false);
      queryClient.invalidateQueries({ queryKey: ['job', id] });
      queryClient.invalidateQueries({ queryKey: ['escrow', job?.escrow_id] });
      queryClient.invalidateQueries({ queryKey: ['runner-applications'] });
    },
    onError: (err) => {
      showError('generic', err);
    },
  });

  // ✅ NEW: Process Withdrawal Mutation
  const withdrawalMutation = useMutation({
    mutationFn: async () => {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Authentication required');

      // ✅ Send profile_id and user_id for proper identification
      const res = await fetch(`${apiBase}/api/withdrawals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          escrow_id: job?.escrow_id,
          profile_id: profile?.id,
          user_id: user?.id,
        }),
      });

      let data = null;
      try {
        data = await res.json();
      } catch (e) {
        console.error('Failed parsing withdrawal response', e);
      }

      console.log('[withdrawal] response:', res.status, data);

      if (!res.ok) {
        throw new Error((data && data.error) || 'Failed to process withdrawal');
      }

      return data;
    },
    onSuccess: (data) => {
      // If backend queued the withdrawal for admin approval, show appropriate message
      const status = data?.withdrawal?.status || (data && data.status) || 'pending';
      if (status === 'pending') {
        showSuccess('Withdrawal request submitted for admin approval.');
      } else {
        showSuccess('Withdrawal successful! Money will arrive in 1-3 business days.');
      }

      setShowWithdrawalModal(false);
      setWithdrawalStep('confirm');
      // Hide the withdraw button immediately after a successful request
      setWithdrawalSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ['escrow', job?.escrow_id] });
      queryClient.invalidateQueries({ queryKey: ['withdrawal-history', profile?.id] });
    },
    onError: (err) => {
      showError('withdrawal', err);
      setWithdrawalStep('confirm');
      setWithdrawalSubmitted(false);
    },
  });

  // ✅ Helper: Calculate withdrawal details
  const calculateWithdrawalDetails = () => {
    if (!escrow) return null;

    // ✅ FIX: Use the platform_fee already calculated by backend
    // runner_earnings is already NET (fee already deducted)
    const netAmount = Number(escrow.runner_earnings) || 0;
    const platformFee = Number(escrow.platform_fee) || 0;
    const grossAmount = netAmount + platformFee;  // Reconstruct gross for display

    return {
      grossAmount,
      fee: platformFee,  // ✅ Use the fee from escrow, don't recalculate
      netAmount,
    };
  };

  const withdrawalDetails = calculateWithdrawalDetails();

  // ✅ SIMPLIFIED: Check if runner can withdraw
  const canWithdraw = () => {
    if (!escrow) return false;
    if (escrow.status !== 'released' && escrow.status !== 'releasable') return false;
    if (escrow.client_status !== 'confirmed') return false;
    if (escrow.withdrawn_at) return false; // Already withdrawn
    
    // ✅ SIMPLIFIED: Just check if bank account exists and is approved
    if (!bankAccount) return false;
    if (bankAccount.status !== 'approved') return false;
    // ✅ FIX: If status is approved, the verified field is implicit - don't check it separately
    
    // ✅ KYC check moved to BACKEND - frontend just shows button
    // Backend will enforce: KYC required for amounts > 10k
    return true;
  };

  // ✅ DEBUG: Log all withdrawal conditions
  console.log('=== WITHDRAW DEBUG ===');
  console.log('Escrow exists:', !!escrow);
  console.log('Escrow status:', escrow?.status);
  console.log('Client status:', escrow?.client_status);
  console.log('Already withdrawn:', !!escrow?.withdrawn_at);
  console.log('Bank account exists:', !!bankAccount);
  console.log('Bank account data:', bankAccount);
  console.log('Bank account status:', bankAccount?.status);
  console.log('canWithdraw():', canWithdraw());
  console.log('======================');

  // ✅ Helper: Get reason why can't withdraw
  const getWithdrawBlockReason = () => {
    if (!escrow) return null;

    if (escrow.withdrawn_at) {
      return 'Already withdrawn on ' + new Date(escrow.withdrawn_at).toLocaleDateString();
    }

    if (
      (escrow.status === 'pending' || escrow.status === 'funded') &&
      escrow.runner_status === 'completed' &&
      escrow.client_status !== 'confirmed'
    ) {
      return 'Waiting for client to confirm job completion';
    }

    if (escrow.status !== 'released' && escrow.status !== 'releasable') {
      return null;
    }

    if (escrow.client_status !== 'confirmed') {
      return 'Waiting for client approval';
    }

    if (!bankAccount) {
      return 'Add bank account details in your profile';
    }

    if (bankAccount.status !== 'approved') {
      return 'Bank account pending admin approval';
    }

    return null;
  };
  const withdrawBlockReason = getWithdrawBlockReason();

  if (isLoading) {
    return (
      <ThemedView style={{ minHeight: '100vh', padding: '40px' }}>
        <div style={{ textAlign: 'center' }}>
          <ThemedText>Loading job...</ThemedText>
        </div>
      </ThemedView>
    );
  }

  if (error || !job) {
    return (
      <ThemedView style={{ minHeight: '100vh', padding: '40px' }}>
        <div style={{ textAlign: 'center' }}>
          <ThemedText style={{ color: Colors.warning }}>Job not found</ThemedText>
          <Button onClick={() => navigate('/runner/home')} style={{ marginTop: '20px' }}>
            Go Back
          </Button>
        </div>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={{ minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
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
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        <FiArrowLeft size={16} /> Back
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
            ₦{Number(displayPrice || 0).toLocaleString()}
            {job.is_hourly ? <span style={{ fontSize: '14px', marginLeft: '8px' }}>/hr</span> : null}
          </div>
          {showPendingOffer && (
            <div style={{ marginTop: '8px', fontSize: '12px', opacity: 0.9 }}>
              Your counteroffer: ₦{Number(job.proposed_price || 0).toLocaleString()} (awaiting client approval)
            </div>
          )}
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
          <ThemedText style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}><FiMapPin size={14} /> {job.location}</ThemedText>
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

        {/* ✨ Runner Response Section: show on direct hire offered to this runner (only if not accepted yet) */}
        {job.status === 'offered' && job.assigned_to === profile?.id && existingApp?.status === 'pending' && (
          <div style={{ marginTop: '16px' }}>
            <ThemedText title style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', display: 'block' }}>
              Respond to Errand Offer
            </ThemedText>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              <Button
                variant="secondary"
                onClick={async () => {
                  if (!window.confirm('Decline this errand offer?')) return;
                  try {
                    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                    const { data: { session } } = await supabase.auth.getSession();
                    const token = session?.access_token;
                    if (!token) throw new Error('Authentication required');
                    const res = await fetch(`${apiBase}/api/errands/direct-hire/${job.id}/respond`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify({ runner_id: profile.id, action: 'reject' }),
                    });
                    if (!res.ok) {
                      const err = await res.json().catch(() => ({}));
                      throw new Error(err.error || 'Failed to decline');
                    }
                    showSuccess('Offer declined');
                    queryClient.invalidateQueries({ queryKey: ['job', id] });
                    queryClient.invalidateQueries({ queryKey: ['runner-applications'] });
                  } catch (err) {
                    showError('decline', err);
                  }
                }}
              >
                Decline
              </Button>

              <Button
                variant="warning"
                onClick={async () => {
                  const proposed = window.prompt('Enter your counteroffer amount (NGN)', String(job.proposed_price || job.price));
                  if (!proposed) return;
                  const note = window.prompt('Add an optional note for this counteroffer (or leave blank)') || '';
                  try {
                    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                    const { data: { session } } = await supabase.auth.getSession();
                    const token = session?.access_token;
                    if (!token) throw new Error('Authentication required');
                    const res = await fetch(`${apiBase}/api/errands/${job.id}/propose-price`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify({ user_id: profile.id, proposed_price: Number(proposed), note, receiver_id: job.posted_by }),
                    });
                    if (!res.ok) {
                      const err = await res.json().catch(() => ({}));
                      throw new Error(err.error || 'Failed to send counteroffer');
                    }
                    showSuccess('Counteroffer sent');
                    queryClient.invalidateQueries({ queryKey: ['job', id] });
                  } catch (err) {
                    showError('counteroffer', err);
                  }
                }}
              >
                Counteroffer
              </Button>

              <Button
                variant="primary"
                onClick={async () => {
                  if (!window.confirm('Accept this offer? Client will need to fund before assignment.')) return;
                  try {
                    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                    const { data: { session } } = await supabase.auth.getSession();
                    const token = session?.access_token;
                    if (!token) throw new Error('Authentication required');
                    const res = await fetch(`${apiBase}/api/errands/${job.id}/accept-offer`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify({ runner_id: profile.id }),
                    });
                    if (!res.ok) {
                      const err = await res.json().catch(() => ({}));
                      throw new Error(err.error || 'Failed to accept');
                    }
                    showSuccess('Offer accepted — waiting for client funding');
                    queryClient.invalidateQueries({ queryKey: ['job', id] });
                    queryClient.invalidateQueries({ queryKey: ['runner-applications'] });
                  } catch (err) {
                    showError('accept-offer', err);
                  }
                }}
              >
                Accept
              </Button>
            </div>
          </div>
        )}
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
                color: Colors.primary,
              }}
            >
              <FiUser size={24} />
            </div>

            <div>
              <ThemedText
                title
                style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px', display: 'block' }}
              >
                {client.first_name} {client.last_name}
              </ThemedText>
              {canViewClientEmail && (
                <ThemedText style={{ fontSize: '13px', opacity: 0.7, display: 'block' }}>
                  {client.email}
                </ThemedText>
              )}
              {canViewClientPhone && (
                <ThemedText style={{ fontSize: '13px', opacity: 0.7, display: 'block' }}>
                  {client.phone_number || 'Not provided'}
                </ThemedText>
              )}
              {!canViewClientEmail && !canViewClientPhone && (
                <ThemedText style={{ fontSize: '12px', opacity: 0.6, display: 'block' }}>
                  Client has not shared contact details yet.
                </ThemedText>
              )}
            </div>
          </div>
        </ThemedCard>
      )}

      {client && canOwnerManageShare && (
        <ThemedCard style={{ marginBottom: '24px' }}>
          <ThemedText title style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', display: 'block' }}>
            Your contact sharing for this client
          </ThemedText>
          <div style={{ display: 'grid', gap: '8px' }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                shareContactMutation.mutate({
                  shareEmail: !runnerShareToClient?.can_view_email,
                  sharePhone: !!runnerShareToClient?.can_view_phone,
                })
              }
              disabled={shareContactMutation.isPending}
            >
              {runnerShareToClient?.can_view_email ? 'Hide my email from client' : 'Reveal my email to client'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                shareContactMutation.mutate({
                  shareEmail: !!runnerShareToClient?.can_view_email,
                  sharePhone: !runnerShareToClient?.can_view_phone,
                })
              }
              disabled={shareContactMutation.isPending}
            >
              {runnerShareToClient?.can_view_phone ? 'Hide my phone from client' : 'Reveal my phone to client'}
            </Button>
            <ThemedText style={{ fontSize: '12px', opacity: 0.7, display: 'block' }}>
              Keep communication inside Doabli for security and dispute support.
            </ThemedText>
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

          {/* Dispute Resolved in Runner's Favor - Payment Released */}
          {escrow.status === 'released' && escrow.dispute_resolved_at && (
            <div style={{ padding: '12px', backgroundColor: '#22c55e20', borderRadius: '8px', marginBottom: '12px' }}>
              <ThemedText style={{ color: '#22c55e', fontWeight: '600', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FiCheck size={16} /> Dispute Resolved in Your Favor
              </ThemedText>
              <ThemedText style={{ fontSize: '13px', opacity: 0.7, marginBottom: '8px', display: 'block' }}>
                Your dispute has been reviewed and you have been approved by admin. Your payment has been released to your account.
              </ThemedText>
              {withdrawalDetails && (
                <div style={{ marginTop: '12px', padding: '12px', backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: '6px' }}>
                  <ThemedText style={{ fontSize: '13px', marginBottom: '6px', display: 'block' }}>
                    Earnings breakdown:
                  </ThemedText>
                  <div style={{ fontSize: '12px', opacity: 0.8, display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>Gross amount:</span>
                    <span>₦{withdrawalDetails.grossAmount.toLocaleString()}</span>
                  </div>
                  <div style={{ fontSize: '12px', opacity: 0.8, display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>Platform fee (5%):</span>
                    <span>₦{withdrawalDetails.fee.toLocaleString()}</span>
                  </div>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    display: 'flex',
                    justifyContent: 'space-between',
                    paddingTop: '8px',
                    borderTop: '1px solid rgba(0,0,0,0.1)',
                  }}>
                    <span>You will receive:</span>
                    <span>₦{withdrawalDetails.netAmount.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Dispute Resolved Against Runner */}
          {escrow.status === 'refunded' && escrow.dispute_resolved_at && (
            <div style={{ padding: '12px', backgroundColor: '#ef444420', borderRadius: '8px', marginBottom: '12px' }}>
              <ThemedText style={{ color: '#ef4444', fontWeight: '600', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FiX size={16} /> Dispute Resolved
              </ThemedText>
              <ThemedText style={{ fontSize: '13px', opacity: 0.7, display: 'block' }}>
                Your dispute has been reviewed and resolved against you. The errand has been reopened for the client to find another runner.
              </ThemedText>
              {escrow.admin_notes && (
                <div style={{ backgroundColor: Colors.background, padding: '12px', borderRadius: '8px', marginTop: '8px' }}>
                  <ThemedText style={{ fontSize: '12px', fontWeight: '600', opacity: 0.7, marginBottom: '6px', display: 'block', textTransform: 'uppercase' }}>
                    Admin Resolution Notes:
                  </ThemedText>
                  <ThemedText style={{ fontSize: '13px', display: 'block' }}>
                    {escrow.admin_notes}
                  </ThemedText>
                </div>
              )}
            </div>
          )}

          {/* Awaiting Client Approval */}
          {escrow.runner_status === 'completed' && escrow.client_status === 'pending' && !escrow.dispute_resolved_at && (
            <div style={{ padding: '12px', backgroundColor: '#f59e0b20', borderRadius: '8px', marginBottom: '12px' }}>
              <ThemedText style={{ color: '#f59e0b', fontWeight: '600', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FiClock size={16} /> Awaiting Client Approval
              </ThemedText>
              <ThemedText style={{ fontSize: '13px', opacity: 0.7, display: 'block' }}>
                Your work has been submitted. The client has 7 days to review and confirm.
              </ThemedText>
            </div>
          )}

          {/* ✅ NEW: Payment Available for Withdrawal */}
          {(escrow.status === 'released' || escrow.status === 'releasable') && escrow.client_status === 'confirmed' && !escrow.dispute_resolved_at && (
            <div style={{ padding: '12px', backgroundColor: '#22c55e20', borderRadius: '8px', marginBottom: '12px' }}>
              <ThemedText style={{ color: '#22c55e', fontWeight: '600', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FiCheck size={16} /> Payment Available for Withdrawal
              </ThemedText>
              <ThemedText style={{ fontSize: '13px', opacity: 0.7, display: 'block' }}>
                The client approved your work. You can now withdraw your earnings.
              </ThemedText>
              {withdrawalDetails && (
                <div style={{ marginTop: '12px', padding: '12px', backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: '6px' }}>
                  <ThemedText style={{ fontSize: '13px', marginBottom: '6px', display: 'block' }}>
                    Earnings breakdown:
                  </ThemedText>
                  <div style={{ fontSize: '12px', opacity: 0.8, display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>Gross amount:</span>
                    <span>₦{withdrawalDetails.grossAmount.toLocaleString()}</span>
                  </div>
                  <div style={{ fontSize: '12px', opacity: 0.8, display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>Platform fee (5%):</span>
                    <span>₦{withdrawalDetails.fee.toLocaleString()}</span>
                  </div>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    display: 'flex',
                    justifyContent: 'space-between',
                    paddingTop: '8px',
                    borderTop: '1px solid rgba(0,0,0,0.1)',
                  }}>
                    <span>You will receive:</span>
                    <span>₦{withdrawalDetails.netAmount.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Already Withdrawn */}
          {escrow.withdrawn_at && (
            <div style={{ padding: '12px', backgroundColor: '#8b5cf620', borderRadius: '8px', marginBottom: '12px' }}>
              <ThemedText style={{ color: '#8b5cf6', fontWeight: '600', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FiCheck size={16} /> Payment Withdrawn
              </ThemedText>
              <ThemedText style={{ fontSize: '13px', opacity: 0.7, display: 'block' }}>
                Withdrawn on {new Date(escrow.withdrawn_at).toLocaleDateString()}
              </ThemedText>
            </div>
          )}

          {/* Dispute Raised */}
          {(escrow.status === 'disputed' || escrow.client_status === 'disputed') && !escrow.dispute_resolved_at && (
            <div style={{ padding: '12px', backgroundColor: '#ef444420', borderRadius: '8px', marginBottom: '12px' }}>
              <ThemedText style={{ color: '#ef4444', fontWeight: '600', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FiAlertTriangle size={16} /> Dispute Raised
              </ThemedText>
              <ThemedText style={{ fontSize: '13px', opacity: 0.7, display: 'block' }}>
                A dispute has been raised. Our support team will review and resolve this.
              </ThemedText>
            </div>
          )}
        </ThemedCard>
      )}

      {/* Action Buttons */}
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
            <ThemedText style={{ color: Colors.primary, fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <FiCheck size={16} /> You already applied ({existingApp.status})
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

        {/* ✅ UPDATED: Withdraw Button - Shows for all approved bank accounts */}
        {canWithdraw() && !withdrawalSubmitted && (
          <Button
            variant="primary"
            size="md"
            onClick={() => setShowWithdrawalModal(true)}
            style={{ 
              width: '100%', 
              backgroundColor: '#22c55e', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '8px' 
            }}
          >
            <FiDollarSign size={18} /> Withdraw Payment
          </Button>
        )}

        {/* Show reason if can't withdraw */}
        {!canWithdraw() && escrow && withdrawBlockReason && (
          <div style={{ 
            padding: '12px', 
            backgroundColor: escrow.withdrawn_at ? '#8b5cf620' : '#ef444420', 
            borderRadius: '8px', 
            textAlign: 'center' 
          }}>
            <ThemedText style={{ 
              fontSize: '13px', 
              color: escrow.withdrawn_at ? '#8b5cf6' : '#ef4444'
            }}>
              {withdrawBlockReason}
            </ThemedText>
          </div>
        )}

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
                cursor: 'pointer',
                opacity: 0.6,
                color: Colors.text,
                padding: '4px',
              }}
            >
              <FiX size={20} />
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
                    <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: Colors.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <FiCheck size={16} /> Image Selected
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

      {/* ✅ NEW: Withdrawal Modal */}
      {showWithdrawalModal && (
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
          onClick={() => {
            if (withdrawalStep === 'confirm') {
              setShowWithdrawalModal(false);
            }
          }}
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
            {withdrawalStep === 'confirm' && (
              <button
                onClick={() => setShowWithdrawalModal(false)}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  opacity: 0.6,
                  color: Colors.text,
                  padding: '4px',
                }}
              >
                <FiX size={20} />
              </button>
            )}

            {withdrawalStep === 'confirm' ? (
              <>
                <ThemedText
                  title
                  style={{
                    fontSize: '22px',
                    fontWeight: '700',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: Colors.primary,
                  }}
                >
                  <FiDollarSign size={24} /> Withdraw Your Earnings
                </ThemedText>

                {withdrawalDetails && (
                  <>
                    <div style={{ backgroundColor: '#f0f9ff', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
                      <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '8px' }}>Earnings Breakdown:</div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                        <span>Gross Amount:</span>
                        <span>₦{withdrawalDetails.grossAmount.toLocaleString()}</span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px', opacity: 0.7 }}>
                        <span>Platform Fee (5%):</span>
                        <span>-₦{withdrawalDetails.fee.toLocaleString()}</span>
                      </div>

                      <div style={{ borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: '600', color: Colors.primary }}>
                        <span>You will receive:</span>
                        <span>₦{withdrawalDetails.netAmount.toLocaleString()}</span>
                      </div>
                    </div>

                    {bankAccount && (
                      <div style={{ backgroundColor: '#f3e5f520', borderRadius: '8px', padding: '12px', marginBottom: '16px', fontSize: '13px' }}>
                        <div style={{ opacity: 0.7, marginBottom: '4px' }}>Transfer to:</div>
                        <div style={{ fontWeight: '600', marginBottom: '2px' }}>
                          {bankAccount.account_name}
                        </div>
                        <div style={{ opacity: 0.7, fontSize: '12px' }}>
                          {bankAccount.bank_name}
                        </div>
                        <div style={{ opacity: 0.7, fontSize: '12px' }}>
                          {bankAccount.account_number}
                        </div>
                      </div>
                    )}

                    <ThemedText style={{ fontSize: '13px', marginBottom: '16px', opacity: 0.7, display: 'block' }}>
                      Money will be transferred immediately. Check your bank account in 1-3 business days.
                    </ThemedText>
                  </>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <Button
                    variant="ghost"
                    onClick={() => setShowWithdrawalModal(false)}
                    style={{ width: '100%' }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => withdrawalMutation.mutate()}
                    disabled={withdrawalMutation.isPending}
                    style={{ width: '100%', backgroundColor: '#22c55e' }}
                  >
                    {withdrawalMutation.isPending ? 'Processing...' : 'Confirm Withdrawal'}
                  </Button>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px', color: Colors.success }}><FiCheck size={48} /></div>
                <ThemedText
                  title
                  style={{
                    fontSize: '22px',
                    fontWeight: '700',
                    marginBottom: '12px',
                    display: 'block',
                    color: Colors.primary,
                  }}
                >
                  Withdrawal Successful!
                </ThemedText>
                <ThemedText style={{ fontSize: '14px', opacity: 0.7, marginBottom: '24px', display: 'block' }}>
                  ₦{withdrawalDetails?.netAmount.toLocaleString()} has been sent to your bank account.
                </ThemedText>
                <ThemedText style={{ fontSize: '13px', opacity: 0.6, display: 'block' }}>
                  Money will arrive in 1-3 business days.
                </ThemedText>
              </div>
            )}
          </ThemedCard>
        </div>
      )}
      </div>
    </ThemedView>
  );
}


