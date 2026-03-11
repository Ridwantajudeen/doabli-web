//admin dashboard

import { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Users, Package, DollarSign, AlertCircle, BarChart3, Settings, Search, Filter, MoreVertical, TrendingUp, ChevronLeft, ChevronRight, Check, X, Eye, UserCheck, UserCog, Briefcase, Activity, Wallet, ShieldAlert } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import BrandLogo from '../../components/BrandLogo';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { showError, showSuccess } from '../../lib/notify';
import AdminWithdrawals from './AdminWithdrawals';

export default function AdminDashboard() {
  const { Colors } = useTheme();
  const { profile, user, profileLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [resolvingDispute, setResolvingDispute] = useState(null);
  const [reviewingKYC, setReviewingKYC] = useState(null);
  const [kycReviewReason, setKycReviewReason] = useState('');
  const [kycAdminNotes, setKycAdminNotes] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [systemSettings, setSystemSettings] = useState(null);
  const [kycFilter, setKycFilter] = useState('pending');
  const [bankAccountFilter, setBankAccountFilter] = useState('pending');
  const [reviewingBankAccount, setReviewingBankAccount] = useState(null);
  const [bankAccountRejectReason, setBankAccountRejectReason] = useState('');
  const [bankAccountAdminNotes, setBankAccountAdminNotes] = useState('');
  const apiBase = import.meta.env.VITE_API_URL || '';

  // Define all hooks BEFORE any conditional returns (required by React Hooks Rules)
  const api = useCallback(async (path, opts = {}) => {
    console.log('=== API CALL DEBUG ===');
    console.log('Path:', path);
    console.log('Full URL:', `${apiBase}${path}`);
    
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    
    console.log('Has Token:', !!token);
    console.log('Token (first 20 chars):', token?.substring(0, 20));
    
    const res = await fetch(`${apiBase}${path}`, {
      ...opts,
      headers: {
        ...(opts.headers || {}),
        Authorization: token ? `Bearer ${token}` : undefined,
        'Content-Type': opts.body ? 'application/json' : undefined,
      },
    });
    
    console.log('Response Status:', res.status);
    console.log('Response OK:', res.ok);
    
    if (!res.ok) {
      const text = await res.text();
      console.error(`API ${path} failed:`, text);
      throw new Error(text || `API ${path} failed with ${res.status}`);
    }
    
    const jsonData = await res.json();
    console.log('Response Data:', jsonData);
    console.log('======================');
    
    return jsonData;
  }, [apiBase]);

  // Fetch dashboard stats
  const { data: statsData, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['adminStats'],
    queryFn: () => api('/admin/stats'),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Fetch data from backend with pagination
  const { data: usersData = { users: [], total: 0, page: 1 }, isLoading: usersLoading, refetch: refetchUsers } = useQuery({
    queryKey: ['adminUsers', currentPage, searchQuery],
    queryFn: () => api(`/admin/users?page=${currentPage}&limit=${pageSize}${searchQuery ? `&search=${searchQuery}` : ''}`),
    enabled: activeTab === 'users',
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  const { data: errandsData = { errands: [], total: 0, page: 1 }, isLoading: errandsLoading, refetch: refetchErrands } = useQuery({
    queryKey: ['adminErrands', currentPage, searchQuery],
    queryFn: () => api(`/admin/errands?page=${currentPage}&limit=${pageSize}${searchQuery ? `&search=${searchQuery}` : ''}`),
    enabled: activeTab === 'errands',
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  const { data: escrowsData = { escrows: [], total: 0, page: 1 }, isLoading: escrowsLoading, refetch: refetchEscrows } = useQuery({
    queryKey: ['adminEscrows', currentPage],
    queryFn: () => api(`/admin/escrows?page=${currentPage}&limit=${pageSize}`),
    enabled: activeTab === 'payments' || activeTab === 'disputes',
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  const { data: auditsData = { audits: [], total: 0, page: 1 }, isLoading: auditsLoading, refetch: refetchAudits } = useQuery({
    queryKey: ['adminAudits', currentPage],
    queryFn: () => api(`/admin/audits?page=${currentPage}&limit=${pageSize}`),
    enabled: activeTab === 'analytics',
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  const { data: transactionsData = { transactions: [], total: 0, page: 1 }, isLoading: transactionsLoading, refetch: refetchTransactions } = useQuery({
    queryKey: ['adminTransactions', currentPage],
    queryFn: () => api(`/admin/transactions?page=${currentPage}&limit=${pageSize}`),
    enabled: activeTab === 'transactions',
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // ✅ UPDATED: Fetch KYC with filter
  const { data: kycData = { kyc_requests: [], total: 0, page: 1 }, isLoading: kycLoading, refetch: refetchKYC } = useQuery({
    queryKey: ['adminKYC', currentPage, kycFilter],
    queryFn: () => api(`/admin/kyc?page=${currentPage}&limit=${pageSize}&status=${kycFilter === 'all' ? '' : kycFilter}`),
    enabled: activeTab === 'kyc',
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  const { data: bankAccountsData = { bank_accounts: [], total: 0, page: 1 }, isLoading: bankAccountsLoading, refetch: refetchBankAccounts } = useQuery({
    queryKey: ['adminBankAccounts', currentPage, bankAccountFilter],
    queryFn: () => api(`/admin/bank-accounts?page=${currentPage}&limit=${pageSize}&status=${bankAccountFilter === 'all' ? '' : bankAccountFilter}`),
    enabled: activeTab === 'bank-accounts',
    staleTime: 1000 * 60 * 2,
  });

  const { data: settingsDataFromAPI, isLoading: settingsLoading, refetch: refetchSettings } = useQuery({
    queryKey: ['adminSettings'],
    queryFn: () => api('/admin/settings'),
    enabled: activeTab === 'settings',
    staleTime: 1000 * 60 * 5, // 5 minutes - settings rarely change
    onSuccess: (data) => {
      if (data && !systemSettings) {
        setSystemSettings(data);
      }
    },
  });

  // Mutations
  const suspendMutation = useMutation({
    mutationFn: async ({ id, suspended }) =>
      api(`/admin/users/${id}/suspend`, { method: 'POST', body: JSON.stringify({ suspended }) }),
    onSuccess: () => {
      refetchUsers();
      refetchStats();
    },
  });

  const cancelErrandMutation = useMutation({
    mutationFn: async ({ id, reason }) =>
      api(`/admin/errands/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) }),
    onSuccess: () => {
      refetchErrands();
      refetchStats();
    },
  });

  const resolveDisputeMutation = useMutation({
    mutationFn: async ({ id, resolution, admin_notes }) =>
      api(`/admin/escrows/${id}/resolve`, { method: 'POST', body: JSON.stringify({ resolution, admin_notes }) }),
    onSuccess: () => {
      refetchEscrows();
      refetchStats();
      setResolvingDispute(null);
      setAdminNotes('');
    },
  });

  // ✅ UPDATED: Review KYC mutation
  const reviewKYCMutation = useMutation({
    mutationFn: async ({ id, status, admin_notes, reason }) =>
      api(`/admin/kyc/${id}/review`, { method: 'POST', body: JSON.stringify({ status, admin_notes, reason }) }),
    onSuccess: () => {
      refetchKYC();
      refetchStats();
      setReviewingKYC(null);
      setKycReviewReason('');
      setKycAdminNotes('');
    },
    onError: (err) => {
      showError('kyc-review', err);
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (settings) =>
      api('/admin/settings', { method: 'POST', body: JSON.stringify(settings) }),
    onSuccess: () => {
      refetchSettings();
      showSuccess('Settings updated successfully!');
    },
  });

  const reviewBankAccountMutation = useMutation({
    mutationFn: async ({ id, status, rejected_reason, admin_notes }) => {
      try {
        const response = await api(`/admin/bank-accounts/${id}/review`, { 
          method: 'POST', 
          body: JSON.stringify({ status, rejected_reason, admin_notes }) 
        });
        
        // api() already returns parsed data, not a Response object
        if (response.error) {
          throw new Error(response.error);
        }
        return response;
      } catch (error) {
        throw new Error(error.message || 'Failed to review bank account');
      }
    },
    onSuccess: () => {
      showSuccess('Bank account review submitted successfully!');
      refetchBankAccounts();
      refetchStats();
      setReviewingBankAccount(null);
      setBankAccountRejectReason('');
      setBankAccountAdminNotes('');
    },
    onError: (err) => {
      showError('bank-review', err);
    },
  });

  // Format currency to Naira
  const formatNaira = (amount) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount || 0);
  };

  // Get stats from API or default values
  const stats = statsData || {
    totalUsers: 0,
    totalRunners: 0,
    totalClients: 0,
    totalErrands: 0,
    activeErrands: 0,
    totalPayments: 0,
    revenue: 0,
    disputes: 0,
  };

  // Fetch signed URLs for KYC documents (only when reviewing)
  const { data: kycSignedUrlsData, isLoading: loadingSignedUrls } = useQuery({
    queryKey: ['kycSignedUrls', reviewingKYC?.id],
    queryFn: () => api(`/admin/kyc/${reviewingKYC.id}/signed-urls`),
    enabled: !!reviewingKYC?.id,
    select: (data) => data?.signed_urls,
  });

  const kycSignedUrls = kycSignedUrlsData || null;

  // Get data arrays
  const users = usersData.users || [];
  const errands = errandsData.errands || [];
  const escrows = escrowsData.escrows || [];
  const audits = auditsData.audits || [];

  // Debug data
  console.log('=== DATA DEBUG ===');
  console.log('Stats Data:', statsData);
  console.log('Users Data:', usersData);
  console.log('Users Array:', users);
  console.log('Users Length:', users.length);
  console.log('==================');

  // Status color helper
  const getStatusColor = (status) => {
    const colors = {
      pending: Colors.warning,
      posted: Colors.primary,
      assigned: '#8B5CF6',
      'in-progress': '#06B6D4',
      completed: Colors.success,
      cancelled: Colors.muted,
      canceled: Colors.muted,
      refunded: Colors.muted,
      disputed: Colors.error,
      'in-escrow': '#8B5CF6',
      released: Colors.success,
      funded: '#3B82F6',
      withdrawn: Colors.success,
      approved: Colors.success,
      rejected: Colors.error,
    };
    return colors[status] || Colors.muted;
  };

  // Pagination helper
  const totalPages = Math.ceil((activeTab === 'users' ? usersData.total : activeTab === 'errands' ? errandsData.total : activeTab === 'payments' ? escrowsData.total : activeTab === 'transactions' ? transactionsData.total : activeTab === 'kyc' ? kycData.total : auditsData.total) / pageSize);

  // Component: StatCard
  const StatCard = ({ icon: Icon, label, value, subtext, color }) => (
    <div style={{
      background: Colors.cardBackground,
      border: `1px solid ${Colors.border}`,
      borderRadius: '12px',
      padding: '20px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '16px',
      flex: 1,
      minWidth: '200px',
    }}>
      <div style={{ background: color, opacity: 0.1, borderRadius: '8px', padding: '12px', color }}>
        <Icon size={24} />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: '12px', color: Colors.muted, marginBottom: '4px', fontWeight: '600', textTransform: 'uppercase' }}>{label}</p>
        <p style={{ fontSize: '28px', fontWeight: '700', color: Colors.text, margin: '0' }}>{value}</p>
        {subtext && <p style={{ fontSize: '12px', color: Colors.muted, marginTop: '4px' }}>{subtext}</p>}
      </div>
    </div>
  );

  // Component: Pagination
  const Pagination = () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '20px', padding: '0 16px' }}>
      <button
        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        style={{
          background: currentPage === 1 ? Colors.muted : Colors.primary,
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          padding: '8px 12px',
          cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
          opacity: currentPage === 1 ? 0.5 : 1,
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        <ChevronLeft size={16} /> Previous
      </button>
      <span style={{ color: Colors.text }}>
        Page {currentPage} of {totalPages || 1}
      </span>
      <button
        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage >= totalPages}
        style={{
          background: currentPage >= totalPages ? Colors.muted : Colors.primary,
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          padding: '8px 12px',
          cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
          opacity: currentPage >= totalPages ? 0.5 : 1,
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        Next <ChevronRight size={16} />
      </button>
    </div>
  );

  // RENDER: Dashboard
  const renderDashboard = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {statsLoading ? (
        <p style={{ color: Colors.muted }}>Loading dashboard stats...</p>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
            <StatCard icon={Users} label="Total Users" value={stats.totalUsers} color={Colors.primary} />
            <StatCard icon={UserCheck} label="Runners" value={stats.totalRunners} color="#8B5CF6" />
            <StatCard icon={Briefcase} label="Clients" value={stats.totalClients} color="#06B6D4" />
            <StatCard icon={Package} label="Total Errands" value={stats.totalErrands} color={Colors.warning} />
            <StatCard icon={Activity} label="Active Errands" value={stats.activeErrands} color="#10B981" />
            <StatCard icon={Wallet} label="Total Revenue" value={formatNaira(stats.revenue)} color={Colors.success} />
            <StatCard icon={DollarSign} label="Total Payments" value={stats.totalPayments} color="#3B82F6" />
            <StatCard icon={ShieldAlert} label="Active Disputes" value={stats.disputes} color={Colors.error} />
          </div>
          
          <div style={{ 
            background: Colors.cardBackground, 
            border: `1px solid ${Colors.border}`, 
            borderRadius: '12px', 
            padding: '24px',
            marginTop: '16px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: Colors.text, marginBottom: '16px' }}>
              Quick Stats Overview
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div>
                <p style={{ fontSize: '12px', color: Colors.muted, marginBottom: '4px' }}>Average Revenue per Payment</p>
                <p style={{ fontSize: '20px', fontWeight: '700', color: Colors.text }}>
                  {formatNaira(stats.totalPayments > 0 ? stats.revenue / stats.totalPayments : 0)}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: Colors.muted, marginBottom: '4px' }}>Completion Rate</p>
                <p style={{ fontSize: '20px', fontWeight: '700', color: Colors.text }}>
                  {stats.totalErrands > 0 ? ((stats.totalErrands - stats.activeErrands) / stats.totalErrands * 100).toFixed(1) : 0}%
                </p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: Colors.muted, marginBottom: '4px' }}>Dispute Rate</p>
                <p style={{ fontSize: '20px', fontWeight: '700', color: Colors.text }}>
                  {stats.totalPayments > 0 ? (stats.disputes / stats.totalPayments * 100).toFixed(1) : 0}%
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );

  // RENDER: Users
  const renderUsers = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', gap: '12px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: Colors.muted }} />
          <input
            type="text"
            placeholder="Search by name, email, or user ID..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              width: '100%',
              paddingLeft: '36px',
              padding: '10px 12px 10px 36px',
              borderRadius: '8px',
              border: `1px solid ${Colors.border}`,
              background: Colors.cardBackground,
              color: Colors.text,
              fontSize: '14px',
            }}
          />
        </div>
      </div>

      {usersLoading ? (
        <p style={{ color: Colors.muted }}>Loading users...</p>
      ) : users.length === 0 ? (
        <p style={{ color: Colors.muted }}>No users found</p>
      ) : (
        <>
          <div style={{ overflowX: 'auto', borderRadius: '8px', border: `1px solid ${Colors.border}` }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: Colors.cardBackground, borderBottom: `1px solid ${Colors.border}` }}>
                <tr>
                  <th style={{ padding: '12px', textAlign: 'left', color: Colors.text, fontWeight: '600', fontSize: '12px' }}>Name</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: Colors.text, fontWeight: '600', fontSize: '12px' }}>User ID</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: Colors.text, fontWeight: '600', fontSize: '12px' }}>Email</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: Colors.text, fontWeight: '600', fontSize: '12px' }}>Role</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: Colors.text, fontWeight: '600', fontSize: '12px' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'center', color: Colors.text, fontWeight: '600', fontSize: '12px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} style={{ borderBottom: `1px solid ${Colors.border}` }}>
                    <td style={{ padding: '12px', color: Colors.text, fontSize: '14px' }}>{user.full_name || 'N/A'}</td>
                    <td style={{ padding: '12px', color: Colors.text, fontSize: '12px', fontFamily: 'monospace', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.user_id || 'N/A'}</td>
                    <td style={{ padding: '12px', color: Colors.text, fontSize: '14px' }}>{user.email || 'N/A'}</td>
                    <td style={{ padding: '12px', color: Colors.text, fontSize: '14px', textTransform: 'capitalize' }}>{user.role || 'user'}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: user.suspended ? Colors.error : Colors.success,
                        color: 'white',
                      }}>
                        {user.suspended ? 'Suspended' : 'Active'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button
                        onClick={() => suspendMutation.mutate({ id: user.id, suspended: !user.suspended })}
                        style={{
                          background: user.suspended ? Colors.success : Colors.error,
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '6px 12px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '600',
                        }}
                      >
                        {user.suspended ? 'Unsuspend' : 'Suspend'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination />
        </>
      )}
    </div>
  );

  // RENDER: Errands
  const renderErrands = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', gap: '12px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: Colors.muted }} />
          <input
            type="text"
            placeholder="Search by title or ID..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              width: '100%',
              paddingLeft: '36px',
              padding: '10px 12px 10px 36px',
              borderRadius: '8px',
              border: `1px solid ${Colors.border}`,
              background: Colors.cardBackground,
              color: Colors.text,
              fontSize: '14px',
            }}
          />
        </div>
      </div>

      {errandsLoading ? (
        <p style={{ color: Colors.muted }}>Loading errands...</p>
      ) : errands.length === 0 ? (
        <p style={{ color: Colors.muted }}>No errands found</p>
      ) : (
        <>
          <div style={{ overflowX: 'auto', borderRadius: '8px', border: `1px solid ${Colors.border}` }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: Colors.cardBackground, borderBottom: `1px solid ${Colors.border}` }}>
                <tr>
                  <th style={{ padding: '12px', textAlign: 'left', color: Colors.text, fontWeight: '600', fontSize: '12px' }}>Title</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: Colors.text, fontWeight: '600', fontSize: '12px' }}>Amount</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: Colors.text, fontWeight: '600', fontSize: '12px' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: Colors.text, fontWeight: '600', fontSize: '12px' }}>Date</th>
                  <th style={{ padding: '12px', textAlign: 'center', color: Colors.text, fontWeight: '600', fontSize: '12px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {errands.map((errand) => (
                  <tr key={errand.id} style={{ borderBottom: `1px solid ${Colors.border}` }}>
                    <td style={{ padding: '12px', color: Colors.text, fontSize: '14px' }}>{errand.title || 'N/A'}</td>
                    <td style={{ padding: '12px', color: Colors.text, fontSize: '14px', fontWeight: '600' }}>{formatNaira(errand.budget)}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: getStatusColor(errand.status),
                        color: 'white',
                      }}>
                        {errand.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px', color: Colors.text, fontSize: '14px' }}>{new Date(errand.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button
                        onClick={() => {
                          const reason = prompt('Enter cancellation reason:');
                          if (reason) cancelErrandMutation.mutate({ id: errand.id, reason });
                        }}
                        style={{
                          background: Colors.error,
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '6px 12px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '600',
                        }}
                      >
                        Cancel
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination />
        </>
      )}
    </div>
  );

  // RENDER: Payments
  const renderPayments = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {escrowsLoading ? (
        <p style={{ color: Colors.muted }}>Loading escrows...</p>
      ) : escrows.length === 0 ? (
        <p style={{ color: Colors.muted }}>No payments found</p>
      ) : (
        <>
          <div style={{ overflowX: 'auto', borderRadius: '8px', border: `1px solid ${Colors.border}` }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: Colors.cardBackground, borderBottom: `1px solid ${Colors.border}` }}>
                <tr>
                  <th style={{ padding: '12px', textAlign: 'left', color: Colors.text, fontWeight: '600', fontSize: '12px' }}>Errand ID</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: Colors.text, fontWeight: '600', fontSize: '12px' }}>Amount</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: Colors.text, fontWeight: '600', fontSize: '12px' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: Colors.text, fontWeight: '600', fontSize: '12px' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {escrows.map((escrow) => (
                  <tr key={escrow.id} style={{ borderBottom: `1px solid ${Colors.border}` }}>
                    <td style={{ padding: '12px', color: Colors.text, fontSize: '14px', fontFamily: 'monospace' }}>{escrow.errand_id?.slice(0, 8)}</td>
                    <td style={{ padding: '12px', color: Colors.text, fontSize: '14px', fontWeight: '600' }}>{formatNaira(escrow.amount)}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: getStatusColor(escrow.status),
                        color: 'white',
                      }}>
                        {escrow.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px', color: Colors.text, fontSize: '14px' }}>{new Date(escrow.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination />
        </>
      )}
    </div>
  );

  // RENDER: Disputes
  const renderDisputes = () => {
    const disputes = escrows.filter(e => e.status === 'disputed');
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {escrowsLoading ? (
          <p style={{ color: Colors.muted }}>Loading disputes...</p>
        ) : disputes.length === 0 ? (
          <p style={{ color: Colors.muted }}>No active disputes</p>
        ) : (
          <>
            <div style={{ overflowX: 'auto', borderRadius: '8px', border: `1px solid ${Colors.border}` }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: Colors.cardBackground, borderBottom: `1px solid ${Colors.border}` }}>
                  <tr>
                    <th style={{ padding: '12px', textAlign: 'left', color: Colors.text, fontWeight: '600', fontSize: '12px' }}>Amount</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: Colors.text, fontWeight: '600', fontSize: '12px' }}>Details</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: Colors.text, fontWeight: '600', fontSize: '12px' }}>Date</th>
                    <th style={{ padding: '12px', textAlign: 'center', color: Colors.text, fontWeight: '600', fontSize: '12px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {disputes.map((dispute) => (
                    <tr key={dispute.id} style={{ borderBottom: `1px solid ${Colors.border}` }}>
                      <td style={{ padding: '12px', color: Colors.text, fontSize: '14px', fontWeight: '600' }}>{formatNaira(dispute.amount)}</td>
                      <td style={{ padding: '12px', color: Colors.muted, fontSize: '12px' }}>{dispute.dispute_details || dispute.dispute_reason || 'No reason provided'}</td>
                      <td style={{ padding: '12px', color: Colors.text, fontSize: '14px' }}>{new Date(dispute.created_at).toLocaleDateString()}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <button
                          onClick={() => setResolvingDispute(dispute)}
                          style={{
                            background: Colors.primary,
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '6px 12px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '600',
                          }}
                        >
                          Resolve
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Resolve Dispute Modal (detailed preview) */}
        {resolvingDispute && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}>
            <div style={{
              background: Colors.cardBackground,
              border: `2px solid ${Colors.primary}`,
              borderRadius: '12px',
              padding: '20px',
              maxWidth: '720px',
              width: '95%',
              maxHeight: '80vh',
              overflowY: 'auto',
              position: 'relative',
            }}>
              <button
                onClick={() => { setResolvingDispute(null); setAdminNotes(''); }}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: 'transparent',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: Colors.text,
                }}
              >
                ✕
              </button>

              <h3 style={{ color: Colors.primary, marginBottom: '16px', fontSize: '20px', fontWeight: '700' }}>Dispute Details</h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <p style={{ margin: 0, color: Colors.primary, fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Amount</p>
                  <p style={{ margin: '6px 0 0', color: Colors.text, fontWeight: 700, fontSize: '16px' }}>{formatNaira(resolvingDispute.amount)}</p>
                </div>
                <div>
                  <p style={{ margin: 0, color: Colors.primary, fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Errand</p>
                  <p style={{ margin: '6px 0 0', color: Colors.text, fontFamily: 'monospace' }}>{resolvingDispute.errand_id?.slice(0, 8) || '—'}</p>
                </div>
                <div>
                  <p style={{ margin: 0, color: Colors.primary, fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Client</p>
                  <p style={{ margin: '6px 0 0', color: Colors.text, fontFamily: 'monospace' }}>{resolvingDispute.client_id?.slice(0, 8) || '—'}</p>
                </div>
                <div>
                  <p style={{ margin: 0, color: Colors.primary, fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Runner</p>
                  <p style={{ margin: '6px 0 0', color: Colors.text, fontFamily: 'monospace' }}>{resolvingDispute.runner_id?.slice(0, 8) || '—'}</p>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <p style={{ margin: 0, color: Colors.primary, fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Reported</p>
                <p style={{ margin: '6px 0 0', color: Colors.text }}>{new Date(resolvingDispute.dispute_raised_at || resolvingDispute.created_at).toLocaleString()}</p>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <p style={{ margin: 0, color: Colors.primary, fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Client's Details</p>
                <div style={{ marginTop: '8px', padding: '12px', background: Colors.background, borderRadius: '8px', border: `1px solid ${Colors.border}` }}>
                  <p style={{ margin: 0, color: Colors.text, whiteSpace: 'pre-wrap', fontSize: '14px' }}>{resolvingDispute.dispute_details || resolvingDispute.dispute_reason || 'No details provided'}</p>
                </div>
              </div>

              {resolvingDispute.dispute_image_url && (
                <div style={{ marginBottom: '16px' }}>
                  <p style={{ margin: 0, color: Colors.primary, fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '8px' }}>Attached Image</p>
                  <a href={resolvingDispute.dispute_image_url} target="_blank" rel="noreferrer" style={{ display: 'block' }}>
                    <img src={resolvingDispute.dispute_image_url} alt="dispute" style={{ maxWidth: '100%', maxHeight: '320px', borderRadius: '8px', border: `1px solid ${Colors.border}`, cursor: 'pointer' }} />
                  </a>
                </div>
              )}

              {resolvingDispute.runner_defense_details && (
                <div style={{ marginBottom: '16px', padding: '12px', background: Colors.background, borderRadius: '8px', border: `2px solid ${Colors.primary}` }}>
                  <p style={{ margin: 0, color: Colors.primary, fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '8px' }}>Runner's Defense</p>
                  <p style={{ margin: 0, color: Colors.text, whiteSpace: 'pre-wrap', fontSize: '14px' }}>{resolvingDispute.runner_defense_details}</p>
                  {resolvingDispute.runner_defense_image_url && (
                    <a href={resolvingDispute.runner_defense_image_url} target="_blank" rel="noreferrer" style={{ display: 'block', marginTop: '8px' }}>
                      <img src={resolvingDispute.runner_defense_image_url} alt="defense" style={{ maxWidth: '100%', maxHeight: '240px', borderRadius: '8px', cursor: 'pointer' }} />
                    </a>
                  )}
                </div>
              )}

              <div style={{ marginBottom: '16px' }}>
                <p style={{ margin: 0, color: Colors.primary, fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '8px' }}>Admin Notes (optional)</p>
                <textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} placeholder="Add notes for this decision..." style={{ width: '100%', minHeight: '80px', padding: '10px', borderRadius: '8px', border: `1px solid ${Colors.border}`, background: Colors.background, color: Colors.text, fontSize: '16px', fontFamily: 'inherit' }} />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                {['released', 'refunded', 'split'].map((res) => (
                  <button key={res} onClick={() => resolveDisputeMutation.mutate({ id: resolvingDispute.id, resolution: res, admin_notes: adminNotes })} disabled={resolveDisputeMutation.isPending} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: Colors.primary, color: 'white', cursor: 'pointer', fontWeight: 700, textTransform: 'capitalize', opacity: resolveDisputeMutation.isPending ? 0.6 : 1 }}>{resolveDisputeMutation.isPending ? 'Processing...' : res}</button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => { setResolvingDispute(null); setAdminNotes(''); }} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `1px solid ${Colors.border}`, background: 'transparent', color: Colors.text, cursor: 'pointer', fontWeight: 600 }}>Close for Now</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // RENDER: Transactions
  const renderTransactions = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {transactionsLoading ? (
        <p style={{ color: Colors.muted }}>Loading transactions...</p>
      ) : (transactionsData.transactions || []).length === 0 ? (
        <p style={{ color: Colors.muted }}>No transactions found</p>
      ) : (
        <>
          <div style={{ overflowX: 'auto', borderRadius: '8px', border: `1px solid ${Colors.border}` }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: Colors.cardBackground, borderBottom: `1px solid ${Colors.border}` }}>
                <tr>
                  <th style={{ padding: '12px', textAlign: 'left', color: Colors.text, fontWeight: '600', fontSize: '12px' }}>Type</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: Colors.text, fontWeight: '600', fontSize: '12px' }}>Amount</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: Colors.text, fontWeight: '600', fontSize: '12px' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: Colors.text, fontWeight: '600', fontSize: '12px' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {(transactionsData.transactions || []).map((tx) => (
                  <tr key={tx.id} style={{ borderBottom: `1px solid ${Colors.border}` }}>
                    <td style={{ padding: '12px', color: Colors.text, fontSize: '14px', textTransform: 'capitalize' }}>{tx.type}</td>
                    <td style={{ padding: '12px', color: Colors.text, fontSize: '14px', fontWeight: '600' }}>{formatNaira(tx.amount)}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: getStatusColor(tx.status),
                        color: 'white',
                      }}>
                        {tx.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px', color: Colors.text, fontSize: '14px' }}>{new Date(tx.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination />
        </>
      )}
    </div>
  );

  //: RENDER KYC 
  const renderKYC = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
        {['pending', 'approved', 'rejected', 'all'].map((status) => (
          <button
            key={status}
            onClick={() => {
              setKycFilter(status);
              setCurrentPage(1);
            }}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              background: kycFilter === status ? Colors.primary : Colors.cardBackground,
              color: kycFilter === status ? 'white' : Colors.text,
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '13px',
              transition: 'all 0.2s',
            }}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {kycLoading ? (
        <p style={{ color: Colors.muted }}>Loading KYC requests...</p>
      ) : (kycData.kyc_requests || []).length === 0 ? (
        <p style={{ color: Colors.muted }}>No KYC requests found</p>
      ) : (
        <>
          <div style={{ overflowX: 'auto', borderRadius: '8px', border: `1px solid ${Colors.border}` }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: Colors.cardBackground, borderBottom: `1px solid ${Colors.border}` }}>
                <tr>
                  <th style={{ padding: '12px', textAlign: 'left', color: Colors.text, fontWeight: '600', fontSize: '12px' }}>User</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: Colors.text, fontWeight: '600', fontSize: '12px' }}>Email</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: Colors.text, fontWeight: '600', fontSize: '12px' }}>Document Type</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: Colors.text, fontWeight: '600', fontSize: '12px' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: Colors.text, fontWeight: '600', fontSize: '12px' }}>Submitted</th>
                  <th style={{ padding: '12px', textAlign: 'center', color: Colors.text, fontWeight: '600', fontSize: '12px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(kycData.kyc_requests || []).map((req) => (
                  <tr key={req.id} style={{ borderBottom: `1px solid ${Colors.border}` }}>
                    <td style={{ padding: '12px', color: Colors.text, fontSize: '14px' }}>{req.user_name || 'N/A'}</td>
                    <td style={{ padding: '12px', color: Colors.text, fontSize: '12px' }}>{req.runner_email || 'N/A'}</td>
                    <td style={{ padding: '12px', color: Colors.text, fontSize: '14px', textTransform: 'capitalize' }}>{req.document_type?.replace('-', ' ') || 'Unknown'}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: getStatusColor(req.status),
                        color: 'white',
                      }}>
                        {req.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px', color: Colors.text, fontSize: '14px' }}>{new Date(req.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '12px', textAlign: 'center', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button
                        onClick={() => setReviewingKYC(req)}
                        style={{
                          background: Colors.primary,
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '6px 12px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Eye size={14} /> Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination />
        </>
      )}

      {/* ENHANCED KYC Review Modal with Image Preview */}
      {reviewingKYC && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
          overflowY: 'auto',
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.9)',
            border: `2px solid ${Colors.primary}`,
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '700px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative',
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
          }}>
            <button
              onClick={() => {
                setReviewingKYC(null);
                setKycReviewReason('');
                setKycAdminNotes('');
              }}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'transparent',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: Colors.text,
              }}
            >
              ✕
            </button>

            <h3 style={{ color: Colors.primary, marginBottom: '16px', fontSize: '20px', fontWeight: '700' }}>Review KYC Document</h3>

            {/* User Info */}
            <div style={{ marginBottom: '20px', padding: '16px', background: Colors.cardBackground, borderRadius: '8px', border: `1px solid ${Colors.border}` }}>
              <div style={{ marginBottom: '12px' }}>
                <p style={{ margin: 0, color: Colors.muted, fontSize: '12px', fontWeight: '600' }}>USER NAME</p>
                <p style={{ margin: '6px 0 0', color: Colors.text, fontWeight: '600' }}>{reviewingKYC.user_name || 'N/A'}</p>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <p style={{ margin: 0, color: Colors.muted, fontSize: '12px', fontWeight: '600' }}>USER ID</p>
                <p style={{ margin: '6px 0 0', color: Colors.text, fontFamily: 'monospace', fontSize: '12px' }}>{reviewingKYC.user_id || 'N/A'}</p>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <p style={{ margin: 0, color: Colors.muted, fontSize: '12px', fontWeight: '600' }}>EMAIL</p>
                <p style={{ margin: '6px 0 0', color: Colors.text, fontSize: '12px' }}>{reviewingKYC.runner_email || 'N/A'}</p>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <p style={{ margin: 0, color: Colors.muted, fontSize: '12px', fontWeight: '600' }}>DOCUMENT TYPE</p>
                <p style={{ margin: '6px 0 0', color: Colors.text, fontWeight: '600', textTransform: 'capitalize' }}>
                  {reviewingKYC.document_type === 'nin' ? 'National ID (NIN)' : reviewingKYC.document_type === 'driver-license' ? "Driver's License" : 'International Passport'}
                </p>
              </div>
              <div>
                <p style={{ margin: 0, color: Colors.muted, fontSize: '12px', fontWeight: '600' }}>DOCUMENT NUMBER</p>
                <p style={{ margin: '6px 0 0', color: Colors.text, fontWeight: '600' }}>{reviewingKYC.document_number || 'N/A'}</p>
              </div>
            </div>

            {/* Images Section */}
            <div style={{ marginBottom: '20px' }}>
              <p style={{ margin: '0 0 12px 0', color: Colors.primary, fontSize: '14px', fontWeight: '700' }}>ID Document & Selfie</p>
              {loadingSignedUrls ? (
                <p style={{ color: Colors.muted, textAlign: 'center', padding: '40px 20px' }}>Loading images...</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {/* Document Image */}
                  {kycSignedUrls?.document_url || reviewingKYC.document_url ? (
                    <div>
                      <p style={{ margin: '0 0 8px 0', color: Colors.muted, fontSize: '12px', fontWeight: '600' }}>ID Document</p>
                      <img
                        src={kycSignedUrls?.document_url || reviewingKYC.document_url}
                        alt="ID Document"
                        style={{
                          width: '100%',
                          borderRadius: '8px',
                          border: `1px solid ${Colors.border}`,
                          maxHeight: '300px',
                          objectFit: 'cover',
                          cursor: 'pointer',
                        }}
                        onClick={() => kycSignedUrls?.document_url && window.open(kycSignedUrls.document_url, '_blank')}
                      />
                    </div>
                  ) : (
                    <div style={{ padding: '40px 20px', background: Colors.cardBackground, borderRadius: '8px', textAlign: 'center', border: `1px solid ${Colors.border}` }}>
                      <p style={{ margin: 0, color: Colors.muted, fontSize: '12px' }}>No document image</p>
                    </div>
                  )}

                  {/* Selfie Image */}
                  {kycSignedUrls?.selfie_url || reviewingKYC.selfie_url ? (
                    <div>
                      <p style={{ margin: '0 0 8px 0', color: Colors.muted, fontSize: '12px', fontWeight: '600' }}>Selfie with ID</p>
                      <img
                        src={kycSignedUrls?.selfie_url || reviewingKYC.selfie_url}
                        alt="Selfie"
                        style={{
                          width: '100%',
                          borderRadius: '8px',
                          border: `1px solid ${Colors.border}`,
                          maxHeight: '300px',
                          objectFit: 'cover',
                          cursor: 'pointer',
                        }}
                        onClick={() => kycSignedUrls?.selfie_url && window.open(kycSignedUrls.selfie_url, '_blank')}
                      />
                    </div>
                  ) : (
                    <div style={{ padding: '40px 20px', background: Colors.cardBackground, borderRadius: '8px', textAlign: 'center', border: `1px solid ${Colors.border}` }}>
                      <p style={{ margin: 0, color: Colors.muted, fontSize: '12px' }}>No selfie image</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Admin Notes */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: Colors.text, fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>Admin Notes (Optional)</label>
              <textarea
                value={kycAdminNotes}
                onChange={(e) => setKycAdminNotes(e.target.value)}
                placeholder="Add notes about this review..."
                style={{
                  width: '100%',
                  minHeight: '70px',
                  padding: '10px',
                  borderRadius: '8px',
                  border: `1px solid ${Colors.border}`,
                  background: Colors.background,
                  color: Colors.text,
                  fontSize: '14px',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            {/* Rejection Reason (if rejecting) */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: Colors.text, fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>Rejection Reason (If Rejecting)</label>
              <input
                type="text"
                value={kycReviewReason}
                onChange={(e) => setKycReviewReason(e.target.value)}
                placeholder="e.g., Document unclear, Face not visible, Selfie missing"
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: `1px solid ${Colors.border}`,
                  background: Colors.background,
                  color: Colors.text,
                  fontSize: '14px',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => reviewKYCMutation.mutate({
                  id: reviewingKYC.id,
                  status: 'approved',
                  admin_notes: kycAdminNotes,
                  reason: null,
                })}
                disabled={reviewKYCMutation.isPending}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'green',
                  color: 'white',
                  cursor: reviewKYCMutation.isPending ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  opacity: reviewKYCMutation.isPending ? 0.6 : 1,
                }}
              >
                <Check size={16} /> {reviewKYCMutation.isPending ? 'Approving...' : 'Approve'}
              </button>

              <button
                onClick={() => {
                  if (!kycReviewReason) {
                    showError('validation', 'Please provide a rejection reason');
                    return;
                  }
                  reviewKYCMutation.mutate({
                    id: reviewingKYC.id,
                    status: 'rejected',
                    admin_notes: kycAdminNotes,
                    reason: kycReviewReason,
                  });
                }}
                disabled={reviewKYCMutation.isPending || !kycReviewReason}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'red',
                  color: 'white',
                  cursor: reviewKYCMutation.isPending || !kycReviewReason ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  opacity: reviewKYCMutation.isPending || !kycReviewReason ? 0.6 : 1,
                }}
              >
                <X size={16} /> {reviewKYCMutation.isPending ? 'Rejecting...' : 'Reject'}
              </button>

              <button
                onClick={() => {
                  setReviewingKYC(null);
                  setKycReviewReason('');
                  setKycAdminNotes('');
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '8px',
                  border: `1px solid ${Colors.border}`,
                  background: 'transparent',
                  color: Colors.text,
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // RENDER: Settings
  const renderSettings = () => {
    const currentSettings = systemSettings || settingsDataFromAPI || {};
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '600px' }}>
        {settingsLoading ? (
          <p style={{ color: Colors.muted }}>Loading settings...</p>
        ) : (
          <div style={{ background: Colors.cardBackground, border: `1px solid ${Colors.border}`, borderRadius: '12px', padding: '24px' }}>
            <h3 style={{ color: Colors.text, marginBottom: '20px', fontSize: '18px', fontWeight: '700' }}>System Settings</h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: Colors.text, fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Platform Fee (%)</label>
              <input
                type="number"
                value={currentSettings.platform_fee_percentage || 5}
                onChange={(e) => setSystemSettings({ ...currentSettings, platform_fee_percentage: parseFloat(e.target.value) })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: `1px solid ${Colors.border}`,
                  background: Colors.background,
                  color: Colors.text,
                  fontSize: '14px',
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: Colors.text, fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Minimum Errand Amount (NGN)</label>
              <input
                type="number"
                value={currentSettings.minimum_errand_amount || 1000}
                onChange={(e) => setSystemSettings({ ...currentSettings, minimum_errand_amount: parseFloat(e.target.value) })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: `1px solid ${Colors.border}`,
                  background: Colors.background,
                  color: Colors.text,
                  fontSize: '14px',
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: Colors.text, fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Maximum Errand Amount (NGN)</label>
              <input
                type="number"
                value={currentSettings.maximum_errand_amount || 500000}
                onChange={(e) => setSystemSettings({ ...currentSettings, maximum_errand_amount: parseFloat(e.target.value) })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: `1px solid ${Colors.border}`,
                  background: Colors.background,
                  color: Colors.text,
                  fontSize: '14px',
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: Colors.text, fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Max Concurrent Errands</label>
              <input
                type="number"
                value={currentSettings.max_concurrent_errands || 10}
                onChange={(e) => setSystemSettings({ ...currentSettings, max_concurrent_errands: parseInt(e.target.value) })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: `1px solid ${Colors.border}`,
                  background: Colors.background,
                  color: Colors.text,
                  fontSize: '14px',
                }}
              />
            </div>

            <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input
                type="checkbox"
                checked={currentSettings.maintenance_mode || false}
                onChange={(e) => setSystemSettings({ ...currentSettings, maintenance_mode: e.target.checked })}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <label style={{ color: Colors.text, fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>Maintenance Mode</label>
            </div>

            <button
              onClick={() => updateSettingsMutation.mutate(systemSettings || currentSettings)}
              disabled={updateSettingsMutation.isLoading}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: 'none',
                background: updateSettingsMutation.isLoading ? Colors.muted : Colors.primary,
                color: 'white',
                cursor: updateSettingsMutation.isLoading ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                fontSize: '14px',
              }}
            >
              {updateSettingsMutation.isLoading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        )}
      </div>
    );
  };

  // RENDER: Audit Logs
  const renderAuditLogs = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {auditsLoading ? (
        <p style={{ color: Colors.muted }}>Loading audit logs...</p>
      ) : audits.length === 0 ? (
        <p style={{ color: Colors.muted }}>No audit logs found</p>
      ) : (
        <>
          <div style={{ overflowX: 'auto', borderRadius: '8px', border: `1px solid ${Colors.border}` }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: Colors.cardBackground, borderBottom: `1px solid ${Colors.border}` }}>
                <tr>
                  <th style={{ padding: '12px', textAlign: 'left', color: Colors.text, fontWeight: '600', fontSize: '12px' }}>Action</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: Colors.text, fontWeight: '600', fontSize: '12px' }}>Target</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: Colors.text, fontWeight: '600', fontSize: '12px' }}>Details</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: Colors.text, fontWeight: '600', fontSize: '12px' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {audits.map((audit) => (
                  <tr key={audit.id} style={{ borderBottom: `1px solid ${Colors.border}` }}>
                    <td style={{ padding: '12px', color: Colors.text, fontSize: '14px', fontWeight: '600', textTransform: 'capitalize' }}>{audit.action?.replace(/_/g, ' ')}</td>
                    <td style={{ padding: '12px', color: Colors.text, fontSize: '14px', textTransform: 'capitalize' }}>{audit.target_type}</td>
                    <td style={{ padding: '12px', color: Colors.muted, fontSize: '12px' }}>{audit.details ? JSON.stringify(JSON.parse(audit.details)).slice(0, 50) + '...' : '-'}</td>
                    <td style={{ padding: '12px', color: Colors.text, fontSize: '14px' }}>{new Date(audit.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination />
        </>
      )}
    </div>
  );

  // RENDER: Bank Accounts
  const renderBankAccounts = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
        {['pending', 'approved', 'rejected', 'all'].map((status) => (
          <button
            key={status}
            onClick={() => {
              setBankAccountFilter(status);
              setCurrentPage(1);
            }}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              background: bankAccountFilter === status ? Colors.primary : Colors.cardBackground,
              color: bankAccountFilter === status ? 'white' : Colors.text,
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '13px',
              transition: 'all 0.2s',
            }}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {bankAccountsLoading ? (
        <p style={{ color: Colors.muted }}>Loading bank accounts...</p>
      ) : (bankAccountsData.bank_accounts || []).length === 0 ? (
        <p style={{ color: Colors.muted }}>No bank accounts found</p>
      ) : (
        <>
          <div style={{ overflowX: 'auto', borderRadius: '8px', border: `1px solid ${Colors.border}` }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: Colors.cardBackground, borderBottom: `1px solid ${Colors.border}` }}>
                <tr>
                  <th style={{ padding: '12px', textAlign: 'left', color: Colors.text, fontWeight: '600', fontSize: '12px' }}>Runner</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: Colors.text, fontWeight: '600', fontSize: '12px' }}>Email</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: Colors.text, fontWeight: '600', fontSize: '12px' }}>Bank</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: Colors.text, fontWeight: '600', fontSize: '12px' }}>Account Number</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: Colors.text, fontWeight: '600', fontSize: '12px' }}>Account Name</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: Colors.text, fontWeight: '600', fontSize: '12px' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: Colors.text, fontWeight: '600', fontSize: '12px' }}>Submitted</th>
                  <th style={{ padding: '12px', textAlign: 'center', color: Colors.text, fontWeight: '600', fontSize: '12px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(bankAccountsData.bank_accounts || []).map((account) => (
                  <tr key={account.id} style={{ borderBottom: `1px solid ${Colors.border}` }}>
                    <td style={{ padding: '12px', color: Colors.text, fontSize: '14px' }}>{account.runner_name || 'N/A'}</td>
                    <td style={{ padding: '12px', color: Colors.text, fontSize: '12px' }}>{account.runner_email || 'N/A'}</td>
                    <td style={{ padding: '12px', color: Colors.text, fontSize: '14px', textTransform: 'capitalize' }}>{account.bank_name || 'N/A'}</td>
                    <td style={{ padding: '12px', color: Colors.text, fontSize: '14px', fontFamily: 'monospace' }}>{account.account_number || 'N/A'}</td>
                    <td style={{ padding: '12px', color: Colors.text, fontSize: '14px' }}>{account.account_name || 'N/A'}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: getStatusColor(account.status),
                        color: 'white',
                      }}>
                        {account.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px', color: Colors.text, fontSize: '14px' }}>{new Date(account.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '12px', textAlign: 'center', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button
                        onClick={() => setReviewingBankAccount(account)}
                        style={{
                          background: Colors.primary,
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '6px 12px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Eye size={14} /> Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination />
        </>
      )}

      {/* Bank Account Review Modal */}
      {reviewingBankAccount && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
          overflowY: 'auto',
        }}>
          <div style={{
            background: Colors.cardBackground,
            border: `2px solid ${Colors.primary}`,
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative',
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
          }}>
            <button
              onClick={() => {
                setReviewingBankAccount(null);
                setBankAccountRejectReason('');
                setBankAccountAdminNotes('');
              }}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'transparent',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: Colors.text,
              }}
            >
              ✕
            </button>

            <h3 style={{ color: Colors.primary, marginBottom: '16px', fontSize: '20px', fontWeight: '700' }}>Review Bank Account</h3>

            {/* Account Info */}
            <div style={{ marginBottom: '20px', padding: '16px', background: Colors.background, borderRadius: '8px', border: `1px solid ${Colors.border}` }}>
              <div style={{ marginBottom: '12px' }}>
                <p style={{ margin: 0, color: Colors.muted, fontSize: '12px', fontWeight: '600' }}>RUNNER NAME</p>
                <p style={{ margin: '6px 0 0', color: Colors.text, fontWeight: '600' }}>{reviewingBankAccount.runner_name || 'N/A'}</p>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <p style={{ margin: 0, color: Colors.muted, fontSize: '12px', fontWeight: '600' }}>EMAIL</p>
                <p style={{ margin: '6px 0 0', color: Colors.text, fontSize: '12px' }}>{reviewingBankAccount.runner_email || 'N/A'}</p>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <p style={{ margin: 0, color: Colors.muted, fontSize: '12px', fontWeight: '600' }}>BANK NAME</p>
                <p style={{ margin: '6px 0 0', color: Colors.text, fontWeight: '600', textTransform: 'capitalize' }}>
                  {reviewingBankAccount.bank_name || 'N/A'}
                </p>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <p style={{ margin: 0, color: Colors.muted, fontSize: '12px', fontWeight: '600' }}>ACCOUNT NUMBER</p>
                <p style={{ margin: '6px 0 0', color: Colors.text, fontWeight: '600', fontFamily: 'monospace' }}>
                  {reviewingBankAccount.account_number || 'N/A'}
                </p>
              </div>
              <div>
                <p style={{ margin: 0, color: Colors.muted, fontSize: '12px', fontWeight: '600' }}>ACCOUNT NAME</p>
                <p style={{ margin: '6px 0 0', color: Colors.text, fontWeight: '600' }}>{reviewingBankAccount.account_name || 'N/A'}</p>
              </div>
            </div>

            {/* Admin Notes */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: Colors.text, fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>Admin Notes (Optional)</label>
              <textarea
                value={bankAccountAdminNotes}
                onChange={(e) => setBankAccountAdminNotes(e.target.value)}
                placeholder="Add notes about this review..."
                style={{
                  width: '100%',
                  minHeight: '70px',
                  padding: '10px',
                  borderRadius: '8px',
                  border: `1px solid ${Colors.border}`,
                  background: Colors.background,
                  color: Colors.text,
                  fontSize: '14px',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            {/* Rejection Reason (if rejecting) */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: Colors.text, fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>Rejection Reason (If Rejecting)</label>
              <input
                type="text"
                value={bankAccountRejectReason}
                onChange={(e) => setBankAccountRejectReason(e.target.value)}
                placeholder="e.g., Invalid account number, Account name mismatch"
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: `1px solid ${Colors.border}`,
                  background: Colors.background,
                  color: Colors.text,
                  fontSize: '14px',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => reviewBankAccountMutation.mutate({
                  id: reviewingBankAccount.id,
                  status: 'approved',
                  admin_notes: bankAccountAdminNotes,
                  rejected_reason: null,
                })}
                disabled={reviewBankAccountMutation.isPending}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'green',
                  color: 'white',
                  cursor: reviewBankAccountMutation.isPending ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  opacity: reviewBankAccountMutation.isPending ? 0.6 : 1,
                }}
              >
                <Check size={16} /> {reviewBankAccountMutation.isPending ? 'Approving...' : 'Approve'}
              </button>

              <button
                onClick={() => {
                  if (!bankAccountRejectReason) {
                    showError('validation', 'Please provide a rejection reason');
                    return;
                  }
                  reviewBankAccountMutation.mutate({
                    id: reviewingBankAccount.id,
                    status: 'rejected',
                    admin_notes: bankAccountAdminNotes,
                    rejected_reason: bankAccountRejectReason,
                  });
                }}
                disabled={reviewBankAccountMutation.isPending || !bankAccountRejectReason}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'red',
                  color: 'white',
                  cursor: reviewBankAccountMutation.isPending || !bankAccountRejectReason ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  opacity: reviewBankAccountMutation.isPending || !bankAccountRejectReason ? 0.6 : 1,
                }}
              >
                <X size={16} /> {reviewBankAccountMutation.isPending ? 'Rejecting...' : 'Reject'}
              </button>

              <button
                onClick={() => {
                  setReviewingBankAccount(null);
                  setBankAccountRejectReason('');
                  setBankAccountAdminNotes('');
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '8px',
                  border: `1px solid ${Colors.border}`,
                  background: 'transparent',
                  color: Colors.text,
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Main render
  // ✅ Auth checks AFTER all hooks (required by React Hooks Rules)
  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: Colors.background }}>
        <div style={{ textAlign: 'center', padding: '40px', borderRadius: '12px', background: Colors.cardBackground }}>
          <AlertCircle size={48} color={Colors.error} style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px', color: Colors.text }}>Authentication Required</h2>
          <p style={{ color: Colors.muted }}>You must be logged in to access the admin dashboard.</p>
        </div>
      </div>
    );
  }

  if (profileLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: Colors.background }}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '16px', color: Colors.text }}>Loading...</div>
        </div>
      </div>
    );
  }

  if (!profile || profile.role !== 'admin') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: Colors.background }}>
        <div style={{ textAlign: 'center', padding: '40px', borderRadius: '12px', background: Colors.cardBackground }}>
          <AlertCircle size={48} color={Colors.error} style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px', color: Colors.text }}>Unauthorized Access</h2>
          <p style={{ color: Colors.muted }}>You don't have permission to access the admin dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: Colors.background, padding: '24px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <BrandLogo width={130} height={34} variant="dark" />
            <h1 style={{ fontSize: '32px', fontWeight: '700', color: Colors.text, margin: 0 }}>Admin Dashboard</h1>
          </div>
          <p style={{ color: Colors.muted, fontSize: '14px' }}>Manage users, errands, payments, KYC, and system settings</p>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px',
          borderBottom: `1px solid ${Colors.border}`,
          overflowX: 'auto',
          paddingBottom: '16px',
        }}>
          {['dashboard', 'users', 'errands', 'payments', 'disputes', 'transactions', 'kyc', 'bank-accounts', 'withdrawals', 'analytics', 'settings'].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setCurrentPage(1);
                setSearchQuery('');
              }}
              style={{
                padding: '10px 16px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === tab ? Colors.primary : 'transparent',
                color: activeTab === tab ? 'white' : Colors.text,
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'users' && renderUsers()}
        {activeTab === 'errands' && renderErrands()}
        {activeTab === 'payments' && renderPayments()}
        {activeTab === 'disputes' && renderDisputes()}
        {activeTab === 'transactions' && renderTransactions()}
        {activeTab === 'kyc' && renderKYC()}
        {activeTab === 'bank-accounts' && renderBankAccounts()}
        {activeTab === 'withdrawals' && <AdminWithdrawals />}
        {activeTab === 'analytics' && renderAuditLogs()}
        {activeTab === 'settings' && renderSettings()}
      </div>
    </div>
  );
}
