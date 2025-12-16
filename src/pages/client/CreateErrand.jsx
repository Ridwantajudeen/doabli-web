import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { ThemedView, ThemedText, ThemedTextInput } from '../../components/ThemedComponents';
import Button from '../../components/Button';

export default function CreateErrand() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const runnerId = searchParams.get('runnerId');
  const { theme, Colors } = useTheme();
  const { user, profile } = useAuth();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    price: '',
  });

  const [errors, setErrors] = useState({});
  const [isPaying, setIsPaying] = useState(false);

  // Load Paystack script
  useEffect(() => {
    if (!window.PaystackPop) {
      const script = document.createElement('script');
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // Mutation: create errand and escrow after payment
  const createMutation = useMutation({
    mutationFn: async () => {
      const price = parseFloat(formData.price);

      // 1. Create errand
      const { data: errandData, error: errandError } = await supabase
        .from('errands')
        .insert([
          {
            posted_by: user.id,
            title: formData.title,
            description: formData.description,
            location: formData.location,
            price: price,
            status: runnerId ? 'offered' : 'posted',
            assigned_to: null,
          },
        ])
        .select()
        .single();

      if (errandError) throw errandError;

      // 2. If targeting a specific runner, create application
      if (runnerId) {
        const { error: appError } = await supabase.from('runner_applications').insert([
          {
            errand_id: errandData.id,
            runner_id: runnerId,
            status: 'pending',
          },
        ]);
        if (appError) {
          await supabase.from('errands').delete().eq('id', errandData.id);
          throw appError;
        }
      }

      // 3. Create escrow
      const escrowInsert = {
        errand_id: errandData.id,
        // Use profile.id when the DB escrow.client_id FK references profiles.id.
        // Fall back to auth user id if profile isn't available.
        client_id: profile?.id ?? user.id,
        amount: price, // full client payment
        client_status: 'pending',
        runner_status: 'pending',
      };
      if (runnerId) escrowInsert.runner_id = runnerId;

      const { error: escrowError } = await supabase.from('escrow').insert([escrowInsert]);
      if (escrowError) {
        if (runnerId) await supabase.from('runner_applications').delete().eq('errand_id', errandData.id);
        await supabase.from('errands').delete().eq('id', errandData.id);
        throw escrowError;
      }

      return errandData;
    },
    onSuccess: () => {
      alert(runnerId ? 'Offer sent to runner!' : 'Errand posted successfully!');
      navigate('/client/errands');
    },
    onError: (err) => {
      alert('Error: ' + err.message);
    },
  });

  // Form validation
  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (!formData.price || isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Valid price is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Paystack payment
  const handlePaystackPayment = () => {
    const handler = window.PaystackPop && window.PaystackPop.setup({
      key: import.meta.env.VITE_PAYSTACK_KEY,
      email: user.email,
      amount: Math.floor(parseFloat(formData.price) * 100), // convert to Kobo
      currency: 'NGN',
      callback: function () {
        createMutation.mutate();
      },
      onClose: function () {
        setIsPaying(false);
        alert('Payment cancelled');
      },
    });
    if (handler) {
      setIsPaying(true);
      handler.openIframe();
    } else {
      alert('Paystack not loaded');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    handlePaystackPayment();
  };

  return (
    <ThemedView style={{ minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
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

        <ThemedText title style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '12px', display: 'block' }}>
          {runnerId ? 'Send Offer to Runner' : 'Post a New Errand'}
        </ThemedText>

        <ThemedText style={{ fontSize: '14px', opacity: 0.6, marginBottom: '24px', display: 'block' }}>
          {runnerId
            ? 'Create an errand and send it to this specific runner'
            : 'Post your errand and pay before runners can accept it'}
        </ThemedText>

        <form onSubmit={handleSubmit}>
          {/* Title */}
          <div style={{ marginBottom: '20px' }}>
            <ThemedText style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', display: 'block' }}>Title *</ThemedText>
            <ThemedTextInput
              placeholder="e.g., Grocery shopping, Package delivery"
              value={formData.title}
              onChange={(v) => { setFormData({ ...formData, title: v }); if (errors.title) setErrors({ ...errors, title: null }); }}
              error={errors.title}
            />
          </div>

          {/* Description */}
          <div style={{ marginBottom: '20px' }}>
            <ThemedText style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', display: 'block' }}>Description *</ThemedText>
            <textarea
              placeholder="Provide details about what needs to be done..."
              value={formData.description}
              onChange={(e) => { setFormData({ ...formData, description: e.target.value }); if (errors.description) setErrors({ ...errors, description: null }); }}
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: theme.uiBackground,
                border: `1px solid ${errors.description ? Colors.warning : theme.uiBackground}`,
                borderRadius: '12px',
                color: theme.text,
                fontSize: '14px',
                fontFamily: 'inherit',
                resize: 'vertical',
                minHeight: '120px',
                boxSizing: 'border-box',
                transition: 'all 0.2s ease',
              }}
            />
            {errors.description && (
              <ThemedText style={{ color: Colors.warning, fontSize: '13px', marginTop: '6px', display: 'block' }}>
                {errors.description}
              </ThemedText>
            )}
          </div>

          {/* Location */}
          <div style={{ marginBottom: '20px' }}>
            <ThemedText style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', display: 'block' }}>Location *</ThemedText>
            <ThemedTextInput
              placeholder="e.g., 123 Main St, Lagos"
              value={formData.location}
              onChange={(v) => { setFormData({ ...formData, location: v }); if (errors.location) setErrors({ ...errors, location: null }); }}
              error={errors.location}
            />
          </div>

          {/* Price */}
          <div style={{ marginBottom: '24px' }}>
            <ThemedText style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', display: 'block' }}>Price (₦) *</ThemedText>
            <ThemedTextInput
              type="number"
              placeholder="Enter amount in Naira"
              value={formData.price}
              onChange={(v) => { setFormData({ ...formData, price: v }); if (errors.price) setErrors({ ...errors, price: null }); }}
              error={errors.price}
            />
          </div>

          {/* Buttons */}
          <div style={{ display: 'grid', gap: '12px' }}>
            <Button variant="primary" type="submit" disabled={isPaying || createMutation.isPending} style={{ width: '100%' }}>
              {isPaying || createMutation.isPending ? 'Processing...' : runnerId ? 'Send Offer' : 'Pay & Post Errand'}
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate('/client/errands')}
              disabled={isPaying || createMutation.isPending}
              style={{ width: '100%' }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </ThemedView>
  );
}
