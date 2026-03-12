import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ThemedView, ThemedText } from '../components/ThemedComponents';

export default function PaystackReturn() {
  const navigate = useNavigate();
  const location = useLocation();
  const apiBase = import.meta.env.VITE_API_URL || '';

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const reference = params.get('reference');

    if (!reference) {
      navigate('/client/errands', { replace: true });
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch(`${apiBase}/api/pay/verify/${encodeURIComponent(reference)}`);
        const data = await res.json().catch(() => ({}));

        if (res.ok && data?.errand_id) {
          navigate(`/client/errand-details/${data.errand_id}`, { replace: true });
          return;
        }
      } catch (err) {
        console.error('[PaystackReturn] verify failed:', err);
      }

      navigate('/client/errands', { replace: true });
    };

    verify();
  }, [apiBase, location.search, navigate]);

  return (
    <ThemedView style={{ minHeight: '100vh', padding: '40px' }}>
      <div style={{ textAlign: 'center' }}>
        <ThemedText>Finalizing payment...</ThemedText>
      </div>
    </ThemedView>
  );
}
