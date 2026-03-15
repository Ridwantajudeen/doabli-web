// AdminWithdrawals.jsx - Admin withdrawal queue management

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { showError, showSuccess } from '../../lib/notify';
import { useTheme } from '../../context/ThemeContext';
import { ThemedView, ThemedText, ThemedCard } from '../../components/ThemedComponents';
import Button from '../../components/Button';
import { FiDollarSign, FiCheck, FiX, FiClock, FiUser, FiCalendar } from 'react-icons/fi';
import { getApiBase } from '../../lib/apiBase';

export default function AdminWithdrawals() {
  const { theme, Colors } = useTheme();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('pending');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const apiBase = getApiBase();

  // Fetch withdrawals
  const { data: withdrawalsData = { withdrawals: [], total: 0, page: 1 }, isLoading } = useQuery({
    queryKey: ['admin-withdrawals', statusFilter, page, searchQuery],
    queryFn: async () => {
      const token = (await supabase.auth.getSession()).data.session?.access_token || '';
      const statusParam = statusFilter === 'all' ? '' : statusFilter;
      const searchParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : '';
      const res = await fetch(
        `${apiBase}/api/admin/withdrawals?page=${page}&limit=${pageSize}&status=${statusParam}${searchParam}`,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,
          },
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to fetch withdrawals');
      }
      return res.json();
    },
  });
  const withdrawals = withdrawalsData.withdrawals || [];
  const totalPages = Math.ceil((withdrawalsData.total || 0) / pageSize);

  const applySearch = () => {
    setSearchQuery(searchInput.trim());
    setPage(1);
  };

  const promptForPin = (actionLabel = 'continue') => {
    const raw = window.prompt(`Enter admin PIN to ${actionLabel}:`);
    if (raw === null) return null;
    const cleaned = String(raw).trim().replace(/\D/g, '');
    if (!/^\d{4,6}$/.test(cleaned)) {
      showError('validation', 'PIN must be 4-6 digits');
      return null;
    }
    return cleaned;
  };

  // Approve withdrawal mutation
  const approveMutation = useMutation({
    mutationFn: async ({ id, pin }) => {
      const apiUrl = apiBase;
      const token = (await supabase.auth.getSession()).data.session?.access_token || '';

      const response = await fetch(`${apiUrl}/api/admin/withdrawals/${id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ pin }),
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
    mutationFn: async ({ id, reason, pin }) => {
      const apiUrl = apiBase;
      const token = (await supabase.auth.getSession()).data.session?.access_token || '';

      const response = await fetch(`${apiUrl}/api/admin/withdrawals/${id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason, pin }),
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
              onClick={() => {
                setStatusFilter(status);
                setPage(1);
              }}
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
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <div style={{ flex: 1 }}>
            <input
              type="text"
              placeholder="Search by reference or runner ID..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') applySearch();
              }}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: `1px solid ${Colors.border}`,
                background: theme.uiBackground,
                color: theme.text,
                fontSize: '14px',
              }}
            />
          </div>
          <button
            onClick={applySearch}
            style={{
              background: Colors.primary,
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 16px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
            }}
          >
            Search
          </button>
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
                  {withdrawal.paystack_transfer_code && (
                    <>
                      <ThemedText style={{ fontSize: '12px', opacity: 0.6, marginTop: '8px', marginBottom: '4px' }}>
                        Paystack ID
                      </ThemedText>
                      <ThemedText style={{ fontSize: '12px', fontFamily: 'monospace', opacity: 0.8 }}>
                        {withdrawal.paystack_transfer_code}
                      </ThemedText>
                    </>
                  )}
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
                          const pin = promptForPin('approve this withdrawal');
                          if (!pin) return;
                          approveMutation.mutate({ id: withdrawal.id, pin });
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
                          const pin = promptForPin('reject this withdrawal');
                          if (!pin) return;
                          rejectMutation.mutate({ id: withdrawal.id, reason, pin });
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

        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '20px', padding: '0 4px' }}>
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              style={{
                background: page === 1 ? Colors.muted : Colors.primary,
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 12px',
                cursor: page === 1 ? 'not-allowed' : 'pointer',
                opacity: page === 1 ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              Previous
            </button>
            <span style={{ color: Colors.text }}>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              style={{
                background: page >= totalPages ? Colors.muted : Colors.primary,
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 12px',
                cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                opacity: page >= totalPages ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </ThemedView>
  );
}
