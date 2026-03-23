//admin dashboard

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Users, Package, CreditCard, AlertCircle, Settings, Search, Filter, MoreVertical, TrendingUp, ChevronLeft, ChevronRight, Check, X, Eye, UserCheck, UserCog, Briefcase, Activity, ShieldAlert, Banknote, BanknoteArrowUp, BadgePercent, Landmark, Lock, FileDown, UserCircle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import BrandLogo from '../../components/BrandLogo';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { showError, showSuccess } from '../../lib/notify';
import AdminWithdrawals from './AdminWithdrawals';
import { getApiBase } from '../../lib/apiBase';
import { getAdminLevel, isAdminRole } from '../../lib/adminAccess';

export default function AdminDashboard() {
  const { Colors } = useTheme();
  const { profile, user, profileLoading } = useAuth();
  const navigate = useNavigate();
  const adminRole = profile?.role || null;
  const adminLevel = getAdminLevel(adminRole);
  const canSupport = adminLevel >= 1;
  const canFinance = adminLevel >= 2;
  const canSuper = adminLevel >= 3;
  const canViewDisputes = canSupport;
  const canResolveDisputes = canFinance;
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchInput, setUserSearchInput] = useState('');
  const [errandSearchQuery, setErrandSearchQuery] = useState('');
  const [errandSearchInput, setErrandSearchInput] = useState('');
  const [tabSearchInput, setTabSearchInput] = useState({
    payments: '',
    disputes: '',
    transactions: '',
    kyc: '',
    'bank-accounts': '',
    support: '',
  });
  const [tabSearchQuery, setTabSearchQuery] = useState({
    payments: '',
    disputes: '',
    transactions: '',
    kyc: '',
    'bank-accounts': '',
    support: '',
  });
  const [tabPages, setTabPages] = useState({
    dashboard: 1,
    financials: 1,
    users: 1,
    errands: 1,
    payments: 1,
    disputes: 1,
    transactions: 1,
    kyc: 1,
    'bank-accounts': 1,
    withdrawals: 1,
    support: 1,
    'admin-activity': 1,
    admins: 1,
    analytics: 1,
    settings: 1,
  });
  const [pageSize, setPageSize] = useState(50);
  const [resolvingDispute, setResolvingDispute] = useState(null);
  const [disputeFilter, setDisputeFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [conversationOpen, setConversationOpen] = useState(false);
  const [conversationLoading, setConversationLoading] = useState(false);
  const [conversationError, setConversationError] = useState('');
  const [conversationData, setConversationData] = useState(null);
  const [reviewingKYC, setReviewingKYC] = useState(null);
  const [kycReviewReason, setKycReviewReason] = useState('');
  const [kycAdminNotes, setKycAdminNotes] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [systemSettings, setSystemSettings] = useState(null);
  const [paymentProvider, setPaymentProvider] = useState(null);
  const [kycFilter, setKycFilter] = useState('pending');
  const [bankAccountFilter, setBankAccountFilter] = useState('pending');
  const [reviewingBankAccount, setReviewingBankAccount] = useState(null);
  const [bankAccountRejectReason, setBankAccountRejectReason] = useState('');
  const [bankAccountAdminNotes, setBankAccountAdminNotes] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedErrand, setSelectedErrand] = useState(null);
  const [selectedEscrow, setSelectedEscrow] = useState(null);
  const [supportFilter, setSupportFilter] = useState('open');
  const [selectedSupport, setSelectedSupport] = useState(null);
  const [supportReply, setSupportReply] = useState('');
  const [auditFilterInput, setAuditFilterInput] = useState({
    admin: '',
    action: '',
    targetType: '',
    dateFrom: '',
    dateTo: '',
    search: '',
  });
  const [auditFilters, setAuditFilters] = useState({
    admin: '',
    action: '',
    targetType: '',
    dateFrom: '',
    dateTo: '',
    search: '',
  });
  const [adminSearchInput, setAdminSearchInput] = useState('');
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const [financialsPinInput, setFinancialsPinInput] = useState('');
  const [financialsPin, setFinancialsPin] = useState('');
  const [financialsUnlocked, setFinancialsUnlocked] = useState(false);
  const [financialsError, setFinancialsError] = useState('');
  const [financialsData, setFinancialsData] = useState(null);
  const [adminActivityPinInput, setAdminActivityPinInput] = useState('');
  const [adminActivityPin, setAdminActivityPin] = useState('');
  const [adminActivityUnlocked, setAdminActivityUnlocked] = useState(false);
  const [adminActivityError, setAdminActivityError] = useState('');
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [pinSetup, setPinSetup] = useState({ current: '', next: '', confirm: '' });
  const [pinSetupError, setPinSetupError] = useState('');
  const [selectedAudit, setSelectedAudit] = useState(null);
  const apiBase = getApiBase();
  const adminQueryDefaults = {
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: 'always',
  };

  const getPageForTab = (tab) => tabPages?.[tab] || 1;
  const setPageForTab = (tab, page) => {
    setTabPages((prev) => ({ ...prev, [tab]: page }));
  };

  const usersPage = getPageForTab('users');
  const errandsPage = getPageForTab('errands');
  const paymentsPage = getPageForTab('payments');
  const disputesPage = getPageForTab('disputes');
  const transactionsPage = getPageForTab('transactions');
  const kycPage = getPageForTab('kyc');
  const bankAccountsPage = getPageForTab('bank-accounts');
  const supportPage = getPageForTab('support');
  const adminActivityPage = getPageForTab('admin-activity');
  const adminsPage = getPageForTab('admins');
  const analyticsPage = getPageForTab('analytics');
  const activePage = getPageForTab(activeTab);

  const tabConfig = useMemo(() => ([
    { key: 'dashboard', label: 'Dashboard', show: true },
    { key: 'financials', label: 'Financials', show: canFinance },
    { key: 'users', label: 'Users', show: canSupport },
    { key: 'errands', label: 'Errands', show: canSupport },
    { key: 'payments', label: 'Payments', show: canFinance },
    { key: 'disputes', label: 'Disputes', show: canViewDisputes },
    { key: 'transactions', label: 'Transactions', show: canFinance },
    { key: 'kyc', label: 'KYC', show: canFinance },
    { key: 'bank-accounts', label: 'Bank Accounts', show: canFinance },
    { key: 'withdrawals', label: 'Withdrawals', show: canFinance },
    { key: 'support', label: 'Support', show: canSupport },
    { key: 'admin-activity', label: 'Admin Activity', show: canSuper },
    { key: 'admins', label: 'Admins', show: canSuper },
    { key: 'analytics', label: 'Analytics', show: canSupport },
    { key: 'settings', label: 'Settings', show: canSuper },
  ]), [canFinance, canSupport, canSuper, canViewDisputes]);

  const visibleTabs = useMemo(
    () => tabConfig.filter((tab) => tab.show).map((tab) => tab.key),
    [tabConfig]
  );

  useEffect(() => {
    if (visibleTabs.length && !visibleTabs.includes(activeTab)) {
      setActiveTab(visibleTabs[0]);
    }
  }, [activeTab, visibleTabs]);

  const getTabSearchInput = (tab) => tabSearchInput?.[tab] || '';
  const getTabSearchQuery = (tab) => tabSearchQuery?.[tab] || '';
  const setTabSearchInputValue = (tab, value) => {
    setTabSearchInput((prev) => ({ ...prev, [tab]: value }));
  };
  const applyTabSearch = (tab) => {
    setTabSearchQuery((prev) => ({ ...prev, [tab]: (tabSearchInput?.[tab] || '').trim() }));
    setPageForTab(tab, 1);
  };

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
  }, [apiBase, supabase]);

  const openDispute = useCallback((dispute) => {
    setResolvingDispute(dispute);
    setAdminNotes('');
    setConversationOpen(false);
    setConversationLoading(false);
    setConversationError('');
    setConversationData(null);
  }, []);

  const loadConversation = useCallback(async () => {
    if (!resolvingDispute?.id) return;
    setConversationLoading(true);
    setConversationError('');
    try {
      const data = await api(`/admin/escrows/${resolvingDispute.id}/conversation`);
      setConversationData(data);
      setConversationOpen(true);
    } catch (err) {
      setConversationError(err?.message || 'Failed to load conversation');
    } finally {
      setConversationLoading(false);
    }
  }, [api, resolvingDispute?.id]);

  const conversationParticipants = conversationData?.participants || [];
  const conversationEscrow = conversationData?.escrow || null;
  const conversationMessages = conversationData?.messages || [];
  const conversationClient = conversationParticipants.find((p) => p.id === conversationEscrow?.client_id) || null;
  const conversationRunner = conversationParticipants.find((p) => p.id === conversationEscrow?.runner_id) || null;

  // Fetch dashboard stats
  const { data: statsData, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useQuery({
    queryKey: ['adminStats'],
    queryFn: () => api('/admin/stats'),
    ...adminQueryDefaults,
  });

  // Fetch data from backend with pagination
  const { data: usersData = { users: [], total: 0, page: 1 }, isLoading: usersLoading, refetch: refetchUsers } = useQuery({
    queryKey: ['adminUsers', usersPage, userSearchQuery],
    queryFn: () => api(`/admin/users?page=${usersPage}&limit=${pageSize}${userSearchQuery ? `&search=${encodeURIComponent(userSearchQuery)}` : ''}`),
    enabled: activeTab === 'users' && canSupport,
    ...adminQueryDefaults,
  });

  const { data: errandsData = { errands: [], total: 0, page: 1 }, isLoading: errandsLoading, refetch: refetchErrands } = useQuery({
    queryKey: ['adminErrands', errandsPage, errandSearchQuery],
    queryFn: () => api(`/admin/errands?page=${errandsPage}&limit=${pageSize}${errandSearchQuery ? `&search=${encodeURIComponent(errandSearchQuery)}` : ''}`),
    enabled: activeTab === 'errands' && canSupport,
    ...adminQueryDefaults,
  });

  const { data: escrowsData = { escrows: [], total: 0, page: 1 }, isLoading: escrowsLoading, refetch: refetchEscrows } = useQuery({
    queryKey: ['adminEscrows', activeTab, activeTab === 'disputes' ? disputesPage : paymentsPage, getTabSearchQuery(activeTab)],
    queryFn: () => {
      const page = activeTab === 'disputes' ? disputesPage : paymentsPage;
      const isDisputes = activeTab === 'disputes';
      const status = isDisputes ? '' : '';
      const search = getTabSearchQuery(activeTab);
      const disputeParam = isDisputes ? '&dispute=all' : '';
      return api(`/admin/escrows?page=${page}&limit=${pageSize}${status ? `&status=${status}` : ''}${disputeParam}${search ? `&search=${encodeURIComponent(search)}` : ''}`);
    },
    enabled: (activeTab === 'payments' && canFinance) || (activeTab === 'disputes' && canViewDisputes),
    ...adminQueryDefaults,
  });

  const { data: auditsData = { audits: [], total: 0, page: 1 }, isLoading: auditsLoading, refetch: refetchAudits } = useQuery({
    queryKey: ['adminAudits', activeTab, adminActivityPage, analyticsPage, auditFilters, adminActivityPin],
    queryFn: () => {
      const page = activeTab === 'admin-activity' ? adminActivityPage : analyticsPage;
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
      });
      if (auditFilters.admin) params.set('admin_id', auditFilters.admin);
      if (auditFilters.action) params.set('action', auditFilters.action);
      if (auditFilters.targetType) params.set('target_type', auditFilters.targetType);
      if (auditFilters.dateFrom) params.set('date_from', auditFilters.dateFrom);
      if (auditFilters.dateTo) params.set('date_to', auditFilters.dateTo);
      if (auditFilters.search) params.set('search', auditFilters.search);
      if (activeTab === 'admin-activity') params.set('scope', 'admin_activity');
      return api(`/admin/audits?${params.toString()}`, {
        headers: activeTab === 'admin-activity' && adminActivityPin
          ? { 'x-admin-pin': adminActivityPin }
          : undefined,
      });
    },
    enabled: (activeTab === 'analytics' && canSupport) || (activeTab === 'admin-activity' && canSuper && adminActivityUnlocked),
    ...adminQueryDefaults,
  });

  const { data: transactionsData = { transactions: [], total: 0, page: 1 }, isLoading: transactionsLoading, refetch: refetchTransactions } = useQuery({
    queryKey: ['adminTransactions', transactionsPage, getTabSearchQuery('transactions')],
    queryFn: () => api(`/admin/transactions?page=${transactionsPage}&limit=${pageSize}${getTabSearchQuery('transactions') ? `&search=${encodeURIComponent(getTabSearchQuery('transactions'))}` : ''}`),
    enabled: activeTab === 'transactions' && canFinance,
    ...adminQueryDefaults,
  });

  // ✅ UPDATED: Fetch KYC with filter
  const { data: kycData = { kyc_requests: [], total: 0, page: 1 }, isLoading: kycLoading, refetch: refetchKYC } = useQuery({
    queryKey: ['adminKYC', kycPage, kycFilter, getTabSearchQuery('kyc')],
    queryFn: () => api(`/admin/kyc?page=${kycPage}&limit=${pageSize}&status=${kycFilter === 'all' ? '' : kycFilter}${getTabSearchQuery('kyc') ? `&search=${encodeURIComponent(getTabSearchQuery('kyc'))}` : ''}`),
    enabled: activeTab === 'kyc' && canFinance,
    ...adminQueryDefaults,
  });

  const { data: bankAccountsData = { bank_accounts: [], total: 0, page: 1 }, isLoading: bankAccountsLoading, refetch: refetchBankAccounts } = useQuery({
    queryKey: ['adminBankAccounts', bankAccountsPage, bankAccountFilter, getTabSearchQuery('bank-accounts')],
    queryFn: () => api(`/admin/bank-accounts?page=${bankAccountsPage}&limit=${pageSize}&status=${bankAccountFilter === 'all' ? '' : bankAccountFilter}${getTabSearchQuery('bank-accounts') ? `&search=${encodeURIComponent(getTabSearchQuery('bank-accounts'))}` : ''}`),
    enabled: activeTab === 'bank-accounts' && canFinance,
    ...adminQueryDefaults,
  });

  const { data: supportData = { messages: [], total: 0, page: 1 }, isLoading: supportLoading, refetch: refetchSupport } = useQuery({
    queryKey: ['adminSupport', supportPage, supportFilter, getTabSearchQuery('support')],
    queryFn: () => api(`/admin/support/messages?page=${supportPage}&limit=${pageSize}${supportFilter && supportFilter !== 'all' ? `&status=${supportFilter}` : ''}${getTabSearchQuery('support') ? `&search=${encodeURIComponent(getTabSearchQuery('support'))}` : ''}`),
    enabled: activeTab === 'support' && canSupport,
    ...adminQueryDefaults,
  });

  const { data: adminsData = { admins: [], total: 0, page: 1 }, isLoading: adminsLoading, refetch: refetchAdmins } = useQuery({
    queryKey: ['adminAdmins', adminsPage, adminSearchQuery],
    queryFn: () => api(`/admin/admins?page=${adminsPage}&limit=${pageSize}${adminSearchQuery ? `&search=${encodeURIComponent(adminSearchQuery)}` : ''}`),
    enabled: (activeTab === 'admins' || activeTab === 'admin-activity') && canSuper,
    ...adminQueryDefaults,
  });

  const { data: settingsDataFromAPI, isLoading: settingsLoading, refetch: refetchSettings } = useQuery({
    queryKey: ['adminSettings'],
    queryFn: () => api('/admin/settings'),
    enabled: activeTab === 'settings' && canSuper,
    ...adminQueryDefaults,
    onSuccess: (data) => {
      if (data) setSystemSettings(data);
    },
  });

  const { data: paymentProviderData, isLoading: paymentProviderLoading, refetch: refetchPaymentProvider } = useQuery({
    queryKey: ['adminPaymentProvider'],
    queryFn: () => api('/admin/payment-provider'),
    enabled: activeTab === 'settings' && canSuper,
    ...adminQueryDefaults,
    onSuccess: (data) => {
      if (data?.collection_provider) setPaymentProvider(data.collection_provider);
    },
  });

  const { data: pinStatusData, isLoading: pinStatusLoading, refetch: refetchPinStatus } = useQuery({
    queryKey: ['adminPinStatus'],
    queryFn: () => api('/admin/security/pin-status'),
    enabled: (['financials', 'settings', 'analytics', 'admin-activity'].includes(activeTab) || profileMenuOpen) && canFinance,
    ...adminQueryDefaults,
  });

  const pinStatus = pinStatusData || null;

  const { data: supportDetailData, isLoading: supportDetailLoading, refetch: refetchSupportDetail } = useQuery({
    queryKey: ['adminSupportDetail', selectedSupport?.id],
    queryFn: () => api(`/admin/support/messages/${selectedSupport.id}`),
    enabled: !!selectedSupport?.id && canSupport,
    ...adminQueryDefaults,
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
    mutationFn: async ({ id, resolution, admin_notes, pin }) =>
      api(`/admin/escrows/${id}/resolve`, { method: 'POST', body: JSON.stringify({ resolution, admin_notes, pin }) }),
    onSuccess: () => {
      refetchEscrows();
      refetchStats();
      setResolvingDispute(null);
      setAdminNotes('');
      setConversationOpen(false);
      setConversationLoading(false);
      setConversationError('');
      setConversationData(null);
    },
  });

  const reconcilePendingMutation = useMutation({
    mutationFn: async ({ escrow, pin }) => api('/admin/escrows/reconcile', {
      method: 'POST',
      body: JSON.stringify({
        escrow_id: escrow?.id || null,
        reference: escrow?.payment_reference || null,
        limit: 1,
        pin,
      }),
    }),
    onSuccess: (data) => {
      showSuccess(`Reconciled ${data?.verified || 0} payment(s).`);
      refetchEscrows();
      refetchStats();
    },
    onError: (err) => {
      showError('reconcile-payments', err);
    },
  });

  // ✅ UPDATED: Review KYC mutation
  const reviewKYCMutation = useMutation({
    mutationFn: async ({ id, status, admin_notes, reason, pin }) =>
      api(`/admin/kyc/${id}/review`, { method: 'POST', body: JSON.stringify({ status, admin_notes, reason, pin }) }),
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
    onSuccess: (data) => {
      if (data?.settings) {
        setSystemSettings(data.settings);
      } else {
        refetchSettings();
      }
      showSuccess('Settings updated successfully!');
    },
  });

  const updatePaymentProviderMutation = useMutation({
    mutationFn: async ({ provider, pin }) =>
      api('/admin/payment-provider', { method: 'PATCH', body: JSON.stringify({ collection_provider: provider, pin }) }),
    onSuccess: (data, variables) => {
      const nextProvider = data?.settings?.collection_provider || variables?.provider;
      if (nextProvider) setPaymentProvider(nextProvider);
      showSuccess('Payment provider updated');
      refetchPaymentProvider();
      refetchAudits();
    },
    onError: (err) => {
      showError('payment-provider', err);
    },
  });

  const updateAdminRoleMutation = useMutation({
    mutationFn: async ({ id, role, pin }) =>
      api(`/admin/admins/${id}/role`, { method: 'POST', body: JSON.stringify({ role, pin }) }),
    onSuccess: () => {
      showSuccess('Admin role updated');
      refetchAdmins();
      refetchAudits();
    },
    onError: (err) => {
      showError('admin-role', err);
    },
  });

  const suspendAdminMutation = useMutation({
    mutationFn: async ({ id, suspended, reason, duration_days }) =>
      api(`/admin/admins/${id}/suspend`, { method: 'POST', body: JSON.stringify({ suspended, reason, duration_days }) }),
    onSuccess: () => {
      showSuccess('Admin status updated');
      refetchAdmins();
      refetchAudits();
    },
    onError: (err) => {
      showError('admin-suspend', err);
    },
  });

  const setAdminPinMutation = useMutation({
    mutationFn: async ({ current_pin, new_pin, confirm_pin }) =>
      api('/admin/security/pin', {
        method: 'POST',
        body: JSON.stringify({ current_pin, new_pin, confirm_pin }),
      }),
    onSuccess: () => {
      showSuccess('Admin PIN updated successfully!');
      setPinSetup({ current: '', next: '', confirm: '' });
      setPinSetupError('');
      refetchPinStatus();
    },
    onError: (err) => {
      let message = err?.message || 'Failed to update PIN';
      try {
        const parsed = JSON.parse(message);
        if (parsed?.error) message = parsed.error;
      } catch (_) {
        // ignore JSON parse errors
      }
      setPinSetupError(message);
      showError('admin-pin', message);
    },
  });

  const verifyAdminPinMutation = useMutation({
    mutationFn: async (pin) => {
      if (!pin) throw new Error('PIN required');
      return api('/admin/security/verify-pin', {
        method: 'POST',
        body: JSON.stringify({ pin }),
      });
    },
    onSuccess: (_, pin) => {
      setAdminActivityUnlocked(true);
      setAdminActivityPin(pin);
      setAdminActivityPinInput('');
      setAdminActivityError('');
    },
    onError: (err) => {
      let message = err?.message || 'Failed to verify PIN';
      try {
        const parsed = JSON.parse(message);
        if (parsed?.error) message = parsed.error;
      } catch (_) {
        // ignore JSON parse errors
      }
      setAdminActivityError(message);
      setAdminActivityUnlocked(false);
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

  const replySupportMutation = useMutation({
    mutationFn: async ({ id, reply }) =>
      api(`/admin/support/messages/${id}/reply`, { method: 'POST', body: JSON.stringify({ reply }) }),
    onSuccess: () => {
      showSuccess('Reply sent');
      refetchSupport();
      refetchSupportDetail();
      refetchStats();
      setSupportReply('');
    },
    onError: (err) => {
      showError('support-reply', err);
    },
  });

  const verifyFinancialsMutation = useMutation({
    mutationFn: async (pin) => {
      if (!pin) throw new Error('PIN required');
      return api('/admin/financials', {
        method: 'POST',
        body: JSON.stringify({ pin }),
      });
    },
    onSuccess: (data, pin) => {
      setFinancialsData(data);
      setFinancialsUnlocked(true);
      setFinancialsPin(pin);
      setFinancialsPinInput('');
      setFinancialsError('');
    },
    onError: (err) => {
      let message = err?.message || 'Failed to verify PIN';
      try {
        const parsed = JSON.parse(message);
        if (parsed?.error) message = parsed.error;
      } catch (_) {
        // ignore JSON parse errors
      }
      setFinancialsError(message);
      setFinancialsUnlocked(false);
      setFinancialsData(null);
    },
  });

  const markVatPaidMutation = useMutation({
    mutationFn: async ({ month }) => {
      if (!financialsPin) throw new Error('PIN required');
      return api('/admin/financials/vat/pay', {
        method: 'POST',
        body: JSON.stringify({ month, pin: financialsPin }),
      });
    },
    onSuccess: () => {
      showSuccess('VAT marked as paid');
      verifyFinancialsMutation.mutate(financialsPin);
    },
    onError: (err) => {
      showError('vat-pay', err);
    },
  });

  // Format currency to Naira
  const formatNaira = (amount) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount || 0);
  };

  const promptForPin = useCallback((actionLabel = 'continue') => {
    const raw = window.prompt(`Enter admin PIN to ${actionLabel}:`);
    if (raw === null) return null;
    const cleaned = String(raw).trim().replace(/\D/g, '');
    if (!/^\d{4,6}$/.test(cleaned)) {
      showError('validation', 'PIN must be 4-6 digits');
      return null;
    }
    return cleaned;
  }, []);

  const getTabBadgeCount = (key) => {
    if (key === 'disputes') return stats.disputes || 0;
    if (key === 'kyc') return stats.pendingKycRequests || 0;
    if (key === 'bank-accounts') return stats.pendingBankAccounts || 0;
    if (key === 'withdrawals') return stats.pendingWithdrawals || 0;
    if (key === 'support') return stats.openSupportMessages || 0;
    return 0;
  };

  const renderAdminPinCard = () => {
    const hasPin = !!pinStatus?.has_pin;
    const lockedUntil = pinStatus?.locked_until ? new Date(pinStatus.locked_until) : null;
    const isLocked = lockedUntil && lockedUntil > new Date();
    const lockMessage = isLocked ? `PIN locked until ${lockedUntil.toLocaleString()}` : '';

    return (
      <div style={{
        background: Colors.cardBackground,
        border: `1px solid ${Colors.border}`,
        borderRadius: '12px',
        padding: '24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <Lock size={20} color={Colors.primary} />
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: Colors.text }}>Admin PIN</h3>
        </div>
        <p style={{ color: Colors.muted, fontSize: '13px', marginBottom: '16px' }}>
          {hasPin ? 'Update your admin PIN to keep financial actions secure.' : 'Set your unique 4–6 digit admin PIN to access financial actions.'}
        </p>
        {pinStatusLoading && (
          <p style={{ color: Colors.muted, fontSize: '12px', marginBottom: '12px' }}>Loading PIN status...</p>
        )}
        {lockMessage && (
          <p style={{ color: Colors.error, fontSize: '12px', marginBottom: '12px' }}>{lockMessage}</p>
        )}
        {pinSetupError && (
          <p style={{ color: Colors.error, fontSize: '12px', marginBottom: '12px' }}>{pinSetupError}</p>
        )}
        {hasPin && (
          <input
            type="password"
            inputMode="numeric"
            maxLength={6}
            placeholder="Current PIN"
            value={pinSetup.current}
            onChange={(e) => setPinSetup((prev) => ({ ...prev, current: e.target.value.replace(/\D/g, '') }))}
            style={{
              width: '100%',
              border: `1px solid ${Colors.border}`,
              background: Colors.background,
              color: Colors.text,
              borderRadius: '8px',
              padding: '10px 12px',
              fontSize: '14px',
              marginBottom: '10px',
            }}
          />
        )}
        <input
          type="password"
          inputMode="numeric"
          maxLength={6}
          placeholder="New PIN (4–6 digits)"
          value={pinSetup.next}
          onChange={(e) => setPinSetup((prev) => ({ ...prev, next: e.target.value.replace(/\D/g, '') }))}
          style={{
            width: '100%',
            border: `1px solid ${Colors.border}`,
            background: Colors.background,
            color: Colors.text,
            borderRadius: '8px',
            padding: '10px 12px',
            fontSize: '14px',
            marginBottom: '10px',
          }}
        />
        <input
          type="password"
          inputMode="numeric"
          maxLength={6}
          placeholder="Confirm New PIN"
          value={pinSetup.confirm}
          onChange={(e) => setPinSetup((prev) => ({ ...prev, confirm: e.target.value.replace(/\D/g, '') }))}
          style={{
            width: '100%',
            border: `1px solid ${Colors.border}`,
            background: Colors.background,
            color: Colors.text,
            borderRadius: '8px',
            padding: '10px 12px',
            fontSize: '14px',
            marginBottom: '12px',
          }}
        />
        <button
          onClick={() => setAdminPinMutation.mutate({
            current_pin: pinSetup.current,
            new_pin: pinSetup.next,
            confirm_pin: pinSetup.confirm,
          })}
          disabled={setAdminPinMutation.isPending || isLocked || !pinSetup.next || !pinSetup.confirm || (hasPin && !pinSetup.current)}
          style={{
            width: '100%',
            background: Colors.primary,
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 16px',
            cursor: setAdminPinMutation.isPending || isLocked ? 'not-allowed' : 'pointer',
            opacity: setAdminPinMutation.isPending || isLocked ? 0.7 : 1,
            fontWeight: '600',
            fontSize: '14px',
          }}
        >
          {setAdminPinMutation.isPending ? 'Saving...' : hasPin ? 'Change PIN' : 'Set PIN'}
        </button>
      </div>
    );
  };

  const getAuditDetails = (details) => {
    if (!details) return null;
    if (typeof details === 'object') return details;
    try {
      return JSON.parse(details);
    } catch (_) {
      return details;
    }
  };

  const getAuditAdminName = (audit) => {
    const name = [audit?.admin_profile?.first_name, audit?.admin_profile?.last_name].filter(Boolean).join(' ');
    return name || audit?.admin_profile?.email || audit?.admin_profile_id || 'System';
  };

  const exportAuditsCsv = () => {
    const rows = [];
    rows.push(['Admin', 'Action', 'Target Type', 'Target ID', 'Details', 'Date']);
    (audits || []).forEach((audit) => {
      const details = getAuditDetails(audit.details);
      const detailText = typeof details === 'string' ? details : JSON.stringify(details || {});
      rows.push([
        getAuditAdminName(audit),
        audit.action || '',
        audit.target_type || '',
        audit.target_id || '',
        detailText || '',
        audit.created_at ? new Date(audit.created_at).toISOString() : '',
      ]);
    });

    const csv = rows
      .map((r) => r.map((v) => `"${String(v || '').replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `admin_activity_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportFinancialsCsv = () => {
    if (!financialsData) return;
    const { overview, vatByMonth, paystackFeesByDay, runnerPayouts, health } = financialsData;

    const rows = [];
    rows.push(['Financial Overview']);
    rows.push(['Total Platform Fees', formatNaira(overview?.platformFees || 0)]);
    rows.push(['VAT Owed', formatNaira(overview?.vatOwed || 0)]);
    rows.push(['VAT Paid', formatNaira(overview?.vatPaid || 0)]);
    rows.push(['Paystack Fees', formatNaira(overview?.paystackFees || 0)]);
    rows.push(['Net Revenue', formatNaira(overview?.netRevenue || 0)]);
    rows.push(['Escrow Balance', formatNaira(overview?.escrowBalance || 0)]);
    rows.push(['Pending Escrow', formatNaira(overview?.pendingEscrow || 0)]);
    rows.push(['Pending Releases', formatNaira(overview?.pendingReleases || 0)]);
    rows.push(['Disputed Funds', formatNaira(overview?.disputedFunds || 0)]);
    rows.push(['Payouts', formatNaira(overview?.payoutsTotal || 0)]);
    rows.push(['Refunded', formatNaira(overview?.refundedTotal || 0)]);
    rows.push([]);

    rows.push(['Financial Health']);
    rows.push(['Total Transactions', health?.totalTransactions || 0]);
    rows.push(['Platform Fees Earned', formatNaira(health?.platformFeesEarned || 0)]);
    rows.push(['VAT Owed', formatNaira(health?.vatOwed || 0)]);
    rows.push(['Paystack Fees', formatNaira(health?.paystackFees || 0)]);
    rows.push(['Net Platform Profit', formatNaira(health?.netProfit || 0)]);
    rows.push([]);

    rows.push(['VAT Tracker']);
    rows.push(['Month', 'Platform Fees', 'VAT', 'Paid', 'Owed', 'Status']);
    (vatByMonth || []).forEach((row) => {
      rows.push([
        row.month,
        formatNaira(row.platformFees || 0),
        formatNaira(row.vat || 0),
        formatNaira(row.paid || 0),
        formatNaira(row.owed || 0),
        row.status || 'Unpaid',
      ]);
    });
    rows.push([]);

    rows.push(['Paystack Fees Tracker (Last 30 Days)']);
    rows.push(['Date', 'Transaction Volume', 'Paystack Fee']);
    (paystackFeesByDay || []).forEach((row) => {
      rows.push([row.date, formatNaira(row.volume || 0), formatNaira(row.fees || 0)]);
    });
    rows.push([]);

    rows.push(['Runner Payout Summary']);
    rows.push(['Runner', 'Jobs Completed', 'Paid']);
    (runnerPayouts || []).forEach((row) => {
      rows.push([row.name || 'Unknown', row.jobs || 0, formatNaira(row.paid || 0)]);
    });

    const csv = rows
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `financials_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const applyUserSearch = () => {
    setUserSearchQuery(userSearchInput.trim());
    setPageForTab('users', 1);
  };

  const applyErrandSearch = () => {
    setErrandSearchQuery(errandSearchInput.trim());
    setPageForTab('errands', 1);
  };

  const applyAuditFilters = () => {
    setAuditFilters({
      admin: auditFilterInput.admin.trim(),
      action: auditFilterInput.action.trim(),
      targetType: auditFilterInput.targetType.trim(),
      dateFrom: auditFilterInput.dateFrom,
      dateTo: auditFilterInput.dateTo,
      search: auditFilterInput.search.trim(),
    });
    setPageForTab(activeTab, 1);
  };

  const resetAuditFilters = () => {
    const cleared = { admin: '', action: '', targetType: '', dateFrom: '', dateTo: '', search: '' };
    setAuditFilterInput(cleared);
    setAuditFilters(cleared);
    setPageForTab(activeTab, 1);
  };

  const applyAdminSearch = () => {
    setAdminSearchQuery(adminSearchInput.trim());
    setPageForTab('admins', 1);
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
    platformFeeBaseTotal: 0,
    vatTotal: 0,
    platformFeeTotal: 0,
    runnerEarningsTotal: 0,
    payoutsTotal: 0,
    pendingWithdrawals: 0,
    pendingBankAccounts: 0,
    pendingKycRequests: 0,
    openSupportMessages: 0,
    monthly: [],
  };

  const feePct = stats.revenue > 0 ? (stats.platformFeeBaseTotal / stats.revenue) * 100 : 0;
  const netProfit = (stats.platformFeeTotal || 0) - (stats.payoutsTotal || 0);
  const monthly = Array.isArray(stats.monthly) ? stats.monthly : [];
  const maxMonthlyValue = monthly.reduce((max, m) => {
    const val = Math.max(m?.revenue || 0, m?.payouts || 0);
    return Math.max(max, val);
  }, 1);

  // Fetch signed URLs for KYC documents (only when reviewing)
  const { data: kycSignedUrlsData, isLoading: loadingSignedUrls } = useQuery({
    queryKey: ['kycSignedUrls', reviewingKYC?.id],
    queryFn: () => api(`/admin/kyc/${reviewingKYC.id}/signed-urls`),
    enabled: !!reviewingKYC?.id && canFinance,
    select: (data) => data?.signed_urls,
    ...adminQueryDefaults,
  });

  const kycSignedUrls = kycSignedUrlsData || null;

  // Get data arrays
  const users = usersData.users || [];
  const errands = errandsData.errands || [];
  const escrows = escrowsData.escrows || [];
  const audits = auditsData.audits || [];
  const admins = adminsData.admins || [];
  const supportMessages = supportData.messages || [];

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
      open: Colors.warning,
      replied: Colors.success,
      closed: Colors.muted,
    };
    return colors[status] || Colors.muted;
  };

  // Pagination helper
  const totalPages = Math.ceil((activeTab === 'users'
    ? usersData.total
    : activeTab === 'errands'
      ? errandsData.total
      : activeTab === 'payments' || activeTab === 'disputes'
        ? escrowsData.total
        : activeTab === 'transactions'
          ? transactionsData.total
          : activeTab === 'kyc'
            ? kycData.total
            : activeTab === 'bank-accounts'
              ? bankAccountsData.total
              : activeTab === 'support'
                ? supportData.total
                : activeTab === 'admins'
                  ? adminsData.total
                  : activeTab === 'admin-activity'
                    ? auditsData.total
                  : auditsData.total
  ) / pageSize);

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
        onClick={() => setPageForTab(activeTab, Math.max(1, activePage - 1))}
        disabled={activePage === 1}
        style={{
          background: activePage === 1 ? Colors.muted : Colors.primary,
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          padding: '8px 12px',
          cursor: activePage === 1 ? 'not-allowed' : 'pointer',
          opacity: activePage === 1 ? 0.5 : 1,
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        <ChevronLeft size={16} /> Previous
      </button>
      <span style={{ color: Colors.text }}>
        Page {activePage} of {totalPages || 1}
      </span>
      <button
        onClick={() => setPageForTab(activeTab, Math.min(totalPages, activePage + 1))}
        disabled={activePage >= totalPages}
        style={{
          background: activePage >= totalPages ? Colors.muted : Colors.primary,
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          padding: '8px 12px',
          cursor: activePage >= totalPages ? 'not-allowed' : 'pointer',
          opacity: activePage >= totalPages ? 0.5 : 1,
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
      ) : statsError ? (
        <div style={{ color: Colors.error, padding: '16px', border: `1px solid ${Colors.error}`, borderRadius: '8px' }}>
          <p>Failed to load dashboard stats: {statsError.message}</p>
          <button onClick={() => refetchStats()} style={{ marginTop: '8px', padding: '8px 16px', background: Colors.primary, color: 'white', border: 'none', borderRadius: '4px' }}>
            Retry
          </button>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
            {[
              { icon: Users, label: 'Total Users', value: statsData?.totalUsers || 0, color: Colors.primary },
              { icon: UserCheck, label: 'Runners', value: statsData?.totalRunners || 0, color: '#8B5CF6' },
              { icon: Briefcase, label: 'Clients', value: statsData?.totalClients || 0, color: '#06B6D4' },
              { icon: Package, label: 'Total Errands', value: statsData?.totalErrands || 0, color: Colors.warning },
              { icon: Activity, label: 'Active Errands', value: statsData?.activeErrands || 0, color: '#10B981' },
              { icon: ShieldAlert, label: 'Active Disputes', value: statsData?.disputes || 0, color: Colors.error },
              { icon: CreditCard, label: 'Total Payments', value: statsData?.totalPayments || 0, color: '#3B82F6', requiresFinance: true },
              { icon: Banknote, label: 'Total Revenue', value: formatNaira(statsData?.revenue || 0), color: Colors.success, requiresFinance: true },
              { icon: BadgePercent, label: 'Platform Fees', value: formatNaira(statsData?.platformFeeBaseTotal || 0), color: '#0EA5E9', requiresFinance: true },
              { icon: AlertCircle, label: 'VAT (7.5%)', value: formatNaira(statsData?.vatTotal || 0), color: '#F97316', requiresFinance: true },
              { icon: BanknoteArrowUp, label: 'Paid Out', value: formatNaira(statsData?.payoutsTotal || 0), color: '#F59E0B', requiresFinance: true },
              { icon: TrendingUp, label: 'Net Profit', value: formatNaira(netProfit), color: '#22C55E', requiresFinance: true },
            ]
              .filter((card) => !card.requiresFinance || canFinance)
              .map((card) => (
                <StatCard key={card.label} icon={card.icon} label={card.label} value={card.value} color={card.color} />
              ))}
          </div>
          
          {canFinance && (
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
                <div>
                  <p style={{ fontSize: '12px', color: Colors.muted, marginBottom: '4px' }}>Platform Fee %</p>
                  <p style={{ fontSize: '20px', fontWeight: '700', color: Colors.text }}>
                    {feePct.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          )}

          {canFinance && (
            <div style={{
              background: Colors.cardBackground,
              border: `1px solid ${Colors.border}`,
              borderRadius: '12px',
              padding: '24px',
              marginTop: '16px'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: Colors.text, marginBottom: '16px' }}>
                Revenue vs Payouts (Last 6 Months)
              </h3>
              {monthly.length === 0 ? (
                <p style={{ color: Colors.muted }}>No data available</p>
              ) : (
                <>
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', fontSize: '12px', color: Colors.muted }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '10px', height: '10px', background: Colors.primary, borderRadius: '2px', display: 'inline-block' }} />
                      Revenue
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '10px', height: '10px', background: Colors.warning, borderRadius: '2px', display: 'inline-block' }} />
                      Payouts
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${monthly.length}, minmax(60px, 1fr))`, gap: '12px', alignItems: 'end', height: '220px' }}>
                    {monthly.map((m) => {
                      const revPct = ((m.revenue || 0) / maxMonthlyValue) * 100;
                      const payPct = ((m.payouts || 0) / maxMonthlyValue) * 100;
                      return (
                        <div key={m.month} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', height: '100%' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '100%' }}>
                            <div style={{ width: '16px', height: `${revPct}%`, background: Colors.primary, borderRadius: '4px' }} />
                            <div style={{ width: '16px', height: `${payPct}%`, background: Colors.warning, borderRadius: '4px' }} />
                          </div>
                          <div style={{ fontSize: '11px', color: Colors.muted }}>{m.month}</div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
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
            value={userSearchInput}
            onChange={(e) => {
              setUserSearchInput(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') applyUserSearch();
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
        <button
          onClick={applyUserSearch}
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
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button
                          onClick={() => navigate(`/admin/users/${user.id}`)}
                          style={{
                            background: Colors.primary,
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '6px 10px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Eye size={14} /> View
                        </button>
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
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination />
        </>
      )}

      {selectedUser && (
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
            background: '#ffffff',
            border: `2px solid ${Colors.primary}`,
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '560px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative',
          }}>
            <button
              onClick={() => setSelectedUser(null)}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'transparent',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: Colors.text,
              }}
            >
              ✕
            </button>

            <h3 style={{ color: Colors.primary, marginBottom: '16px', fontSize: '20px', fontWeight: '700' }}>User Details</h3>

            <div style={{ display: 'grid', gap: '12px' }}>
              <div>
                <p style={{ margin: 0, color: Colors.muted, fontSize: '12px', fontWeight: '600' }}>NAME</p>
                <p style={{ margin: '6px 0 0', color: Colors.text, fontWeight: '600' }}>{selectedUser.full_name || 'N/A'}</p>
              </div>
              <div>
                <p style={{ margin: 0, color: Colors.muted, fontSize: '12px', fontWeight: '600' }}>PROFILE ID</p>
                <p style={{ margin: '6px 0 0', color: Colors.text, fontFamily: 'monospace' }}>{selectedUser.id}</p>
              </div>
              <div>
                <p style={{ margin: 0, color: Colors.muted, fontSize: '12px', fontWeight: '600' }}>USER ID</p>
                <p style={{ margin: '6px 0 0', color: Colors.text, fontFamily: 'monospace' }}>{selectedUser.user_id || 'N/A'}</p>
              </div>
              <div>
                <p style={{ margin: 0, color: Colors.muted, fontSize: '12px', fontWeight: '600' }}>EMAIL</p>
                <p style={{ margin: '6px 0 0', color: Colors.text }}>{selectedUser.email || 'N/A'}</p>
              </div>
              <div>
                <p style={{ margin: 0, color: Colors.muted, fontSize: '12px', fontWeight: '600' }}>PHONE</p>
                <p style={{ margin: '6px 0 0', color: Colors.text }}>{selectedUser.phone_number || 'N/A'}</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <p style={{ margin: 0, color: Colors.muted, fontSize: '12px', fontWeight: '600' }}>ROLE</p>
                  <p style={{ margin: '6px 0 0', color: Colors.text, textTransform: 'capitalize' }}>{selectedUser.role || 'N/A'}</p>
                </div>
                <div>
                  <p style={{ margin: 0, color: Colors.muted, fontSize: '12px', fontWeight: '600' }}>STATUS</p>
                  <p style={{ margin: '6px 0 0', color: Colors.text }}>{selectedUser.suspended ? 'Suspended' : 'Active'}</p>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <p style={{ margin: 0, color: Colors.muted, fontSize: '12px', fontWeight: '600' }}>KYC</p>
                  <p style={{ margin: '6px 0 0', color: Colors.text }}>{selectedUser.kyc_verified ? 'Verified' : 'Not Verified'}</p>
                </div>
                <div>
                  <p style={{ margin: 0, color: Colors.muted, fontSize: '12px', fontWeight: '600' }}>RATING</p>
                  <p style={{ margin: '6px 0 0', color: Colors.text }}>{selectedUser.average_rating ?? 'N/A'}</p>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <p style={{ margin: 0, color: Colors.muted, fontSize: '12px', fontWeight: '600' }}>COMPLETED ERRANDS</p>
                  <p style={{ margin: '6px 0 0', color: Colors.text }}>{selectedUser.completed_errands ?? 0}</p>
                </div>
                <div>
                  <p style={{ margin: 0, color: Colors.muted, fontSize: '12px', fontWeight: '600' }}>CREATED</p>
                  <p style={{ margin: '6px 0 0', color: Colors.text }}>{new Date(selectedUser.created_at).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // RENDER: Financials (PIN Protected)
  const renderFinancials = () => {
    if (!financialsUnlocked) {
      const hasPin = !!pinStatus?.has_pin;
      const lockedUntil = pinStatus?.locked_until ? new Date(pinStatus.locked_until) : null;
      const isLocked = lockedUntil && lockedUntil > new Date();
      const lockMessage = isLocked ? `PIN locked until ${lockedUntil.toLocaleString()}` : '';

      return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}>
          <div style={{ width: '100%', maxWidth: '520px' }}>
            <div style={{
              background: Colors.cardBackground,
              border: `1px solid ${Colors.border}`,
              borderRadius: '12px',
              padding: '24px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <Lock size={20} color={Colors.primary} />
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: Colors.text }}>Financials (PIN Protected)</h3>
              </div>
              <p style={{ color: Colors.muted, fontSize: '13px', marginBottom: '16px' }}>
                Enter your 4–6 digit PIN to access financial data.
              </p>
              {!hasPin && (
                <p style={{ color: Colors.warning, fontSize: '12px', marginBottom: '12px' }}>
                  Please set your admin PIN first in Settings.
                </p>
              )}
              {pinStatusLoading && (
                <p style={{ color: Colors.muted, fontSize: '12px', marginBottom: '12px' }}>Loading PIN status...</p>
              )}
              {lockMessage && (
                <p style={{ color: Colors.error, fontSize: '12px', marginBottom: '12px' }}>{lockMessage}</p>
              )}
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                placeholder="Enter PIN"
                value={financialsPinInput}
                onChange={(e) => setFinancialsPinInput(e.target.value.replace(/\D/g, ''))}
                style={{
                  width: '100%',
                  border: `1px solid ${Colors.border}`,
                  background: Colors.background,
                  color: Colors.text,
                  borderRadius: '8px',
                  padding: '10px 12px',
                  fontSize: '14px',
                  marginBottom: '12px',
                }}
              />
              {financialsError && (
                <p style={{ color: Colors.error, fontSize: '12px', marginBottom: '12px' }}>{financialsError}</p>
              )}
              <button
                onClick={() => verifyFinancialsMutation.mutate(financialsPinInput.trim())}
                disabled={verifyFinancialsMutation.isPending || !financialsPinInput.trim() || isLocked || !hasPin}
                style={{
                  width: '100%',
                  background: Colors.primary,
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 16px',
                  cursor: verifyFinancialsMutation.isPending || isLocked ? 'not-allowed' : 'pointer',
                  opacity: verifyFinancialsMutation.isPending || isLocked ? 0.7 : 1,
                  fontWeight: '600',
                  fontSize: '14px',
                }}
              >
                {verifyFinancialsMutation.isPending ? 'Verifying...' : 'Unlock Financials'}
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (!financialsData) {
      return (
        <div style={{ textAlign: 'center', padding: '24px', color: Colors.muted }}>
          No financial data available.
        </div>
      );
    }

    const overview = financialsData.overview || {};
    const vatByMonth = financialsData.vatByMonth || [];
    const paystackFeesByDay = financialsData.paystackFeesByDay || [];
    const escrowSummary = financialsData.escrowSummary || {};
    const runnerPayouts = financialsData.runnerPayouts || [];
    const health = financialsData.health || {};

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: Colors.text }}>Financials</h2>
            <p style={{ margin: '4px 0 0', color: Colors.muted, fontSize: '12px' }}>
              Sensitive data is protected by PIN. Paystack fees are included where Paystack returns fee data.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => verifyFinancialsMutation.mutate(financialsPin)}
              style={{
                background: Colors.cardBackground,
                color: Colors.text,
                border: `1px solid ${Colors.border}`,
                borderRadius: '8px',
                padding: '8px 12px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '13px',
              }}
            >
              Refresh
            </button>
            <button
              onClick={exportFinancialsCsv}
              style={{
                background: Colors.primary,
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 12px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <FileDown size={14} /> Export CSV
            </button>
            <button
              onClick={() => {
                setFinancialsUnlocked(false);
                setFinancialsPin('');
                setFinancialsData(null);
              }}
              style={{
                background: '#111827',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 12px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Lock size={14} /> Lock
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <StatCard icon={BadgePercent} label="Platform Fees" value={formatNaira(overview.platformFees)} color="#0EA5E9" />
          <StatCard icon={AlertCircle} label="VAT Owed" value={formatNaira(overview.vatOwed)} subtext={`Paid: ${formatNaira(overview.vatPaid || 0)}`} color="#F97316" />
          <StatCard icon={CreditCard} label="Paystack Fees" value={formatNaira(overview.paystackFees)} color="#3B82F6" />
          <StatCard icon={TrendingUp} label="Net Revenue" value={formatNaira(overview.netRevenue)} color="#22C55E" />
          <StatCard icon={Landmark} label="Escrow Balance" value={formatNaira(overview.escrowBalance)} color="#10B981" />
          <StatCard icon={BanknoteArrowUp} label="Pending Releases" value={formatNaira(overview.pendingReleases)} color="#F59E0B" />
        </div>

        <div style={{
          background: Colors.cardBackground,
          border: `1px solid ${Colors.border}`,
          borderRadius: '12px',
          padding: '20px',
        }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: '700', color: Colors.text }}>Financial Health</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div>
              <p style={{ fontSize: '12px', color: Colors.muted, marginBottom: '4px' }}>Total Transactions</p>
              <p style={{ fontSize: '20px', fontWeight: '700', color: Colors.text }}>{health.totalTransactions || 0}</p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: Colors.muted, marginBottom: '4px' }}>Platform Fees Earned</p>
              <p style={{ fontSize: '20px', fontWeight: '700', color: Colors.text }}>{formatNaira(health.platformFeesEarned)}</p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: Colors.muted, marginBottom: '4px' }}>VAT Owed</p>
              <p style={{ fontSize: '20px', fontWeight: '700', color: Colors.text }}>{formatNaira(health.vatOwed)}</p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: Colors.muted, marginBottom: '4px' }}>Net Platform Profit</p>
              <p style={{ fontSize: '20px', fontWeight: '700', color: Colors.text }}>{formatNaira(health.netProfit)}</p>
            </div>
          </div>
        </div>

        <div style={{
          background: Colors.cardBackground,
          border: `1px solid ${Colors.border}`,
          borderRadius: '12px',
          padding: '20px',
        }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: '700', color: Colors.text }}>Escrow / Wallet Summary</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div>
              <p style={{ fontSize: '12px', color: Colors.muted, marginBottom: '4px' }}>Escrow Balance</p>
              <p style={{ fontSize: '20px', fontWeight: '700', color: Colors.text }}>{formatNaira(escrowSummary.escrowBalance)}</p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: Colors.muted, marginBottom: '4px' }}>Pending Releases</p>
              <p style={{ fontSize: '20px', fontWeight: '700', color: Colors.text }}>{formatNaira(escrowSummary.pendingReleases)}</p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: Colors.muted, marginBottom: '4px' }}>Disputed Funds</p>
              <p style={{ fontSize: '20px', fontWeight: '700', color: Colors.text }}>{formatNaira(escrowSummary.disputedFunds)}</p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: Colors.muted, marginBottom: '4px' }}>Refunded</p>
              <p style={{ fontSize: '20px', fontWeight: '700', color: Colors.text }}>{formatNaira(escrowSummary.refundedTotal)}</p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: Colors.muted, marginBottom: '4px' }}>Paid Out</p>
              <p style={{ fontSize: '20px', fontWeight: '700', color: Colors.text }}>{formatNaira(escrowSummary.payoutsTotal)}</p>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ overflowX: 'auto', borderRadius: '8px', border: `1px solid ${Colors.border}`, background: Colors.cardBackground }}>
            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${Colors.border}` }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: Colors.text }}>VAT Tracker</h3>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: Colors.cardBackground, borderBottom: `1px solid ${Colors.border}` }}>
                <tr>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', color: Colors.text }}>Month</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', color: Colors.text }}>Platform Fees</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', color: Colors.text }}>VAT (7.5%)</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', color: Colors.text }}>Paid</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', color: Colors.text }}>Owed</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', color: Colors.text }}>Status</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', color: Colors.text }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {vatByMonth.map((row) => (
                  <tr key={row.month} style={{ borderBottom: `1px solid ${Colors.border}` }}>
                    <td style={{ padding: '10px 12px', fontSize: '13px', color: Colors.text }}>{row.month}</td>
                    <td style={{ padding: '10px 12px', fontSize: '13px', color: Colors.text }}>{formatNaira(row.platformFees)}</td>
                    <td style={{ padding: '10px 12px', fontSize: '13px', color: Colors.text }}>{formatNaira(row.vat)}</td>
                    <td style={{ padding: '10px 12px', fontSize: '13px', color: Colors.text }}>{formatNaira(row.paid || 0)}</td>
                    <td style={{ padding: '10px 12px', fontSize: '13px', color: Colors.text }}>{formatNaira(row.owed || 0)}</td>
                    <td style={{ padding: '10px 12px', fontSize: '12px', color: Colors.muted }}>{row.status || 'Unpaid'}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <button
                        onClick={() => {
                          if (row.owed <= 0) return;
                          if (!window.confirm(`Mark VAT for ${row.month} as paid?`)) return;
                          markVatPaidMutation.mutate({ month: row.month });
                        }}
                        disabled={markVatPaidMutation.isPending || row.owed <= 0}
                        style={{
                          background: row.owed <= 0 ? Colors.border : Colors.primary,
                          color: row.owed <= 0 ? Colors.muted : 'white',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '6px 10px',
                          cursor: row.owed <= 0 ? 'not-allowed' : 'pointer',
                          fontSize: '12px',
                          fontWeight: '600',
                        }}
                      >
                        {row.owed <= 0 ? 'Paid' : (markVatPaidMutation.isPending ? 'Updating...' : 'Mark Paid')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ overflowX: 'auto', borderRadius: '8px', border: `1px solid ${Colors.border}`, background: Colors.cardBackground }}>
            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${Colors.border}` }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: Colors.text }}>Paystack Fees Tracker (30 days)</h3>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: Colors.cardBackground, borderBottom: `1px solid ${Colors.border}` }}>
                <tr>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', color: Colors.text }}>Date</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', color: Colors.text }}>Volume</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', color: Colors.text }}>Paystack Fee</th>
                </tr>
              </thead>
              <tbody>
                {paystackFeesByDay.map((row) => (
                  <tr key={row.date} style={{ borderBottom: `1px solid ${Colors.border}` }}>
                    <td style={{ padding: '10px 12px', fontSize: '13px', color: Colors.text }}>{row.date}</td>
                    <td style={{ padding: '10px 12px', fontSize: '13px', color: Colors.text }}>{formatNaira(row.volume)}</td>
                    <td style={{ padding: '10px 12px', fontSize: '13px', color: Colors.text }}>{formatNaira(row.fees)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ overflowX: 'auto', borderRadius: '8px', border: `1px solid ${Colors.border}`, background: Colors.cardBackground }}>
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${Colors.border}` }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: Colors.text }}>Runner Payout Summary</h3>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: Colors.cardBackground, borderBottom: `1px solid ${Colors.border}` }}>
              <tr>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', color: Colors.text }}>Runner</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', color: Colors.text }}>Jobs Completed</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', color: Colors.text }}>Paid</th>
              </tr>
            </thead>
            <tbody>
              {runnerPayouts.map((row) => (
                <tr key={row.runner_id} style={{ borderBottom: `1px solid ${Colors.border}` }}>
                  <td style={{ padding: '10px 12px', fontSize: '13px', color: Colors.text }}>{row.name}</td>
                  <td style={{ padding: '10px 12px', fontSize: '13px', color: Colors.text }}>{row.jobs}</td>
                  <td style={{ padding: '10px 12px', fontSize: '13px', color: Colors.text }}>{formatNaira(row.paid)}</td>
                </tr>
              ))}
              {runnerPayouts.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ padding: '12px', fontSize: '13px', color: Colors.muted }}>No payout data yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // RENDER: Errands
  const renderErrands = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', gap: '12px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: Colors.muted }} />
          <input
            type="text"
            placeholder="Search by title or ID..."
            value={errandSearchInput}
            onChange={(e) => {
              setErrandSearchInput(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') applyErrandSearch();
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
        <button
          onClick={applyErrandSearch}
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
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button
                          onClick={() => setSelectedErrand(errand)}
                          style={{
                            background: Colors.primary,
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '6px 10px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Eye size={14} /> View
                        </button>
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
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination />
        </>
      )}

      {selectedErrand && (
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
            background: '#ffffff',
            border: `2px solid ${Colors.primary}`,
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '680px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative',
          }}>
            <button
              onClick={() => setSelectedErrand(null)}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'transparent',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: Colors.text,
              }}
            >
              ✕
            </button>

            <h3 style={{ color: Colors.primary, marginBottom: '16px', fontSize: '20px', fontWeight: '700' }}>Errand Details</h3>

            <div style={{ display: 'grid', gap: '12px' }}>
              <div>
                <p style={{ margin: 0, color: Colors.muted, fontSize: '12px', fontWeight: '600' }}>ERRAND ID</p>
                <p style={{ margin: '6px 0 0', color: Colors.text, fontFamily: 'monospace' }}>{selectedErrand.id}</p>
              </div>
              <div>
                <p style={{ margin: 0, color: Colors.muted, fontSize: '12px', fontWeight: '600' }}>TITLE</p>
                <p style={{ margin: '6px 0 0', color: Colors.text, fontWeight: '600' }}>{selectedErrand.title || 'N/A'}</p>
              </div>
              <div>
                <p style={{ margin: 0, color: Colors.muted, fontSize: '12px', fontWeight: '600' }}>DESCRIPTION</p>
                <p style={{ margin: '6px 0 0', color: Colors.text }}>{selectedErrand.description || 'N/A'}</p>
              </div>
              <div>
                <p style={{ margin: 0, color: Colors.muted, fontSize: '12px', fontWeight: '600' }}>LOCATION</p>
                <p style={{ margin: '6px 0 0', color: Colors.text }}>{selectedErrand.location || 'N/A'}</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <p style={{ margin: 0, color: Colors.muted, fontSize: '12px', fontWeight: '600' }}>AMOUNT</p>
                  <p style={{ margin: '6px 0 0', color: Colors.text, fontWeight: '600' }}>{formatNaira(selectedErrand.budget)}</p>
                </div>
                <div>
                  <p style={{ margin: 0, color: Colors.muted, fontSize: '12px', fontWeight: '600' }}>STATUS</p>
                  <p style={{ margin: '6px 0 0', color: Colors.text }}>{selectedErrand.status || 'N/A'}</p>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <p style={{ margin: 0, color: Colors.muted, fontSize: '12px', fontWeight: '600' }}>POSTED BY</p>
                  <p style={{ margin: '6px 0 0', color: Colors.text, fontFamily: 'monospace' }}>{selectedErrand.posted_by || 'N/A'}</p>
                </div>
                <div>
                  <p style={{ margin: 0, color: Colors.muted, fontSize: '12px', fontWeight: '600' }}>ASSIGNED TO</p>
                  <p style={{ margin: '6px 0 0', color: Colors.text, fontFamily: 'monospace' }}>{selectedErrand.assigned_to || 'N/A'}</p>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <p style={{ margin: 0, color: Colors.muted, fontSize: '12px', fontWeight: '600' }}>CREATED</p>
                  <p style={{ margin: '6px 0 0', color: Colors.text }}>{new Date(selectedErrand.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <p style={{ margin: 0, color: Colors.muted, fontSize: '12px', fontWeight: '600' }}>UPDATED</p>
                  <p style={{ margin: '6px 0 0', color: Colors.text }}>{selectedErrand.updated_at ? new Date(selectedErrand.updated_at).toLocaleString() : 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // RENDER: Payments
  const renderPayments = () => {
    const filteredEscrows = escrows.filter((escrow) => {
      if (paymentFilter === 'pending') return escrow.status === 'pending_payment';
      if (paymentFilter === 'solved') return escrow.status && escrow.status !== 'pending_payment';
      return true;
    });

    return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', gap: '12px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: Colors.muted }} />
          <input
            type="text"
            placeholder="Search by errand ID, reference, client, or runner..."
            value={getTabSearchInput('payments')}
            onChange={(e) => {
              setTabSearchInputValue('payments', e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') applyTabSearch('payments');
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
        <button
          onClick={() => applyTabSearch('payments')}
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
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {[
          { key: 'pending', label: 'Pending' },
          { key: 'solved', label: 'Solved' },
          { key: 'all', label: 'All' },
        ].map((filter) => {
          const active = paymentFilter === filter.key;
          return (
            <button
              key={filter.key}
              onClick={() => setPaymentFilter(filter.key)}
              style={{
                padding: '6px 12px',
                borderRadius: '999px',
                border: `1px solid ${active ? Colors.primary : Colors.border}`,
                background: active ? Colors.primary : Colors.cardBackground,
                color: active ? 'white' : Colors.text,
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {filter.label}
            </button>
          );
        })}
      </div>
      {escrowsLoading ? (
        <p style={{ color: Colors.muted }}>Loading escrows...</p>
      ) : filteredEscrows.length === 0 ? (
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
                  <th style={{ padding: '12px', textAlign: 'center', color: Colors.text, fontWeight: '600', fontSize: '12px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEscrows.map((escrow) => (
                  <tr key={escrow.id} style={{ borderBottom: `1px solid ${Colors.border}` }}>
                    <td style={{ padding: '12px', color: Colors.text, fontSize: '12px', fontFamily: 'monospace', maxWidth: '240px', wordBreak: 'break-all' }}>{escrow.errand_id || '—'}</td>
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
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button
                          onClick={() => setSelectedEscrow(escrow)}
                          style={{
                            background: Colors.primary,
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '6px 10px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Eye size={14} /> View
                        </button>
                        <button
                          onClick={() => {
                            const pin = promptForPin('reconcile this payment');
                            if (!pin) return;
                            reconcilePendingMutation.mutate({ escrow, pin });
                          }}
                          disabled={!escrow.payment_reference || reconcilePendingMutation.isPending}
                          style={{
                            background: !escrow.payment_reference ? Colors.muted : Colors.success,
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '6px 10px',
                            cursor: !escrow.payment_reference ? 'not-allowed' : 'pointer',
                            fontSize: '12px',
                            fontWeight: '600',
                            opacity: reconcilePendingMutation.isPending ? 0.7 : 1,
                          }}
                        >
                          {reconcilePendingMutation.isPending ? 'Reconciling...' : 'Reconcile'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination />
        </>
      )}

      {selectedEscrow && (
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
            background: '#ffffff',
            border: `2px solid ${Colors.primary}`,
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '680px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative',
          }}>
            <button
              onClick={() => setSelectedEscrow(null)}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'transparent',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: Colors.text,
              }}
            >
              ✕
            </button>

            <h3 style={{ color: Colors.primary, marginBottom: '16px', fontSize: '20px', fontWeight: '700' }}>Payment Details</h3>

            <div style={{ display: 'grid', gap: '12px' }}>
              <div>
                <p style={{ margin: 0, color: Colors.muted, fontSize: '12px', fontWeight: '600' }}>ESCROW ID</p>
                <p style={{ margin: '6px 0 0', color: Colors.text, fontFamily: 'monospace' }}>{selectedEscrow.id}</p>
              </div>
              <div>
                <p style={{ margin: 0, color: Colors.muted, fontSize: '12px', fontWeight: '600' }}>ERRAND ID</p>
                <p style={{ margin: '6px 0 0', color: Colors.text, fontFamily: 'monospace' }}>{selectedEscrow.errand_id || 'N/A'}</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <p style={{ margin: 0, color: Colors.muted, fontSize: '12px', fontWeight: '600' }}>CLIENT ID</p>
                  <p style={{ margin: '6px 0 0', color: Colors.text, fontFamily: 'monospace' }}>{selectedEscrow.client_id || 'N/A'}</p>
                </div>
                <div>
                  <p style={{ margin: 0, color: Colors.muted, fontSize: '12px', fontWeight: '600' }}>RUNNER ID</p>
                  <p style={{ margin: '6px 0 0', color: Colors.text, fontFamily: 'monospace' }}>{selectedEscrow.runner_id || 'N/A'}</p>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <p style={{ margin: 0, color: Colors.muted, fontSize: '12px', fontWeight: '600' }}>AMOUNT</p>
                  <p style={{ margin: '6px 0 0', color: Colors.text, fontWeight: '600' }}>{formatNaira(selectedEscrow.amount)}</p>
                </div>
                <div>
                  <p style={{ margin: 0, color: Colors.muted, fontSize: '12px', fontWeight: '600' }}>STATUS</p>
                  <p style={{ margin: '6px 0 0', color: Colors.text }}>{selectedEscrow.status || 'N/A'}</p>
                </div>
              </div>
              <div>
                <p style={{ margin: 0, color: Colors.muted, fontSize: '12px', fontWeight: '600' }}>PAYMENT REFERENCE</p>
                <p style={{ margin: '6px 0 0', color: Colors.text, fontFamily: 'monospace' }}>{selectedEscrow.payment_reference || 'N/A'}</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <p style={{ margin: 0, color: Colors.muted, fontSize: '12px', fontWeight: '600' }}>PAID AT</p>
                  <p style={{ margin: '6px 0 0', color: Colors.text }}>{selectedEscrow.paid_at ? new Date(selectedEscrow.paid_at).toLocaleString() : 'N/A'}</p>
                </div>
                <div>
                  <p style={{ margin: 0, color: Colors.muted, fontSize: '12px', fontWeight: '600' }}>RELEASE AT</p>
                  <p style={{ margin: '6px 0 0', color: Colors.text }}>{selectedEscrow.release_at ? new Date(selectedEscrow.release_at).toLocaleString() : 'N/A'}</p>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <p style={{ margin: 0, color: Colors.muted, fontSize: '12px', fontWeight: '600' }}>CREATED</p>
                  <p style={{ margin: '6px 0 0', color: Colors.text }}>{new Date(selectedEscrow.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <p style={{ margin: 0, color: Colors.muted, fontSize: '12px', fontWeight: '600' }}>RUNNER STATUS</p>
                  <p style={{ margin: '6px 0 0', color: Colors.text }}>{selectedEscrow.runner_status || 'N/A'}</p>
                </div>
              </div>
              <div>
                <p style={{ margin: 0, color: Colors.muted, fontSize: '12px', fontWeight: '600' }}>CLIENT STATUS</p>
                <p style={{ margin: '6px 0 0', color: Colors.text }}>{selectedEscrow.client_status || 'N/A'}</p>
              </div>
            </div>

            <div style={{ marginTop: '16px' }}>
              <button
                onClick={() => {
                  const pin = promptForPin('reconcile this payment');
                  if (!pin) return;
                  reconcilePendingMutation.mutate({ escrow: selectedEscrow, pin });
                }}
                disabled={!selectedEscrow.payment_reference || reconcilePendingMutation.isPending}
                style={{
                  background: !selectedEscrow.payment_reference ? Colors.muted : Colors.success,
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '10px 14px',
                  cursor: !selectedEscrow.payment_reference ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  opacity: reconcilePendingMutation.isPending ? 0.7 : 1,
                }}
              >
                {reconcilePendingMutation.isPending ? 'Reconciling...' : 'Reconcile'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
  };

  // RENDER: Disputes
  const renderDisputes = () => {
    const disputes = escrows
      .filter(e => e.dispute_raised_at || e.dispute_resolved_at)
      .sort((a, b) => new Date(b.dispute_raised_at || b.created_at) - new Date(a.dispute_raised_at || a.created_at));
    const filteredDisputes = disputes.filter((dispute) => {
      if (disputeFilter === 'pending') return !dispute.dispute_resolved_at;
      if (disputeFilter === 'solved') return !!dispute.dispute_resolved_at;
      return true;
    });
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: Colors.muted }} />
            <input
              type="text"
              placeholder="Search disputes by errand ID, title, description, client/runner ID, or email..."
              value={getTabSearchInput('disputes')}
              onChange={(e) => {
                setTabSearchInputValue('disputes', e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') applyTabSearch('disputes');
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
          <button
            onClick={() => applyTabSearch('disputes')}
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
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { key: 'pending', label: 'Pending' },
            { key: 'solved', label: 'Solved' },
            { key: 'all', label: 'All' },
          ].map((filter) => {
            const active = disputeFilter === filter.key;
            return (
              <button
                key={filter.key}
                onClick={() => setDisputeFilter(filter.key)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '999px',
                  border: `1px solid ${active ? Colors.primary : Colors.border}`,
                  background: active ? Colors.primary : Colors.cardBackground,
                  color: active ? 'white' : Colors.text,
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
        {escrowsLoading ? (
          <p style={{ color: Colors.muted }}>Loading disputes...</p>
        ) : filteredDisputes.length === 0 ? (
          <p style={{ color: Colors.muted }}>No active disputes</p>
        ) : (
          <>
            <div style={{ overflowX: 'auto', borderRadius: '8px', border: `1px solid ${Colors.border}` }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: Colors.cardBackground, borderBottom: `1px solid ${Colors.border}` }}>
                  <tr>
                    <th style={{ padding: '12px', textAlign: 'left', color: Colors.text, fontWeight: '600', fontSize: '12px' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: Colors.text, fontWeight: '600', fontSize: '12px' }}>Amount</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: Colors.text, fontWeight: '600', fontSize: '12px' }}>Errand</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: Colors.text, fontWeight: '600', fontSize: '12px' }}>Description</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: Colors.text, fontWeight: '600', fontSize: '12px' }}>Client</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: Colors.text, fontWeight: '600', fontSize: '12px' }}>Runner</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: Colors.text, fontWeight: '600', fontSize: '12px' }}>Date</th>
                    <th style={{ padding: '12px', textAlign: 'center', color: Colors.text, fontWeight: '600', fontSize: '12px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDisputes.map((dispute) => (
                    <tr key={dispute.id} style={{ borderBottom: `1px solid ${Colors.border}` }}>
                      <td style={{ padding: '12px', color: Colors.text, fontSize: '12px', fontWeight: '600' }}>
                        {dispute.dispute_resolved_at ? `Resolved (${dispute.status})` : 'Open'}
                      </td>
                      <td style={{ padding: '12px', color: Colors.text, fontSize: '14px', fontWeight: '600' }}>{formatNaira(dispute.amount)}</td>
                      <td style={{ padding: '12px', color: Colors.text, fontSize: '12px', fontFamily: 'monospace', maxWidth: '220px', wordBreak: 'break-all' }}>
                        <div style={{ fontFamily: 'inherit', fontSize: '13px', fontWeight: 600 }}>{dispute.errand_title || '—'}</div>
                        <div style={{ fontFamily: 'monospace', fontSize: '11px', opacity: 0.7 }}>{dispute.errand_id || '—'}</div>
                      </td>
                      <td style={{ padding: '12px', color: Colors.muted, fontSize: '12px', maxWidth: '240px' }}>
                        {dispute.errand_description || '—'}
                      </td>
                      <td style={{ padding: '12px', color: Colors.text, fontSize: '12px', maxWidth: '200px' }}>
                        <div style={{ fontWeight: 600 }}>{dispute.client_name || '—'}</div>
                        <div style={{ fontSize: '11px', opacity: 0.7 }}>{dispute.client_email || '—'}</div>
                      </td>
                      <td style={{ padding: '12px', color: Colors.text, fontSize: '12px', maxWidth: '200px' }}>
                        <div style={{ fontWeight: 600 }}>{dispute.runner_name || '—'}</div>
                        <div style={{ fontSize: '11px', opacity: 0.7 }}>{dispute.runner_email || '—'}</div>
                      </td>
                      <td style={{ padding: '12px', color: Colors.text, fontSize: '12px' }}>{new Date(dispute.dispute_raised_at || dispute.created_at).toLocaleDateString()}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <button
                          onClick={() => openDispute(dispute)}
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
                          {canResolveDisputes ? 'Resolve' : 'View'}
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
              background: '#ffffff',
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
                onClick={() => {
                  setResolvingDispute(null);
                  setAdminNotes('');
                  setConversationOpen(false);
                  setConversationLoading(false);
                  setConversationError('');
                  setConversationData(null);
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

              <h3 style={{ color: Colors.primary, marginBottom: '16px', fontSize: '20px', fontWeight: '700' }}>Dispute Details</h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <p style={{ margin: 0, color: Colors.primary, fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Amount</p>
                  <p style={{ margin: '6px 0 0', color: Colors.text, fontWeight: 700, fontSize: '16px' }}>{formatNaira(resolvingDispute.amount)}</p>
                </div>
                <div>
                  <p style={{ margin: 0, color: Colors.primary, fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Errand</p>
                  <p style={{ margin: '6px 0 0', color: Colors.text, fontFamily: 'monospace', wordBreak: 'break-all' }}>{resolvingDispute.errand_id || '—'}</p>
                </div>
                <div>
                  <p style={{ margin: 0, color: Colors.primary, fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Client</p>
                  <p style={{ margin: '6px 0 0', color: Colors.text, fontFamily: 'monospace', wordBreak: 'break-all' }}>{resolvingDispute.client_id || '—'}</p>
                  <p style={{ margin: '6px 0 0', color: Colors.muted, fontSize: '12px', wordBreak: 'break-all' }}>{resolvingDispute.client_email || '—'}</p>
                </div>
                <div>
                  <p style={{ margin: 0, color: Colors.primary, fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Runner</p>
                  <p style={{ margin: '6px 0 0', color: Colors.text, fontFamily: 'monospace', wordBreak: 'break-all' }}>{resolvingDispute.runner_id || '—'}</p>
                  <p style={{ margin: '6px 0 0', color: Colors.muted, fontSize: '12px', wordBreak: 'break-all' }}>{resolvingDispute.runner_email || '—'}</p>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <p style={{ margin: 0, color: Colors.primary, fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Errand Title</p>
                <p style={{ margin: '6px 0 0', color: Colors.text }}>{resolvingDispute.errand_title || '—'}</p>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <p style={{ margin: 0, color: Colors.primary, fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Errand Description</p>
                <p style={{ margin: '6px 0 0', color: Colors.text, whiteSpace: 'pre-wrap' }}>{resolvingDispute.errand_description || '—'}</p>
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

              {(resolvingDispute.dispute_image_signed_url || resolvingDispute.dispute_image_url) && (
                <div style={{ marginBottom: '16px' }}>
                  <p style={{ margin: 0, color: Colors.primary, fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '8px' }}>Attached Image</p>
                  <a href={resolvingDispute.dispute_image_signed_url || resolvingDispute.dispute_image_url} target="_blank" rel="noreferrer" style={{ display: 'block' }}>
                    <img src={resolvingDispute.dispute_image_signed_url || resolvingDispute.dispute_image_url} alt="dispute" style={{ maxWidth: '100%', maxHeight: '320px', borderRadius: '8px', border: `1px solid ${Colors.border}`, cursor: 'pointer' }} />
                  </a>
                </div>
              )}

              {resolvingDispute.runner_defense_details && (
                <div style={{ marginBottom: '16px', padding: '12px', background: Colors.background, borderRadius: '8px', border: `2px solid ${Colors.primary}` }}>
                  <p style={{ margin: 0, color: Colors.primary, fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '8px' }}>Runner's Defense</p>
                  <p style={{ margin: 0, color: Colors.text, whiteSpace: 'pre-wrap', fontSize: '14px' }}>{resolvingDispute.runner_defense_details}</p>
                  {(resolvingDispute.runner_defense_image_signed_url || resolvingDispute.runner_defense_image_url) && (
                    <a href={resolvingDispute.runner_defense_image_signed_url || resolvingDispute.runner_defense_image_url} target="_blank" rel="noreferrer" style={{ display: 'block', marginTop: '8px' }}>
                      <img src={resolvingDispute.runner_defense_image_signed_url || resolvingDispute.runner_defense_image_url} alt="defense" style={{ maxWidth: '100%', maxHeight: '240px', borderRadius: '8px', cursor: 'pointer' }} />
                    </a>
                  )}
                </div>
              )}

              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                  <p style={{ margin: 0, color: Colors.primary, fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Conversation</p>
                  <button
                    onClick={() => {
                      if (conversationOpen) {
                        setConversationOpen(false);
                      } else {
                        loadConversation();
                      }
                    }}
                    disabled={conversationLoading}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: `1px solid ${Colors.border}`,
                      background: 'transparent',
                      color: Colors.text,
                      cursor: conversationLoading ? 'not-allowed' : 'pointer',
                      fontSize: '12px',
                      fontWeight: 600,
                    }}
                  >
                    {conversationLoading ? 'Loading...' : (conversationOpen ? 'Hide Conversation' : 'View Conversation')}
                  </button>
                </div>

                {conversationError && (
                  <p style={{ margin: '8px 0 0', color: Colors.error, fontSize: '12px' }}>
                    {conversationError}
                  </p>
                )}

                {conversationOpen && (
                  <div style={{ marginTop: '10px', padding: '12px', background: Colors.background, borderRadius: '8px', border: `1px solid ${Colors.border}` }}>
                    <div style={{ fontSize: '12px', color: Colors.muted, marginBottom: '10px', display: 'grid', gap: '4px' }}>
                      <div>
                        <strong style={{ color: Colors.text }}>Client:</strong>{' '}
                        {conversationClient?.name || conversationClient?.email || conversationEscrow?.client_id || '—'}
                      </div>
                      <div>
                        <strong style={{ color: Colors.text }}>Runner:</strong>{' '}
                        {conversationRunner?.name || conversationRunner?.email || conversationEscrow?.runner_id || '—'}
                      </div>
                    </div>

                    {conversationMessages.length === 0 ? (
                      <p style={{ margin: 0, color: Colors.muted, fontSize: '13px' }}>No messages found for this errand.</p>
                    ) : (
                      <div style={{ display: 'grid', gap: '8px' }}>
                        {conversationMessages.map((msg) => {
                          const isClient = msg.sender_id === conversationEscrow?.client_id;
                          const sender = isClient ? conversationClient : conversationRunner;
                          const senderLabel = isClient ? 'Client' : 'Runner';
                          const senderText = sender?.name || sender?.email || msg.sender_id;
                          return (
                            <div key={msg.id} style={{ padding: '10px', borderRadius: '8px', border: `1px solid ${Colors.border}`, background: '#ffffff' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', fontSize: '12px', color: Colors.muted, marginBottom: '6px' }}>
                                <span style={{ color: Colors.text, fontWeight: 600 }}>{senderLabel}: {senderText}</span>
                                <span>{new Date(msg.created_at).toLocaleString()}</span>
                              </div>
                              {msg.type && msg.type !== 'text' && (
                                <div style={{ fontSize: '11px', color: Colors.muted, marginBottom: '6px' }}>
                                  Type: {msg.type}
                                </div>
                              )}
                              <div style={{ fontSize: '14px', color: Colors.text, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                {msg.content || '—'}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '16px' }}>
                <p style={{ margin: 0, color: Colors.primary, fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '8px' }}>Admin Notes (optional)</p>
                <textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} placeholder="Add notes for this decision..." style={{ width: '100%', minHeight: '80px', padding: '10px', borderRadius: '8px', border: `1px solid ${Colors.border}`, background: Colors.background, color: Colors.text, fontSize: '16px', fontFamily: 'inherit' }} />
              </div>

              {canResolveDisputes ? (
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                {['released', 'refunded'].map((res) => (
                  <button
                    key={res}
                    onClick={() => {
                      const pin = promptForPin(`resolve this dispute as ${res}`);
                      if (!pin) return;
                      resolveDisputeMutation.mutate({
                        id: resolvingDispute.id,
                        resolution: res,
                        admin_notes: adminNotes,
                        pin,
                      });
                    }}
                    disabled={resolveDisputeMutation.isPending}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      border: 'none',
                      background: Colors.primary,
                      color: 'white',
                      cursor: 'pointer',
                      fontWeight: 700,
                      textTransform: 'capitalize',
                      opacity: resolveDisputeMutation.isPending ? 0.6 : 1,
                    }}
                  >
                    {resolveDisputeMutation.isPending ? 'Processing...' : res}
                  </button>
                ))}
                </div>
              ) : (
                <p style={{ color: Colors.muted, fontSize: '13px', marginBottom: '8px' }}>
                  You have view-only access for disputes.
                </p>
              )}

              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => {
                  setResolvingDispute(null);
                  setAdminNotes('');
                  setConversationOpen(false);
                  setConversationLoading(false);
                  setConversationError('');
                  setConversationData(null);
                }} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `1px solid ${Colors.border}`, background: 'transparent', color: Colors.text, cursor: 'pointer', fontWeight: 600 }}>Close for Now</button>
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
      <div style={{ display: 'flex', gap: '12px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: Colors.muted }} />
          <input
            type="text"
            placeholder="Search by reference, user, escrow, or status..."
            value={getTabSearchInput('transactions')}
            onChange={(e) => {
              setTabSearchInputValue('transactions', e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') applyTabSearch('transactions');
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
        <button
          onClick={() => applyTabSearch('transactions')}
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
                  <th style={{ padding: '12px', textAlign: 'left', color: Colors.text, fontWeight: '600', fontSize: '12px' }}>Reference</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: Colors.text, fontWeight: '600', fontSize: '12px' }}>Paystack ID</th>
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
                    <td style={{ padding: '12px', color: Colors.text, fontSize: '12px', fontFamily: 'monospace' }}>
                      {tx.reference || '—'}
                    </td>
                    <td style={{ padding: '12px', color: Colors.text, fontSize: '12px', fontFamily: 'monospace' }}>
                      {tx.paystack_transaction_id || '—'}
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

  // RENDER: Support
  const renderSupport = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
        {['open', 'replied', 'all'].map((status) => (
          <button
            key={status}
            onClick={() => {
              setSupportFilter(status);
              setPageForTab('support', 1);
            }}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              background: supportFilter === status ? Colors.primary : Colors.cardBackground,
              color: supportFilter === status ? 'white' : Colors.text,
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

      <div style={{ display: 'flex', gap: '12px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: Colors.muted }} />
          <input
            type="text"
            placeholder="Search by name, email, subject, or message..."
            value={getTabSearchInput('support')}
            onChange={(e) => {
              setTabSearchInputValue('support', e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') applyTabSearch('support');
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
        <button
          onClick={() => applyTabSearch('support')}
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

      {supportLoading ? (
        <p style={{ color: Colors.muted }}>Loading support messages...</p>
      ) : supportMessages.length === 0 ? (
        <p style={{ color: Colors.muted }}>No support messages found</p>
      ) : (
        <>
          <div style={{ overflowX: 'auto', borderRadius: '8px', border: `1px solid ${Colors.border}` }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: Colors.cardBackground, borderBottom: `1px solid ${Colors.border}` }}>
                <tr>
                  <th style={{ padding: '12px', textAlign: 'left', color: Colors.text, fontWeight: '600', fontSize: '12px' }}>Name</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: Colors.text, fontWeight: '600', fontSize: '12px' }}>Email</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: Colors.text, fontWeight: '600', fontSize: '12px' }}>Subject</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: Colors.text, fontWeight: '600', fontSize: '12px' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: Colors.text, fontWeight: '600', fontSize: '12px' }}>Date</th>
                  <th style={{ padding: '12px', textAlign: 'center', color: Colors.text, fontWeight: '600', fontSize: '12px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {supportMessages.map((msg) => (
                  <tr key={msg.id} style={{ borderBottom: `1px solid ${Colors.border}` }}>
                    <td style={{ padding: '12px', color: Colors.text, fontSize: '14px' }}>{msg.name || 'Anonymous'}</td>
                    <td style={{ padding: '12px', color: Colors.text, fontSize: '12px' }}>{msg.email || '—'}</td>
                    <td style={{ padding: '12px', color: Colors.text, fontSize: '14px' }}>{msg.subject || 'General'}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: getStatusColor(msg.status),
                        color: 'white',
                      }}>
                        {msg.status || 'open'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', color: Colors.text, fontSize: '14px' }}>{new Date(msg.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button
                        onClick={() => {
                          setSelectedSupport(msg);
                          setSupportReply('');
                        }}
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
                        View / Reply
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

      {selectedSupport && (
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
            background: '#ffffff',
            border: `2px solid ${Colors.primary}`,
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '720px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative',
          }}>
            <button
              onClick={() => {
                setSelectedSupport(null);
                setSupportReply('');
              }}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'transparent',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: Colors.text,
              }}
            >
              ✕
            </button>

            <h3 style={{ color: Colors.primary, marginBottom: '16px', fontSize: '20px', fontWeight: '700' }}>Support Message</h3>

            {supportDetailLoading ? (
              <p style={{ color: Colors.muted }}>Loading message...</p>
            ) : (
              <>
                <div style={{ display: 'grid', gap: '10px', marginBottom: '16px' }}>
                  <div>
                    <p style={{ margin: 0, color: Colors.muted, fontSize: '12px', fontWeight: '600' }}>FROM</p>
                    <p style={{ margin: '6px 0 0', color: Colors.text, fontWeight: '600' }}>
                      {(supportDetailData?.message?.name || selectedSupport.name || 'Anonymous')} · {(supportDetailData?.message?.email || selectedSupport.email || '—')}
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: 0, color: Colors.muted, fontSize: '12px', fontWeight: '600' }}>SUBJECT</p>
                    <p style={{ margin: '6px 0 0', color: Colors.text }}>{supportDetailData?.message?.subject || selectedSupport.subject || 'General'}</p>
                  </div>
                  <div>
                    <p style={{ margin: 0, color: Colors.muted, fontSize: '12px', fontWeight: '600' }}>MESSAGE</p>
                    <p style={{ margin: '6px 0 0', color: Colors.text, whiteSpace: 'pre-wrap' }}>{supportDetailData?.message?.message || selectedSupport.message}</p>
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <p style={{ margin: 0, color: Colors.muted, fontSize: '12px', fontWeight: '600' }}>REPLIES</p>
                  {(supportDetailData?.replies || []).length === 0 ? (
                    <p style={{ margin: '6px 0 0', color: Colors.muted, fontSize: '13px' }}>No replies yet.</p>
                  ) : (
                    <div style={{ display: 'grid', gap: '10px', marginTop: '8px' }}>
                      {(supportDetailData?.replies || []).map((reply) => (
                        <div key={reply.id} style={{ background: Colors.background, border: `1px solid ${Colors.border}`, borderRadius: '8px', padding: '10px' }}>
                          <p style={{ margin: 0, color: Colors.text, whiteSpace: 'pre-wrap' }}>{reply.reply}</p>
                          <p style={{ margin: '6px 0 0', color: Colors.muted, fontSize: '11px' }}>
                            {reply.admin_profile_id || 'Admin'} · {new Date(reply.created_at).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', color: Colors.text, fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>Reply</label>
                  <textarea
                    value={supportReply}
                    onChange={(e) => setSupportReply(e.target.value)}
                    placeholder="Write a reply..."
                    style={{
                      width: '100%',
                      minHeight: '90px',
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

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => {
                      if (!supportReply.trim()) {
                        showError('support-reply', 'Please enter a reply');
                        return;
                      }
                      replySupportMutation.mutate({ id: supportDetailData?.message?.id || selectedSupport.id, reply: supportReply.trim() });
                    }}
                    disabled={replySupportMutation.isPending || !supportReply.trim()}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '8px',
                      border: 'none',
                      background: Colors.primary,
                      color: 'white',
                      cursor: replySupportMutation.isPending || !supportReply.trim() ? 'not-allowed' : 'pointer',
                      fontWeight: '600',
                      fontSize: '14px',
                      opacity: replySupportMutation.isPending || !supportReply.trim() ? 0.6 : 1,
                    }}
                  >
                    {replySupportMutation.isPending ? 'Sending...' : 'Send Reply'}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedSupport(null);
                      setSupportReply('');
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
              </>
            )}
          </div>
        </div>
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
              setPageForTab('kyc', 1);
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
      <div style={{ display: 'flex', gap: '12px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: Colors.muted }} />
          <input
            type="text"
            placeholder="Search by name, email, doc number, or profile..."
            value={getTabSearchInput('kyc')}
            onChange={(e) => {
              setTabSearchInputValue('kyc', e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') applyTabSearch('kyc');
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
        <button
          onClick={() => applyTabSearch('kyc')}
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
            background: '#ffffff',
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
                onClick={() => {
                  const pin = promptForPin('approve this KYC');
                  if (!pin) return;
                  reviewKYCMutation.mutate({
                    id: reviewingKYC.id,
                    status: 'approved',
                    admin_notes: kycAdminNotes,
                    reason: null,
                    pin,
                  });
                }}
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
                  const pin = promptForPin('reject this KYC');
                  if (!pin) return;
                  reviewKYCMutation.mutate({
                    id: reviewingKYC.id,
                    status: 'rejected',
                    admin_notes: kycAdminNotes,
                    reason: kycReviewReason,
                    pin,
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
    const currentProvider = paymentProvider || paymentProviderData?.collection_provider || 'paystack';
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '600px' }}>
        {settingsLoading ? (
          <p style={{ color: Colors.muted }}>Loading settings...</p>
        ) : (
          <>
            {canFinance && renderAdminPinCard()}
            <div style={{ background: Colors.cardBackground, border: `1px solid ${Colors.border}`, borderRadius: '12px', padding: '24px' }}>
              <h3 style={{ color: Colors.text, marginBottom: '8px', fontSize: '18px', fontWeight: '700' }}>Payment Gateway (Collections)</h3>
              <p style={{ color: Colors.muted, fontSize: '13px', marginBottom: '16px' }}>
                Switch the provider used for new incoming payments. This does not affect existing transactions.
              </p>
              {paymentProviderLoading ? (
                <p style={{ color: Colors.muted, fontSize: '13px' }}>Loading payment provider...</p>
              ) : (
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {['paystack', 'flutterwave'].map((provider) => {
                    const isActive = currentProvider === provider;
                    return (
                      <button
                        key={provider}
                        onClick={() => {
                          if (isActive) return;
                          const pin = promptForPin(`switch payment gateway to ${provider}`);
                          if (!pin) return;
                          updatePaymentProviderMutation.mutate({ provider, pin });
                        }}
                        disabled={updatePaymentProviderMutation.isPending}
                        style={{
                          padding: '10px 14px',
                          borderRadius: '10px',
                          border: `1px solid ${isActive ? Colors.primary : Colors.border}`,
                          background: isActive ? Colors.primary : Colors.background,
                          color: isActive ? 'white' : Colors.text,
                          fontWeight: '600',
                          fontSize: '14px',
                          cursor: updatePaymentProviderMutation.isPending ? 'not-allowed' : 'pointer',
                          opacity: updatePaymentProviderMutation.isPending ? 0.7 : 1,
                          textTransform: 'capitalize',
                        }}
                      >
                        {provider}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
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
        </>
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
                    <td style={{ padding: '12px', color: Colors.muted, fontSize: '12px' }}>
                      {audit.details ? (
                        <button
                          onClick={() => setSelectedAudit(audit)}
                          style={{
                            background: Colors.cardBackground,
                            color: Colors.text,
                            border: `1px solid ${Colors.border}`,
                            borderRadius: '6px',
                            padding: '6px 10px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '600',
                          }}
                        >
                          View
                        </button>
                      ) : '-'}
                    </td>
                    <td style={{ padding: '12px', color: Colors.text, fontSize: '14px' }}>{new Date(audit.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination />
        </>
      )}

      {selectedAudit && (
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
            background: '#ffffff',
            border: `2px solid ${Colors.primary}`,
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '720px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative',
          }}>
            <button
              onClick={() => setSelectedAudit(null)}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'transparent',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: Colors.text,
              }}
            >
              ✕
            </button>
            <h3 style={{ color: Colors.primary, marginBottom: '16px', fontSize: '20px', fontWeight: '700' }}>Audit Details</h3>
            <div style={{ display: 'grid', gap: '10px' }}>
              <div>
                <p style={{ margin: 0, color: Colors.muted, fontSize: '12px', fontWeight: '600' }}>ACTION</p>
                <p style={{ margin: '6px 0 0', color: Colors.text, fontWeight: '600' }}>{selectedAudit.action?.replace(/_/g, ' ')}</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <p style={{ margin: 0, color: Colors.muted, fontSize: '12px', fontWeight: '600' }}>TARGET TYPE</p>
                  <p style={{ margin: '6px 0 0', color: Colors.text }}>{selectedAudit.target_type || '—'}</p>
                </div>
                <div>
                  <p style={{ margin: 0, color: Colors.muted, fontSize: '12px', fontWeight: '600' }}>TARGET ID</p>
                  <p style={{ margin: '6px 0 0', color: Colors.text, fontFamily: 'monospace' }}>{selectedAudit.target_id || '—'}</p>
                </div>
              </div>
              <div>
                <p style={{ margin: 0, color: Colors.muted, fontSize: '12px', fontWeight: '600' }}>DATE</p>
                <p style={{ margin: '6px 0 0', color: Colors.text }}>{new Date(selectedAudit.created_at).toLocaleString()}</p>
              </div>
              <div>
                <p style={{ margin: 0, color: Colors.muted, fontSize: '12px', fontWeight: '600' }}>DETAILS</p>
                <pre style={{
                  margin: '8px 0 0',
                  padding: '12px',
                  borderRadius: '8px',
                  border: `1px solid ${Colors.border}`,
                  background: Colors.background,
                  color: Colors.text,
                  fontSize: '12px',
                  whiteSpace: 'pre-wrap',
                }}>
                  {(() => {
                    const details = getAuditDetails(selectedAudit.details);
                    if (!details) return '—';
                    if (typeof details === 'string') return details;
                    try {
                      return JSON.stringify(details, null, 2);
                    } catch (_) {
                      return String(details);
                    }
                  })()}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderAdminActivity = () => {
    if (!adminActivityUnlocked) {
      const lockedUntil = pinStatus?.locked_until ? new Date(pinStatus.locked_until) : null;
      const isLocked = lockedUntil && lockedUntil > new Date();
      const lockMessage = isLocked ? `PIN locked until ${lockedUntil.toLocaleString()}` : '';

      return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}>
          <div style={{
            width: '100%',
            maxWidth: '420px',
            background: Colors.cardBackground,
            border: `1px solid ${Colors.border}`,
            borderRadius: '12px',
            padding: '24px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <Lock size={20} color={Colors.primary} />
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: Colors.text }}>Admin Activity (PIN Required)</h3>
            </div>
            <p style={{ color: Colors.muted, fontSize: '13px', marginBottom: '16px' }}>
              Enter your 4–6 digit PIN to view admin activity.
            </p>
            {lockMessage && (
              <p style={{ color: Colors.error, fontSize: '12px', marginBottom: '12px' }}>{lockMessage}</p>
            )}
            {adminActivityError && (
              <p style={{ color: Colors.error, fontSize: '12px', marginBottom: '12px' }}>{adminActivityError}</p>
            )}
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              placeholder="Enter PIN"
              value={adminActivityPinInput}
              onChange={(e) => setAdminActivityPinInput(e.target.value.replace(/\D/g, ''))}
              style={{
                width: '100%',
                border: `1px solid ${Colors.border}`,
                background: Colors.background,
                color: Colors.text,
                borderRadius: '8px',
                padding: '10px 12px',
                fontSize: '14px',
                marginBottom: '12px',
              }}
            />
            <button
              onClick={() => verifyAdminPinMutation.mutate(adminActivityPinInput.trim())}
              disabled={verifyAdminPinMutation.isPending || !adminActivityPinInput.trim() || isLocked}
              style={{
                width: '100%',
                background: Colors.primary,
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 16px',
                cursor: verifyAdminPinMutation.isPending || isLocked ? 'not-allowed' : 'pointer',
                opacity: verifyAdminPinMutation.isPending || isLocked ? 0.7 : 1,
                fontWeight: '600',
                fontSize: '14px',
              }}
            >
              {verifyAdminPinMutation.isPending ? 'Verifying...' : 'Unlock Admin Activity'}
            </button>
          </div>
        </div>
      );
    }

    return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
        <select
          value={auditFilterInput.admin}
          onChange={(e) => setAuditFilterInput((prev) => ({ ...prev, admin: e.target.value }))}
          style={{
            padding: '8px 12px',
            borderRadius: '8px',
            border: `1px solid ${Colors.border}`,
            background: Colors.cardBackground,
            color: Colors.text,
            fontSize: '13px',
          }}
        >
          <option value="">All Admins</option>
          {admins.map((admin) => (
            <option key={admin.id} value={admin.id}>
              {(admin.full_name || admin.email || admin.id).toString()}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Action (e.g., withdrawal_approved)"
          value={auditFilterInput.action}
          onChange={(e) => setAuditFilterInput((prev) => ({ ...prev, action: e.target.value }))}
          style={{
            padding: '8px 12px',
            borderRadius: '8px',
            border: `1px solid ${Colors.border}`,
            background: Colors.cardBackground,
            color: Colors.text,
            fontSize: '13px',
          }}
        />
        <input
          type="text"
          placeholder="Target type"
          value={auditFilterInput.targetType}
          onChange={(e) => setAuditFilterInput((prev) => ({ ...prev, targetType: e.target.value }))}
          style={{
            padding: '8px 12px',
            borderRadius: '8px',
            border: `1px solid ${Colors.border}`,
            background: Colors.cardBackground,
            color: Colors.text,
            fontSize: '13px',
          }}
        />
        <input
          type="date"
          value={auditFilterInput.dateFrom}
          onChange={(e) => setAuditFilterInput((prev) => ({ ...prev, dateFrom: e.target.value }))}
          style={{
            padding: '8px 12px',
            borderRadius: '8px',
            border: `1px solid ${Colors.border}`,
            background: Colors.cardBackground,
            color: Colors.text,
            fontSize: '13px',
          }}
        />
        <input
          type="date"
          value={auditFilterInput.dateTo}
          onChange={(e) => setAuditFilterInput((prev) => ({ ...prev, dateTo: e.target.value }))}
          style={{
            padding: '8px 12px',
            borderRadius: '8px',
            border: `1px solid ${Colors.border}`,
            background: Colors.cardBackground,
            color: Colors.text,
            fontSize: '13px',
          }}
        />
        <input
          type="text"
          placeholder="Search (target id, details, etc.)"
          value={auditFilterInput.search}
          onChange={(e) => setAuditFilterInput((prev) => ({ ...prev, search: e.target.value }))}
          style={{
            flex: 1,
            minWidth: '200px',
            padding: '8px 12px',
            borderRadius: '8px',
            border: `1px solid ${Colors.border}`,
            background: Colors.cardBackground,
            color: Colors.text,
            fontSize: '13px',
          }}
        />
        <button
          onClick={applyAuditFilters}
          style={{
            background: Colors.primary,
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 12px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '13px',
          }}
        >
          Apply
        </button>
        <button
          onClick={resetAuditFilters}
          style={{
            background: Colors.cardBackground,
            color: Colors.text,
            border: `1px solid ${Colors.border}`,
            borderRadius: '8px',
            padding: '8px 12px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '13px',
          }}
        >
          Reset
        </button>
        <button
          onClick={exportAuditsCsv}
          style={{
            background: Colors.success,
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 12px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '13px',
          }}
        >
          Export CSV
        </button>
      </div>

      {auditsLoading ? (
        <p style={{ color: Colors.muted }}>Loading admin activity...</p>
      ) : audits.length === 0 ? (
        <p style={{ color: Colors.muted }}>No admin activity found</p>
      ) : (
        <>
          <div style={{ overflowX: 'auto', borderRadius: '8px', border: `1px solid ${Colors.border}` }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: Colors.cardBackground, borderBottom: `1px solid ${Colors.border}` }}>
                <tr>
                  <th style={{ padding: '12px', textAlign: 'left', color: Colors.text, fontWeight: '600', fontSize: '12px' }}>Admin</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: Colors.text, fontWeight: '600', fontSize: '12px' }}>Action</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: Colors.text, fontWeight: '600', fontSize: '12px' }}>Target</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: Colors.text, fontWeight: '600', fontSize: '12px' }}>Details</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: Colors.text, fontWeight: '600', fontSize: '12px' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {audits.map((audit) => (
                  <tr key={audit.id} style={{ borderBottom: `1px solid ${Colors.border}` }}>
                    <td style={{ padding: '12px', color: Colors.text, fontSize: '14px' }}>{getAuditAdminName(audit)}</td>
                    <td style={{ padding: '12px', color: Colors.text, fontSize: '14px', fontWeight: '600', textTransform: 'capitalize' }}>{audit.action?.replace(/_/g, ' ')}</td>
                    <td style={{ padding: '12px', color: Colors.text, fontSize: '12px' }}>
                      <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{audit.target_type || '—'}</div>
                      <div style={{ fontFamily: 'monospace' }}>{audit.target_id || '—'}</div>
                    </td>
                    <td style={{ padding: '12px', color: Colors.muted, fontSize: '12px' }}>
                      {audit.details ? (
                        <button
                          onClick={() => setSelectedAudit(audit)}
                          style={{
                            background: Colors.cardBackground,
                            color: Colors.text,
                            border: `1px solid ${Colors.border}`,
                            borderRadius: '6px',
                            padding: '6px 10px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '600',
                          }}
                        >
                          View
                        </button>
                      ) : '-'}
                    </td>
                    <td style={{ padding: '12px', color: Colors.text, fontSize: '14px' }}>{new Date(audit.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination />
        </>
      )}

      {selectedAudit && (
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
            background: '#ffffff',
            border: `2px solid ${Colors.primary}`,
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '720px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative',
          }}>
            <button
              onClick={() => setSelectedAudit(null)}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'transparent',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: Colors.text,
              }}
            >
              ✕
            </button>
            <h3 style={{ color: Colors.primary, marginBottom: '16px', fontSize: '20px', fontWeight: '700' }}>Audit Details</h3>
            <div style={{ display: 'grid', gap: '10px' }}>
              <div>
                <p style={{ margin: 0, color: Colors.muted, fontSize: '12px', fontWeight: '600' }}>ADMIN</p>
                <p style={{ margin: '6px 0 0', color: Colors.text, fontWeight: '600' }}>{getAuditAdminName(selectedAudit)}</p>
              </div>
              <div>
                <p style={{ margin: 0, color: Colors.muted, fontSize: '12px', fontWeight: '600' }}>ACTION</p>
                <p style={{ margin: '6px 0 0', color: Colors.text, fontWeight: '600' }}>{selectedAudit.action?.replace(/_/g, ' ')}</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <p style={{ margin: 0, color: Colors.muted, fontSize: '12px', fontWeight: '600' }}>TARGET TYPE</p>
                  <p style={{ margin: '6px 0 0', color: Colors.text }}>{selectedAudit.target_type || '—'}</p>
                </div>
                <div>
                  <p style={{ margin: 0, color: Colors.muted, fontSize: '12px', fontWeight: '600' }}>TARGET ID</p>
                  <p style={{ margin: '6px 0 0', color: Colors.text, fontFamily: 'monospace' }}>{selectedAudit.target_id || '—'}</p>
                </div>
              </div>
              <div>
                <p style={{ margin: 0, color: Colors.muted, fontSize: '12px', fontWeight: '600' }}>DATE</p>
                <p style={{ margin: '6px 0 0', color: Colors.text }}>{new Date(selectedAudit.created_at).toLocaleString()}</p>
              </div>
              <div>
                <p style={{ margin: 0, color: Colors.muted, fontSize: '12px', fontWeight: '600' }}>DETAILS</p>
                <pre style={{
                  margin: '8px 0 0',
                  padding: '12px',
                  borderRadius: '8px',
                  border: `1px solid ${Colors.border}`,
                  background: Colors.background,
                  color: Colors.text,
                  fontSize: '12px',
                  whiteSpace: 'pre-wrap',
                }}>
                  {(() => {
                    const details = getAuditDetails(selectedAudit.details);
                    if (!details) return '—';
                    if (typeof details === 'string') return details;
                    try {
                      return JSON.stringify(details, null, 2);
                    } catch (_) {
                      return String(details);
                    }
                  })()}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    );
  };

  const renderAdmins = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', gap: '12px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: Colors.muted }} />
          <input
            type="text"
            placeholder="Search by name, email, or admin ID..."
            value={adminSearchInput}
            onChange={(e) => setAdminSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') applyAdminSearch();
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
        <button
          onClick={applyAdminSearch}
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

      {adminsLoading ? (
        <p style={{ color: Colors.muted }}>Loading admins...</p>
      ) : admins.length === 0 ? (
        <p style={{ color: Colors.muted }}>No admins found</p>
      ) : (
        <>
          <div style={{ overflowX: 'auto', borderRadius: '8px', border: `1px solid ${Colors.border}` }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: Colors.cardBackground, borderBottom: `1px solid ${Colors.border}` }}>
                <tr>
                  <th style={{ padding: '12px', textAlign: 'left', color: Colors.text, fontWeight: '600', fontSize: '12px' }}>Name</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: Colors.text, fontWeight: '600', fontSize: '12px' }}>Email</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: Colors.text, fontWeight: '600', fontSize: '12px' }}>Role</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: Colors.text, fontWeight: '600', fontSize: '12px' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: Colors.text, fontWeight: '600', fontSize: '12px' }}>PIN Last Used</th>
                  <th style={{ padding: '12px', textAlign: 'center', color: Colors.text, fontWeight: '600', fontSize: '12px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => {
                  const isSelf = admin.id === profile?.id;
                  return (
                    <tr key={admin.id} style={{ borderBottom: `1px solid ${Colors.border}` }}>
                      <td style={{ padding: '12px', color: Colors.text, fontSize: '14px' }}>{admin.full_name || 'N/A'}</td>
                      <td style={{ padding: '12px', color: Colors.text, fontSize: '12px' }}>{admin.email || 'N/A'}</td>
                      <td style={{ padding: '12px', color: Colors.text, fontSize: '14px' }}>
                        <select
                          value={admin.role}
                          disabled={isSelf || updateAdminRoleMutation.isPending}
                          onChange={(e) => {
                            const newRole = e.target.value;
                            if (newRole === admin.role) return;
                            if (!window.confirm(`Change role for ${admin.email || admin.id} to ${newRole}?`)) return;
                            const pin = promptForPin('change admin role');
                            if (!pin) return;
                            updateAdminRoleMutation.mutate({ id: admin.id, role: newRole, pin });
                          }}
                          style={{
                            padding: '6px 8px',
                            borderRadius: '6px',
                            border: `1px solid ${Colors.border}`,
                            background: Colors.cardBackground,
                            color: Colors.text,
                            fontSize: '13px',
                            cursor: isSelf ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {(() => {
                            const allowed = ['support_admin', 'finance_admin', 'user'];
                            const options = admin.role && !allowed.includes(admin.role)
                              ? [admin.role, ...allowed]
                              : allowed;
                            return options.map((role) => (
                              <option key={role} value={role} disabled={role === 'super_admin' || role === 'admin'}>
                                {role}
                              </option>
                            ));
                          })()}
                        </select>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '600',
                          background: admin.suspended ? Colors.error : Colors.success,
                          color: 'white',
                        }}>
                          {admin.suspended ? 'Suspended' : 'Active'}
                        </span>
                      </td>
                      <td style={{ padding: '12px', color: Colors.text, fontSize: '12px' }}>
                        {admin.admin_pin_last_used_at ? new Date(admin.admin_pin_last_used_at).toLocaleString() : '—'}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button
                            onClick={() => navigate(`/admin/admins/${admin.id}`)}
                            style={{
                              background: Colors.primary,
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '6px 10px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: '600',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <Eye size={14} /> View
                          </button>
                          <button
                            onClick={() => {
                              if (isSelf) return;
                              const reason = window.prompt(`Reason for ${admin.suspended ? 'unsuspending' : 'suspending'} this admin?`);
                              if (reason === null) return;
                              suspendAdminMutation.mutate({
                                id: admin.id,
                                suspended: !admin.suspended,
                                reason,
                              });
                            }}
                            disabled={isSelf || suspendAdminMutation.isPending}
                            style={{
                              background: admin.suspended ? Colors.success : Colors.error,
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '6px 12px',
                              cursor: isSelf ? 'not-allowed' : 'pointer',
                              fontSize: '12px',
                              fontWeight: '600',
                              opacity: isSelf ? 0.6 : 1,
                            }}
                          >
                            {admin.suspended ? 'Unsuspend' : 'Suspend'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
              setPageForTab('bank-accounts', 1);
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
      <div style={{ display: 'flex', gap: '12px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: Colors.muted }} />
          <input
            type="text"
            placeholder="Search by account, bank, or runner..."
            value={getTabSearchInput('bank-accounts')}
            onChange={(e) => {
              setTabSearchInputValue('bank-accounts', e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') applyTabSearch('bank-accounts');
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
        <button
          onClick={() => applyTabSearch('bank-accounts')}
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
            background: '#ffffff',
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

  if (!profile || !isAdminRole(profile.role)) {
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <BrandLogo width={130} height={34} variant="dark" />
              <h1 style={{ fontSize: '32px', fontWeight: '700', color: Colors.text, margin: 0 }}>Admin Dashboard</h1>
            </div>
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setProfileMenuOpen((prev) => !prev)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: Colors.cardBackground,
                  color: Colors.text,
                  border: `1px solid ${Colors.border}`,
                  borderRadius: '999px',
                  padding: '6px 12px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '13px',
                }}
              >
                <UserCircle size={18} />
                {profile?.first_name || profile?.email || 'Admin'}
              </button>

              {profileMenuOpen && (
                <div style={{
                  position: 'absolute',
                  top: '110%',
                  right: 0,
                  width: '320px',
                  background: '#ffffff',
                  border: `1px solid ${Colors.border}`,
                  borderRadius: '12px',
                  padding: '16px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                  zIndex: 50,
                }}>
                  <button
                    onClick={() => setProfileMenuOpen(false)}
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      background: 'transparent',
                      border: 'none',
                      fontSize: '18px',
                      cursor: 'pointer',
                      color: Colors.text,
                    }}
                  >
                    ×
                  </button>
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontWeight: '700', color: Colors.text }}>
                      {`${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'Admin'}
                    </div>
                    <div style={{ fontSize: '12px', color: Colors.muted }}>{profile?.email || '—'}</div>
                    <div style={{ fontSize: '12px', color: Colors.muted, marginTop: '4px', textTransform: 'capitalize' }}>
                      Role: {profile?.role || 'admin'}
                    </div>
                  </div>

                  {canFinance ? (
                    <div style={{ borderTop: `1px solid ${Colors.border}`, paddingTop: '12px' }}>
                      <div style={{ fontWeight: '700', fontSize: '13px', color: Colors.text, marginBottom: '8px' }}>Admin PIN</div>
                      {pinStatusLoading && (
                        <div style={{ fontSize: '12px', color: Colors.muted, marginBottom: '8px' }}>Loading PIN status...</div>
                      )}
                      {pinSetupError && (
                        <div style={{ fontSize: '12px', color: Colors.error, marginBottom: '8px' }}>{pinSetupError}</div>
                      )}
                      {pinStatus?.has_pin && (
                        <input
                          type="password"
                          inputMode="numeric"
                          maxLength={6}
                          placeholder="Current PIN"
                          value={pinSetup.current}
                          onChange={(e) => setPinSetup((prev) => ({ ...prev, current: e.target.value.replace(/\D/g, '') }))}
                          style={{
                            width: '100%',
                            border: `1px solid ${Colors.border}`,
                            background: Colors.background,
                            color: Colors.text,
                            borderRadius: '8px',
                            padding: '8px 10px',
                            fontSize: '12px',
                            marginBottom: '8px',
                          }}
                        />
                      )}
                      <input
                        type="password"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="New PIN"
                        value={pinSetup.next}
                        onChange={(e) => setPinSetup((prev) => ({ ...prev, next: e.target.value.replace(/\D/g, '') }))}
                        style={{
                          width: '100%',
                          border: `1px solid ${Colors.border}`,
                          background: Colors.background,
                          color: Colors.text,
                          borderRadius: '8px',
                          padding: '8px 10px',
                          fontSize: '12px',
                          marginBottom: '8px',
                        }}
                      />
                      <input
                        type="password"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="Confirm New PIN"
                        value={pinSetup.confirm}
                        onChange={(e) => setPinSetup((prev) => ({ ...prev, confirm: e.target.value.replace(/\D/g, '') }))}
                        style={{
                          width: '100%',
                          border: `1px solid ${Colors.border}`,
                          background: Colors.background,
                          color: Colors.text,
                          borderRadius: '8px',
                          padding: '8px 10px',
                          fontSize: '12px',
                          marginBottom: '8px',
                        }}
                      />
                      <button
                        onClick={() => setAdminPinMutation.mutate({
                          current_pin: pinSetup.current,
                          new_pin: pinSetup.next,
                          confirm_pin: pinSetup.confirm,
                        })}
                        disabled={setAdminPinMutation.isPending || !pinSetup.next || !pinSetup.confirm || (pinStatus?.has_pin && !pinSetup.current)}
                        style={{
                          width: '100%',
                          background: Colors.primary,
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '8px 10px',
                          cursor: setAdminPinMutation.isPending ? 'not-allowed' : 'pointer',
                          opacity: setAdminPinMutation.isPending ? 0.7 : 1,
                          fontWeight: '600',
                          fontSize: '12px',
                        }}
                      >
                        {setAdminPinMutation.isPending ? 'Saving...' : (pinStatus?.has_pin ? 'Change PIN' : 'Set PIN')}
                      </button>
                    </div>
                  ) : (
                    <div style={{ borderTop: `1px solid ${Colors.border}`, paddingTop: '12px', fontSize: '12px', color: Colors.muted }}>
                      PIN access not required for your role.
                    </div>
                  )}
                </div>
              )}
            </div>
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
          {tabConfig.filter((tab) => tab.show).map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setPageForTab(tab.key, 1);
              }}
              style={{
                padding: '10px 16px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === tab.key ? Colors.primary : 'transparent',
                color: activeTab === tab.key ? 'white' : Colors.text,
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {tab.label}
              {getTabBadgeCount(tab.key) > 0 && (
                <span
                  style={{
                    background: '#ef4444',
                    color: 'white',
                    borderRadius: '999px',
                    padding: '2px 8px',
                    fontSize: '11px',
                    fontWeight: '700',
                    lineHeight: 1,
                  }}
                >
                  {getTabBadgeCount(tab.key)}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'financials' && canFinance && renderFinancials()}
        {activeTab === 'users' && canSupport && renderUsers()}
        {activeTab === 'errands' && canSupport && renderErrands()}
        {activeTab === 'payments' && canFinance && renderPayments()}
        {activeTab === 'disputes' && canViewDisputes && renderDisputes()}
        {activeTab === 'transactions' && canFinance && renderTransactions()}
        {activeTab === 'kyc' && canFinance && renderKYC()}
        {activeTab === 'bank-accounts' && canFinance && renderBankAccounts()}
        {activeTab === 'withdrawals' && canFinance && <AdminWithdrawals />}
        {activeTab === 'support' && canSupport && renderSupport()}
        {activeTab === 'admin-activity' && canSuper && renderAdminActivity()}
        {activeTab === 'admins' && canSuper && renderAdmins()}
        {activeTab === 'analytics' && canSupport && renderAuditLogs()}
        {activeTab === 'settings' && canSuper && renderSettings()}
      </div>
    </div>
  );
}
