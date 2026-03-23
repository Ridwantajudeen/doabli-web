import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ThemedView, ThemedText } from '../components/ThemedComponents';
import { getApiBase } from '../lib/apiBase';
import { supabase } from '../lib/supabase';
import Button from '../components/Button';

export default function PaystackReturn() {
  const navigate = useNavigate();
  const location = useLocation();
  const apiBase = getApiBase();
  const [status, setStatus] = useState('verifying');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const reference = params.get('reference') || params.get('tx_ref');
    const transactionId = params.get('transaction_id');
    const shouldVerify = reference || sessionStorage.getItem('paystack_context');

    if (!shouldVerify) {
      navigate('/client/errands', { replace: true });
      return;
    }

    let context = null;
    try {
      const stored = sessionStorage.getItem('paystack_context');
      context = stored ? JSON.parse(stored) : null;
    } catch {
      context = null;
    }

    const getSessionWithRetry = async (retries = 3) => {
      for (let i = 0; i < retries; i += 1) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) return session;
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      return null;
    };

    const verify = async () => {
      try {
        setStatus('verifying');
        setErrorMessage('');

        const session = await getSessionWithRetry();
        const token = session?.access_token;
        if (!token) {
          setStatus('error');
          setErrorMessage('Authentication required. Please sign in again.');
          return;
        }

        const query = new URLSearchParams();
        if (context?.reference === reference) {
          if (context.escrow_id) query.set('escrow_id', context.escrow_id);
          if (context.errand_id) query.set('errand_id', context.errand_id);
          if (context.type) query.set('type', context.type);
        }
        if (transactionId) query.set('transaction_id', transactionId);

        const refToUse = reference || context?.reference;
        if (!refToUse) {
          setStatus('error');
          setErrorMessage('Missing payment reference. Please try again.');
          return;
        }

        const url = `${apiBase}/api/pay/verify/${encodeURIComponent(refToUse)}${query.toString() ? `?${query.toString()}` : ''}`;
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json().catch(() => ({}));

        if (res.ok && data?.errand_id) {
          sessionStorage.removeItem('paystack_context');
          navigate(`/client/errand-details/${data.errand_id}`, { replace: true });
          return;
        }
        setStatus('error');
        setErrorMessage(data?.error || 'Payment verification failed. Please try again.');
      } catch (err) {
        console.error('[PaystackReturn] verify failed:', err);
        setStatus('error');
        setErrorMessage('Payment verification failed. Please try again.');
      }
    };

    verify();
  }, [apiBase, location.search, navigate]);

  return (
    <ThemedView style={{ minHeight: '100vh', padding: '40px' }}>
      <div style={{ textAlign: 'center' }}>
        {status === 'verifying' && (
          <ThemedText>Finalizing payment...</ThemedText>
        )}
        {status === 'error' && (
          <>
            <ThemedText style={{ display: 'block', marginBottom: '16px' }}>
              {errorMessage || 'Payment verification failed.'}
            </ThemedText>
            <div style={{ display: 'grid', gap: '12px', maxWidth: '320px', margin: '0 auto' }}>
              <Button variant="primary" onClick={() => window.location.reload()}>
                Retry Verification
              </Button>
              <Button variant="ghost" onClick={() => navigate('/client/errands')}>
                Back to Errands
              </Button>
            </div>
          </>
        )}
      </div>
    </ThemedView>
  );
}
