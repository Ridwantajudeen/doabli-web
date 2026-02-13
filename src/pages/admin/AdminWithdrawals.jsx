// AdminWithdrawals.jsx - Admin withdrawal queue management

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { showError, showSuccess } from '../../lib/notify';
import { useTheme } from '../../context/ThemeContext';
import { ThemedView, ThemedText, ThemedCard } from '../../components/ThemedComponents';
import Button from '../../components/Button';
import { FiDollarSign, FiCheck, FiX, FiClock, FiUser, FiCalendar } from 'react-icons/fi';

export default function AdminWithdrawals() {
  const { theme, Colors } = useTheme();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('pending');

  // Fetch withdrawals
  const { data: withdrawals = [], isLoading } = useQuery({
    queryKey: ['admin-withdrawals', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('withdrawals')
        .select(`
          id,
          profile_id,
          bank_account_id,
          amount,
          status,
          reference,
          created_at,
          reviewed_by,
          reviewed_at,
          approved_at,
          rejection_reason,
          bank_accounts(bank_name, account_number, account_name),
          profiles(id, first_name, last_name, email, kyc_verified)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  // Approve withdrawal mutation
  const approveMutation = useMutation({
    mutationFn: async ({ id }) => {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const token = (await supabase.auth.getSession()).data.session?.access_token || '';

      const response = await fetch(`${apiUrl}/api/admin/withdrawals/${id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to approve withdrawal');
      }

      return response.json();
    },
    onSuccess: () => {
      showSuccess('Withdrawal approved successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-withdrawals'] });
    },
    onError: (err) => {
      showError('generic', err);
    },
  });

  // Reject withdrawal mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }) => {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const token = (await supabase.auth.getSession()).data.session?.access_token || '';

      const response = await fetch(`${apiUrl}/api/admin/withdrawals/${id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reject withdrawal');
      }

      return response.json();
    },
    onSuccess: () => {
      showSuccess('Withdrawal rejected');
      queryClient.invalidateQueries({ queryKey: ['admin-withdrawals'] });
    },
    onError: (err) => {
      showError('generic', err);
    },
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return Colors.warning;
      case 'approved': return Colors.primary;
      case 'processing': return '#3b82f6';
      case 'success': return '#22c55e';
      case 'rejected': return Colors.error;
      case 'failed': return '#ef4444';
      default: return Colors.muted;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <FiClock size={16} />;
      case 'approved':
      case 'success': return <FiCheck size={16} />;
      case 'rejected':
      case 'failed': return <FiX size={16} />;
      default: return <FiDollarSign size={16} />;
    }
  };

  if (isLoading) {
    return (
      <ThemedView style={{ minHeight: '100vh', padding: '40px' }}>
        <div style={{ textAlign: 'center' }}>
          <ThemedText>Loading withdrawals...</ThemedText>
        </div>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={{ minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <ThemedText title style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>
            Withdrawal Requests
          </ThemedText>
          <ThemedText style={{ fontSize: '14px', opacity: 0.6, display: 'block' }}>
            Review and approve runner withdrawal requests
          </ThemedText>
        </div>

        {/* Status Filter */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {['all', 'pending', 'approved', 'rejected', 'success', 'failed'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: statusFilter === status ? Colors.primary : theme.uiBackground,
                color: statusFilter === status ? 'white' : theme.text,
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                textTransform: 'capitalize',
              }}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Withdrawals List */}
        {withdrawals.length === 0 ? (
          <ThemedCard style={{ padding: '40px', textAlign: 'center' }}>
            <ThemedText style={{ fontSize: '16px', opacity: 0.6 }}>
              No {statusFilter !== 'all' ? statusFilter : ''} withdrawals found
            </ThemedText>
          </ThemedCard>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {withdrawals.map((withdrawal) => (
              <ThemedCard
                key={withdrawal.id}
                style={{
                  padding: '20px',
                  borderLeft: `4px solid ${getStatusColor(withdrawal.status)}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      {getStatusIcon(withdrawal.status)}
                      <ThemedText
                        title
                        style={{
                          fontSize: '18px',
                          fontWeight: '600',
                          color: getStatusColor(withdrawal.status),
                        }}
                      >
                        {withdrawal.status.toUpperCase()}
                      </ThemedText>
                    </div>
                    <ThemedText style={{ fontSize: '12px', opacity: 0.6, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <FiCalendar size={12} />
                      {new Date(withdrawal.created_at).toLocaleString()}
                    </ThemedText>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <ThemedText style={{ fontSize: '12px', opacity: 0.6, marginBottom: '4px' }}>
                      Amount
                    </ThemedText>
                    <ThemedText
                      title
                      style={{
                        fontSize: '24px',
                        fontWeight: 'bold',
                        color: Colors.primary,
                      }}
                    >
                      ₦{Number(withdrawal.amount).toLocaleString()}
                    </ThemedText>
                  </div>
                </div>

                {/* Runner Details */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <ThemedText style={{ fontSize: '12px', opacity: 0.6, marginBottom: '4px' }}>
                      Runner
                    </ThemedText>
                    <ThemedText style={{ fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FiUser size={14} />
                      {withdrawal.profiles?.first_name} {withdrawal.profiles?.last_name}
                      {withdrawal.profiles?.kyc_verified && (
                        <span style={{ color: '#22c55e', fontSize: '12px' }}>✓ KYC</span>
                      )}
                    </ThemedText>
                    <ThemedText style={{ fontSize: '12px', opacity: 0.6 }}>
                      {withdrawal.profiles?.email}
                    </ThemedText>
                  </div>

                  <div>
                    <ThemedText style={{ fontSize: '12px', opacity: 0.6, marginBottom: '4px' }}>
                      Bank Account
                    </ThemedText>
                    <ThemedText style={{ fontSize: '14px', fontWeight: '600' }}>
                      {withdrawal.bank_accounts?.account_name}
                    </ThemedText>
                    <ThemedText style={{ fontSize: '12px', opacity: 0.6 }}>
                      {withdrawal.bank_accounts?.bank_name} - {withdrawal.bank_accounts?.account_number}
                    </ThemedText>
                  </div>
                </div>

                {/* Reference */}
                <div style={{ marginBottom: '16px' }}>
                  <ThemedText style={{ fontSize: '12px', opacity: 0.6, marginBottom: '4px' }}>
                    Reference
                  </ThemedText>
                  <ThemedText style={{ fontSize: '12px', fontFamily: 'monospace', opacity: 0.8 }}>
                    {withdrawal.reference}
                  </ThemedText>
                </div>

                {/* Rejection Reason (if rejected) */}
                {withdrawal.status === 'rejected' && withdrawal.rejection_reason && (
                  <div
                    style={{
                      padding: '12px',
                      backgroundColor: Colors.error + '20',
                      borderRadius: '8px',
                      marginBottom: '16px',
                    }}
                  >
                    <ThemedText style={{ fontSize: '12px', fontWeight: '600', marginBottom: '4px', color: Colors.error }}>
                      Rejection Reason:
                    </ThemedText>
                    <ThemedText style={{ fontSize: '13px', color: Colors.error }}>
                      {withdrawal.rejection_reason}
                    </ThemedText>
                  </div>
                )}

                {/* Action Buttons (only for pending) */}
                {withdrawal.status === 'pending' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <Button
                      variant="primary"
                      onClick={() => {
                        if (window.confirm('Approve this withdrawal?')) {
                          approveMutation.mutate({ id: withdrawal.id });
                        }
                      }}
                      disabled={approveMutation.isPending}
                      style={{ width: '100%', backgroundColor: '#22c55e' }}
                    >
                      {approveMutation.isPending ? 'Approving...' : 'Approve'}
                    </Button>
                    <Button
                      variant="warning"
                      onClick={() => {
                        const reason = window.prompt('Rejection reason:');
                        if (reason) {
                          rejectMutation.mutate({ id: withdrawal.id, reason });
                        }
                      }}
                      disabled={rejectMutation.isPending}
                      style={{ width: '100%' }}
                    >
                      {rejectMutation.isPending ? 'Rejecting...' : 'Reject'}
                    </Button>
                  </div>
                )}
              </ThemedCard>
            ))}
          </div>
        )}
      </div>
    </ThemedView>
  );
}
