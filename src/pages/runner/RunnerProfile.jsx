//runner profile

import { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { showError, showSuccess } from '../../lib/notify';
import { ThemedText, ThemedCard, ThemedTextInput } from '../../components/ThemedComponents';
import Button from '../../components/Button';
import { FiEdit, FiX, FiLogOut, FiUser, FiCamera, FiCheckCircle, FiAlertCircle, FiClock, FiDollarSign, FiTrendingUp, FiPlus, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import KYCVerificationModal from '../../components/KYCVerificationModal';
import { useQueryClient } from '@tanstack/react-query';

export default function RunnerProfile() {
  const navigate = useNavigate();
  const { theme, Colors } = useTheme();
  const { user, profile, logout } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showKYCModal, setShowKYCModal] = useState(false);

  // Services management state
  const [showServicesModal, setShowServicesModal] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [serviceForm, setServiceForm] = useState({ title: '', description: '', price: '' });

  // Form fields
  const [bio, setBio] = useState('');
  const [address, setAddress] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // review list visibility (show latest only initially)
  const [reviewVisibleCount, setReviewVisibleCount] = useState(1);

  // Bank account fields
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [selectedBankCode, setSelectedBankCode] = useState('');
  const [selectedBankName, setSelectedBankName] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankStatus, setBankStatus] = useState('pending');
  const [bankSearchQuery, setBankSearchQuery] = useState('');
  const [showBankDropdown, setShowBankDropdown] = useState(false);
  const [resolvingAccount, setResolvingAccount] = useState(false);
  const [banksList, setBanksList] = useState([]);

  // ✅ NEW: Fetch earnings summary
  const { data: earningsSummary } = useQuery({
    queryKey: ['earnings-summary', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;

      // Fetch all escrows for this runner
      const { data: escrows, error } = await supabase
        .from('escrow')
        .select('id, amount, runner_earnings, status, withdrawn_at, client_status')
        .eq('runner_id', profile.id);

      if (error) throw error;

      const totalEarned = escrows
        ?.filter(e => e.client_status === 'confirmed')
        ?.reduce((sum, e) => sum + Number(e.runner_earnings || 0), 0) || 0;

      const totalWithdrawn = escrows
        ?.filter(e => e.withdrawn_at)
        ?.reduce((sum, e) => sum + Number(e.runner_earnings || 0), 0) || 0;

      const availableBalance = escrows
        ?.filter(e => 
          (e.status === 'released' || e.status === 'releasable') && 
          e.client_status === 'confirmed' && 
          !e.withdrawn_at
        )
        ?.reduce((sum, e) => sum + Number(e.runner_earnings || 0), 0) || 0;

      return {
        totalEarned,
        totalWithdrawn,
        availableBalance,
        pendingJobs: escrows?.filter(e => 
          e.status === 'funded' && 
          e.client_status !== 'confirmed'
        ).length || 0,
      };
    },
    enabled: !!profile?.id,
  });

  // ✅ NEW: Fetch withdrawal history
  const { data: withdrawalHistory = [] } = useQuery({
    queryKey: ['withdrawal-history', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];

      const { data, error } = await supabase
        .from('withdrawals')
        .select(`
          id,
          amount,
          status,
          reference,
          paystack_transfer_code,
          created_at,
          processed_at,
          escrow_id,
          bank_accounts(bank_name, account_name, account_number)
        `)
        .eq('profile_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.id,
  });

  // Fetch banks from backend
  const { isLoading: banksLoading } = useQuery({
    queryKey: ['banks'],
    queryFn: async () => {
      const apiBase = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${apiBase}/api/bank/list`);
      if (!response.ok) throw new Error('Failed to fetch banks');
      const data = await response.json();
      setBanksList(data.data || []);
      return data.data || [];
    },
  });

  // Fetch reviews (include job title/price via escrow->errand)
  const { data: reviews = [] } = useQuery({
    queryKey: ['reviews', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select(`*, client:client_id(id, first_name, last_name), escrow:escrow_id(id, errand_id)`)
        .eq('runner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      let revs = data || [];

      // attach errand details
      const errandIds = revs.map(r => r.escrow?.errand_id).filter(id => id != null);
      if (errandIds.length) {
        const { data: errandsData } = await supabase
          .from('errands')
          .select('id,title,price')
          .in('id', errandIds);
        const map = new Map((errandsData || []).map(e => [e.id, e]));
        revs = revs.map(r => ({ ...r, errand: map.get(r.escrow?.errand_id) }));
      }

      return revs;
    },
    enabled: !!user,
  });

  // ✨ Fetch services
  const { data: services = [], refetch: refetchServices } = useQuery({
    queryKey: ['services', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('runner_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.id,
  });

  // ✨ Create/Update service mutation
  const servicesMutation = useMutation({
    mutationFn: async (serviceData) => {
      if (editingServiceId) {
        // Update existing service
        const { error } = await supabase
          .from('services')
          .update({
            title: serviceData.title.trim(),
            description: serviceData.description.trim(),
            price: parseFloat(serviceData.price),
          })
          .eq('id', editingServiceId);

        if (error) throw error;
      } else {
        // Create new service
        if (services.length >= 5) {
          throw new Error('You can only add a maximum of 5 services');
        }

        const { error } = await supabase
          .from('services')
          .insert({
            runner_id: profile.id,
            title: serviceData.title.trim(),
            description: serviceData.description.trim(),
            price: parseFloat(serviceData.price),
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      showSuccess(editingServiceId ? 'Service updated successfully' : 'Service added successfully');
      setServiceForm({ title: '', description: '', price: '' });
      setEditingServiceId(null);
      setShowServicesModal(false);
      refetchServices();
    },
    onError: (err) => {
      showError('service', err);
    },
  });

  // ✨ Delete service mutation
  const deleteServiceMutation = useMutation({
    mutationFn: async (serviceId) => {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceId);

      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess('Service deleted successfully');
      refetchServices();
    },
    onError: (err) => {
      showError('delete-service', err);
    },
  });

  // Fetch current KYC status
  const { data: kycStatus, refetch: refetchKYC, isLoading: kycLoading } = useQuery({
    queryKey: ['kyc-status', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;
      const { data } = await supabase
        .from('kyc_requests')
        .select('*')
        .eq('profile_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      return data;
    },
    enabled: !!profile?.id,
  });

  // Fetch bank account
  const { data: bankAccount, refetch: refetchBankAccount } = useQuery({
    queryKey: ['bank-account', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
      return data;
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (profile) {
      setBio(profile.bio || '');
      setAddress(profile.address || '');
      // profile.avatar_url may be a storage path (key) or a full URL.
      // If it's a storage path, convert to a public URL via Supabase storage.
      const av = profile.avatar_url;
      if (av) {
        if (av.startsWith('http')) {
          setAvatarUrl(av);
        } else {
          try {
            const { data } = supabase.storage.from('profiles_avatars').getPublicUrl(av);
            setAvatarUrl(data?.publicUrl || null);
          } catch (e) {
            console.warn('Failed to get public url for avatar:', e?.message || e);
            setAvatarUrl(null);
          }
        }
      } else {
        setAvatarUrl(null);
      }
    }
  }, [profile]);

  // Load bank account data when it's fetched
  useEffect(() => {
    if (bankAccount) {
      setBankAccountNumber(bankAccount.account_number || '');
      setSelectedBankCode(bankAccount.bank_code || '');
      setSelectedBankName(bankAccount.bank_name || '');
      setBankAccountName(bankAccount.account_name || '');
      setBankStatus(bankAccount.status || 'pending');
    }
  }, [bankAccount]);

  // Save profile mutation
  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      setIsEditing(false);
      showSuccess('Profile updated successfully');
    },
    onError: (err) => {
      showError('update-profile', err);
    },
  });

  // Save bank account mutation
  const saveBankMutation = useMutation({
    mutationFn: async (data) => {
      // Recommended approach:
      // - If there is no existing bank account row -> insert new pending row
      // - If existing row is pending -> update that pending row
      // - If existing row is rejected -> keep rejected row and INSERT a new pending row (resubmission)
      // - If existing row is approved -> disallow changes from frontend

      if (!bankAccount?.id) {
        // No existing row - insert
        const { error } = await supabase
          .from('bank_accounts')
          .insert([{
            user_id: user.id,
            ...data,
            status: 'pending',
          }]);

        if (error) throw error;
      } else if (bankAccount.status === 'approved') {
        // Protect approved rows from being modified by frontend
        throw new Error('Approved accounts cannot be modified. Please contact support to make changes.');
      } else if (bankAccount.status === 'rejected') {
        // Keep the rejected record, insert a new pending row for resubmission
        const { error } = await supabase
          .from('bank_accounts')
          .insert([{
            user_id: user.id,
            ...data,
            status: 'pending',
          }]);

        if (error) throw error;
      } else {
        // Pending or other non-final status: update the existing pending row
        const { error } = await supabase
          .from('bank_accounts')
          .update({
            ...data,
            status: 'pending',
          })
          .eq('id', bankAccount.id);

        if (error) throw error;
      }

      await refetchBankAccount();
    },
    onSuccess: () => {
      showSuccess('Bank account saved and pending admin approval');
    },
    onError: (err) => {
      showError('save-bank', err);
    },
  });

  // Resolve account name mutation
  const resolveAccountMutation = useMutation({
    mutationFn: async ({ account_number, bank_code }) => {
      const apiBase = import.meta.env.VITE_API_URL || '';
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;

      const response = await fetch(`${apiBase}/api/bank/resolve-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : undefined,
        },
        body: JSON.stringify({ account_number, bank_code }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to resolve account');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setBankAccountName(data.data.account_name);
      setResolvingAccount(false);
    },
    onError: (err) => {
      showError('resolve-account', err);
      setResolvingAccount(false);
    },
  });

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      setShowLogoutModal(false);
      navigate('/');
      } catch (err) {
      console.error('Logout error:', err);
      showError('logout', 'Failed to log out');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);

      const fileName = `${user.id}-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('profiles_avatars')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('profiles_avatars')
        .getPublicUrl(fileName);

      setAvatarUrl(data.publicUrl);
      await saveMutation.mutateAsync({ avatar_url: data.publicUrl });
    } catch (err) {
      showError('upload-image', err);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await saveMutation.mutateAsync({ bio, address });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBankAccount = async () => {
    if (!bankAccountNumber.trim() || !selectedBankCode || !bankAccountName.trim()) {
      showError('validation', 'Please fill in all bank account fields');
      return;
    }

    setSaving(true);
    try {
      await saveBankMutation.mutateAsync({
        account_number: bankAccountNumber,
        bank_code: selectedBankCode,
        bank_name: selectedBankName,
        account_name: bankAccountName,
      });
    } finally {
      setSaving(false);
    }
  };

  // ✨ Service handlers
  const handleAddService = () => {
    setEditingServiceId(null);
    setServiceForm({ title: '', description: '', price: '' });
    setShowServicesModal(true);
  };

  const handleEditService = (service) => {
    setEditingServiceId(service.id);
    setServiceForm({
      title: service.title,
      description: service.description,
      price: service.price.toString(),
    });
    setShowServicesModal(true);
  };

  const handleSaveService = () => {
    if (!serviceForm.title.trim()) {
      showError('validation', 'Service title is required');
      return;
    }
    if (!serviceForm.description.trim()) {
      showError('validation', 'Service description is required');
      return;
    }
    if (!serviceForm.price || parseFloat(serviceForm.price) <= 0) {
      showError('validation', 'Service price must be greater than 0');
      return;
    }

    servicesMutation.mutate(serviceForm);
  };

  const handleDeleteService = (serviceId) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      deleteServiceMutation.mutate(serviceId);
    }
  };

  // Handle account number change and auto-resolve
  const handleAccountNumberChange = async (value) => {
    setBankAccountNumber(value);

    // Trigger auto-resolve if we have 10 digits and a bank selected
    if (value.length === 10 && /^\d{10}$/.test(value) && selectedBankCode) {
      setResolvingAccount(true);
      resolveAccountMutation.mutate({
        account_number: value,
        bank_code: selectedBankCode,
      });
    }
  };

  // Handle bank selection
  const handleSelectBank = (bankCode, bankName) => {
    setSelectedBankCode(bankCode);
    setSelectedBankName(bankName);
    setShowBankDropdown(false);
    setBankSearchQuery('');

    // If account number already exists, try to resolve again
    if (bankAccountNumber.length === 10 && /^\d{10}$/.test(bankAccountNumber)) {
      setResolvingAccount(true);
      resolveAccountMutation.mutate({
        account_number: bankAccountNumber,
        bank_code: bankCode,
      });
    }
  };

  // Filter banks based on search query
  const filteredBanks = banksList.filter(bank =>
    bank.name.toLowerCase().includes(bankSearchQuery.toLowerCase()) ||
    bank.code.includes(bankSearchQuery)
  );

  const avgRating = profile?.average_rating || 0;

  // Bank status helpers
  const getBankStatusColor = () => {
    if (bankStatus === 'approved') return '#22c55e';
    if (bankStatus === 'rejected') return Colors.error;
    return Colors.warning;
  };

  const getBankStatusIcon = () => {
    if (bankStatus === 'approved') return <FiCheckCircle size={16} color="#22c55e" />;
    if (bankStatus === 'rejected') return <FiAlertCircle size={16} color={Colors.error} />;
    return <FiClock size={16} color={Colors.warning} />;
  };

  const getBankStatusText = () => {
    if (bankStatus === 'approved') return 'Approved';
    if (bankStatus === 'rejected') return 'Rejected';
    return 'Pending approval';
  };

  // KYC helpers
  const getKYCColor = () => {
    if (!kycStatus) return Colors.warning;
    if (kycStatus.status === 'approved') return '#22c55e';
    if (kycStatus.status === 'rejected') return Colors.error;
    if (kycStatus.status === 'pending') return Colors.warning;
    return Colors.muted;
  };

  const getKYCIcon = () => {
    if (!kycStatus) return <FiAlertCircle size={20} color={Colors.warning} />;
    if (kycStatus.status === 'approved') return <FiCheckCircle size={20} color="#22c55e" />;
    if (kycStatus.status === 'rejected') return <FiAlertCircle size={20} color={Colors.error} />;
    if (kycStatus.status === 'pending') return <FiClock size={20} color={Colors.warning} />;
    return <FiAlertCircle size={20} color={Colors.muted} />;
  };

  const getKYCStatusText = () => {
    if (!kycStatus) return 'Not verified - Start verification to unlock withdrawals';
    if (kycStatus.status === 'approved') return 'KYC Verified ✓ - You can withdraw earnings';
    if (kycStatus.status === 'rejected') return 'KYC Rejected - Please resubmit';
    if (kycStatus.status === 'pending') return 'Verification In Progress - Check back soon';
    return 'Unknown status';
  };

  // Simple flag for approved KYC to control UI
  const kycApproved = kycStatus?.status === 'approved';

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}
      >
        <ThemedText
          title
          style={{
            fontSize: '28px',
            fontWeight: 'bold',
            display: 'block',
          }}
        >
          My Profile
        </ThemedText>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setIsEditing(!isEditing)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 6,
            }}
            aria-label={isEditing ? 'Close edit' : 'Edit profile'}
          >
            {isEditing ? <FiX size={20} /> : <FiEdit size={20} />}
          </button>
          <button
            onClick={() => setShowLogoutModal(true)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 6,
            }}
            aria-label="Logout"
          >
            <FiLogOut size={20} color={Colors.warning} />
          </button>
        </div>
      </div>

      {/* Avatar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '24px',
          position: 'relative',
        }}
      >
        <div
          style={{
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            backgroundColor: Colors.primary + '20',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '48px',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Profile"
              style={{ position: 'relative', width: '100%', height: '100%', objectFit: 'cover', display: 'block', zIndex: 2 }}
            />
          ) : (
            <FiUser size={48} color={Colors.primary} style={{ position: 'relative', zIndex: 1 }} />
          )}
          {kycApproved && (
            <div style={{
              position: 'absolute',
              bottom: 6,
              right: 6,
              width: 28,
              height: 28,
              borderRadius: '50%',
              backgroundColor: '#22c55e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
              zIndex: 5,
              pointerEvents: 'none'
            }}>
              <FiCheckCircle size={16} color="#fff" />
            </div>
          )}
        </div>

        {isEditing && (
          <label
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              backgroundColor: Colors.primary,
              color: 'white',
              padding: '8px 12px',
              borderRadius: '20px',
              cursor: uploading ? 'not-allowed' : 'pointer',
              fontSize: '12px',
              fontWeight: '600',
              opacity: uploading ? 0.6 : 1,
            }}
          >
            <FiCamera size={14} />
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploading}
              style={{ display: 'none' }}
            />
          </label>
        )}
      </div>

      {/* Bio */}
      <ThemedCard style={{ marginBottom: '20px' }}>
        <ThemedText
          title
          style={{
            fontSize: '16px',
            fontWeight: '600',
            marginBottom: '12px',
            display: 'block',
          }}
        >
          Bio
        </ThemedText>
        {isEditing ? (
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell clients about yourself..."
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: theme.uiBackground,
              border: `1px solid ${theme.uiBackground}`,
              borderRadius: '8px',
              color: theme.text,
              fontFamily: 'inherit',
              fontSize: '16px',
              minHeight: '100px',
              boxSizing: 'border-box',
              resize: 'vertical',
            }}
          />
        ) : (
          <ThemedText style={{ fontSize: '14px', lineHeight: '1.6', display: 'block' }}>
            {bio || 'No bio added yet'}
          </ThemedText>
        )}
      </ThemedCard>

      {/* Location */}
      <ThemedCard style={{ marginBottom: '20px' }}>
        <ThemedText
          title
          style={{
            fontSize: '16px',
            fontWeight: '600',
            marginBottom: '12px',
            display: 'block',
          }}
        >
          Location
        </ThemedText>
        {isEditing ? (
          <ThemedTextInput
            value={address}
            onChange={(v) => setAddress(v)}
            placeholder="Your location"
          />
        ) : (
          <ThemedText style={{ fontSize: '14px', display: 'block' }}>
            {address || 'Not provided'}
          </ThemedText>
        )}
      </ThemedCard>

      {/* Rating, Reviews & Completed Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '20px' }}>
        <ThemedCard style={{ textAlign: 'center', padding: '16px' }}>
          <ThemedText style={{ fontSize: '12px', opacity: 0.6, marginBottom: '8px', display: 'block' }}>
            Rating
          </ThemedText>
          <ThemedText
            title
            style={{ fontSize: '24px', fontWeight: 'bold', display: 'block' }}
          >
            {avgRating?.toFixed(1) || '—'}
          </ThemedText>
        </ThemedCard>

        <ThemedCard style={{ textAlign: 'center', padding: '16px' }}>
          <ThemedText style={{ fontSize: '12px', opacity: 0.6, marginBottom: '8px', display: 'block' }}>
            Reviews
          </ThemedText>
          <ThemedText
            title
            style={{ fontSize: '24px', fontWeight: 'bold', display: 'block' }}
          >
            {reviews.length}
          </ThemedText>
        </ThemedCard>

        <ThemedCard style={{ textAlign: 'center', padding: '16px' }}>
          <ThemedText style={{ fontSize: '12px', opacity: 0.6, marginBottom: '8px', display: 'block' }}>
            Completed
          </ThemedText>
          <ThemedText
            title
            style={{ fontSize: '24px', fontWeight: 'bold', display: 'block' }}
          >
            {profile?.completed_errands || 0}
          </ThemedText>
        </ThemedCard>
      </div>

      {/* ✅ NEW: Earnings Summary Card */}
      {earningsSummary && (
        <ThemedCard style={{ marginBottom: '20px', background: `linear-gradient(135deg, ${Colors.primary}20 0%, ${Colors.primary}10 100%)`, borderLeft: `4px solid ${Colors.primary}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <FiDollarSign size={20} color={Colors.primary} />
            <ThemedText title style={{ fontSize: '18px', fontWeight: '600', display: 'block', color: Colors.primary }}>
              Earnings Summary
            </ThemedText>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <ThemedText style={{ fontSize: '12px', opacity: 0.6, marginBottom: '4px', display: 'block' }}>
                Total Earned
              </ThemedText>
              <ThemedText title style={{ fontSize: '20px', fontWeight: 'bold', display: 'block', color: Colors.primary }}>
                ₦{earningsSummary.totalEarned.toLocaleString()}
              </ThemedText>
            </div>

            <div>
              <ThemedText style={{ fontSize: '12px', opacity: 0.6, marginBottom: '4px', display: 'block' }}>
                Total Withdrawn
              </ThemedText>
              <ThemedText title style={{ fontSize: '20px', fontWeight: 'bold', display: 'block' }}>
                ₦{earningsSummary.totalWithdrawn.toLocaleString()}
              </ThemedText>
            </div>

            <div>
              <ThemedText style={{ fontSize: '12px', opacity: 0.6, marginBottom: '4px', display: 'block' }}>
                Available Balance
              </ThemedText>
              <ThemedText title style={{ fontSize: '20px', fontWeight: 'bold', display: 'block', color: '#22c55e' }}>
                ₦{earningsSummary.availableBalance.toLocaleString()}
              </ThemedText>
            </div>

            <div>
              <ThemedText style={{ fontSize: '12px', opacity: 0.6, marginBottom: '4px', display: 'block' }}>
                Pending Jobs
              </ThemedText>
              <ThemedText title style={{ fontSize: '20px', fontWeight: 'bold', display: 'block' }}>
                {earningsSummary.pendingJobs}
              </ThemedText>
            </div>
          </div>
        </ThemedCard>
      )}

      {/* Contact Information */}
      <ThemedCard style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '16px' }}>
          <ThemedText
            style={{
              fontSize: '12px',
              opacity: 0.6,
              display: 'block',
              marginBottom: '4px',
              fontWeight: '500',
            }}
          >
            Email
          </ThemedText>
          <ThemedText
            title
            style={{ fontSize: '16px', display: 'block', fontWeight: '600' }}
          >
            {user?.email}
          </ThemedText>
        </div>

        <div
          style={{
            height: '1px',
            backgroundColor: theme.uiBackground,
            margin: '16px 0',
          }}
        />

        {profile && (
          <>
            <div style={{ marginBottom: '16px' }}>
              <ThemedText
                style={{
                  fontSize: '12px',
                  opacity: 0.6,
                  display: 'block',
                  marginBottom: '4px',
                  fontWeight: '500',
                }}
              >
                Full Name
              </ThemedText>
              <ThemedText
                title
                style={{ fontSize: '16px', display: 'block', fontWeight: '600' }}
              >
                {profile.first_name} {profile.last_name}
              </ThemedText>
            </div>

            <div
              style={{
                height: '1px',
                backgroundColor: theme.uiBackground,
                margin: '16px 0',
              }}
            />

            <div style={{ marginBottom: '16px' }}>
              <ThemedText
                style={{
                  fontSize: '12px',
                  opacity: 0.6,
                  display: 'block',
                  marginBottom: '4px',
                  fontWeight: '500',
                }}
              >
                Phone
              </ThemedText>
              <ThemedText
                title
                style={{ fontSize: '16px', display: 'block', fontWeight: '600' }}
              >
                {profile.phone_number || 'Not provided'}
              </ThemedText>
            </div>

            <div
              style={{
                height: '1px',
                backgroundColor: theme.uiBackground,
                margin: '16px 0',
              }}
            />

            <div style={{ marginBottom: '16px' }}>
              <ThemedText
                style={{
                  fontSize: '12px',
                  opacity: 0.6,
                  display: 'block',
                  marginBottom: '4px',
                  fontWeight: '500',
                }}
              >
                Account Type
              </ThemedText>
              <ThemedText
                title
                style={{ fontSize: '16px', display: 'block', fontWeight: '600' }}
              >
                Runner
              </ThemedText>
            </div>
          </>
        )}
      </ThemedCard>

      {/* ✨ Services Management Section */}
      <ThemedCard style={{ marginBottom: '20px', borderLeft: `4px solid ${Colors.primary}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <ThemedText
            title
            style={{ fontSize: '16px', fontWeight: '600', display: 'block' }}
          >
            Services ({services.length}/5)
          </ThemedText>
          {isEditing && services.length < 5 && (
            <button
              onClick={handleAddService}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: Colors.primary,
                fontSize: '18px',
                padding: '4px',
              }}
              aria-label="Add service"
            >
              <FiPlus size={20} />
            </button>
          )}
        </div>

        {services.length === 0 ? (
          <ThemedText style={{ fontSize: '13px', opacity: 0.6, textAlign: 'center', padding: '20px' }}>
            {isEditing 
              ? 'No services yet. Click the + button to add services and let clients hire you directly for specific tasks.'
              : 'No services listed. Ask this runner to add services to their profile.'}
          </ThemedText>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {services.map((service) => (
              <div
                key={service.id}
                style={{
                  padding: '12px',
                  backgroundColor: theme.background,
                  borderRadius: '8px',
                  borderLeft: `3px solid ${Colors.primary}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <ThemedText style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px', display: 'block' }}>
                      {service.title}
                    </ThemedText>
                    <ThemedText style={{ fontSize: '13px', opacity: 0.7, marginBottom: '6px', display: 'block' }}>
                      {service.description}
                    </ThemedText>
                    <ThemedText
                      style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: Colors.primary,
                        display: 'block',
                      }}
                    >
                      ₦{Number(service.price).toLocaleString()}
                    </ThemedText>
                  </div>
                  {isEditing && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleEditService(service)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: Colors.primary,
                        fontSize: '14px',
                        padding: '4px',
                      }}
                      aria-label="Edit service"
                    >
                      <FiEdit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteService(service.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: Colors.error,
                        fontSize: '14px',
                        padding: '4px',
                      }}
                      aria-label="Delete service"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </ThemedCard>

      {/* ✨ Bank Account Card - NEW */}
      <ThemedCard
        style={{
          marginBottom: '20px',
          borderLeft: `4px solid ${getBankStatusColor()}`,
          backgroundColor:
            bankStatus === 'approved'
              ? '#22c55e20'
              : bankStatus === 'rejected'
              ? Colors.error + '20'
              : Colors.warning + '20',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          {getBankStatusIcon()}
          <ThemedText
            title
            style={{ fontSize: '16px', fontWeight: '600', display: 'block', color: getBankStatusColor() }}
          >
            Bank Account
          </ThemedText>
        </div>

        {isEditing ? (
          <>
            {bankStatus === 'approved' ? (
              <>
                <div
                  style={{
                    backgroundColor: '#22c55e20',
                    border: `1px solid #22c55e`,
                    borderRadius: '6px',
                    padding: '16px',
                    marginBottom: '16px',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-start',
                  }}
                >
                  <FiCheckCircle size={20} color="#22c55e" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <ThemedText
                      style={{
                        fontSize: '14px',
                        color: '#22c55e',
                        fontWeight: '600',
                        marginBottom: '8px',
                        display: 'block',
                      }}
                    >
                      Bank Account Verified
                    </ThemedText>
                    <ThemedText
                      style={{
                        fontSize: '13px',
                        color: '#22c55e',
                        lineHeight: '1.5',
                        display: 'block',
                        marginBottom: '12px',
                      }}
                    >
                      Your bank account has been approved and verified. To make changes to your bank account details, please contact our customer support team.
                    </ThemedText>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => window.open('mailto:support@Doabli.com', '_blank')}
                      style={{ width: 'fit-content', backgroundColor: '#22c55e' }}
                    >
                      Contact Support
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Warning Banner */}
                <div
                  style={{
                    backgroundColor: Colors.warning + '20',
                    border: `1px solid ${Colors.warning}`,
                    borderRadius: '6px',
                    padding: '12px',
                    marginBottom: '16px',
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'flex-start',
                  }}
                >
                  <FiAlertCircle size={18} color={Colors.warning} style={{ marginTop: '2px', flexShrink: 0 }} />
                  <ThemedText
                    style={{
                      fontSize: '12px',
                      color: Colors.warning,
                      fontWeight: '500',
                      lineHeight: '1.4',
                    }}
                  >
                    ⚠️ <strong>IMPORTANT:</strong> Your bank account name MUST match your profile name ({profile?.first_name} {profile?.last_name}). 
                    Account name will auto-fill after you enter your account number.
                  </ThemedText>
                </div>

            {/* Bank Selection Dropdown */}
            <div style={{ marginBottom: '16px', position: 'relative' }}>
              <ThemedText
                style={{
                  fontSize: '12px',
                  opacity: 0.6,
                  marginBottom: '6px',
                  display: 'block',
                  fontWeight: '500',
                }}
              >
                Select Bank
              </ThemedText>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Search bank by name or code..."
                  value={bankSearchQuery || selectedBankName}
                  onChange={(e) => {
                    setBankSearchQuery(e.target.value);
                    setShowBankDropdown(true);
                  }}
                  onFocus={() => setShowBankDropdown(true)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${Colors.border || '#ccc'}`,
                    backgroundColor: theme.uiBackground || Colors.cardBackground,
                    color: Colors.text,
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
                
                {showBankDropdown && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      backgroundColor: theme.uiBackground || Colors.cardBackground,
                      border: `1px solid ${Colors.border || '#ccc'}`,
                      borderRadius: '8px',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      zIndex: 10,
                      marginTop: '4px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    }}
                  >
                    {filteredBanks.length > 0 ? (
                      filteredBanks.map((bank) => (
                        <div
                          key={bank.code}
                          onClick={() => handleSelectBank(bank.code, bank.name)}
                          style={{
                            padding: '12px',
                            borderBottom: `1px solid ${Colors.border || '#eee'}`,
                            cursor: 'pointer',
                            backgroundColor: selectedBankCode === bank.code ? Colors.primary + '20' : 'transparent',
                            color: Colors.text,
                            fontSize: '14px',
                          }}
                        >
                          <strong>{bank.name}</strong>
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: '12px', color: Colors.muted, fontSize: '12px' }}>
                        No banks found
                      </div>
                    )}
                  </div>
                )}
              </div>
              {selectedBankName && (
                <ThemedText style={{ fontSize: '12px', opacity: 0.6, marginTop: '4px', display: 'block' }}>
                  Selected: {selectedBankName}
                </ThemedText>
              )}
            </div>

            {/* Account Number Input */}
            <div style={{ marginBottom: '16px' }}>
              <ThemedText
                style={{
                  fontSize: '12px',
                  opacity: 0.6,
                  marginBottom: '6px',
                  display: 'block',
                  fontWeight: '500',
                }}
              >
                Account Number
              </ThemedText>
              <ThemedTextInput
                value={bankAccountNumber}
                onChange={(v) => handleAccountNumberChange(v)}
                placeholder="10-digit account number"
                maxLength="10"
              />
              {resolvingAccount && (
                <ThemedText style={{ fontSize: '12px', opacity: 0.7, marginTop: '4px', display: 'block', color: Colors.primary }}>
                  🔄 Verifying account...
                </ThemedText>
              )}
            </div>

            {/* Account Name (Read-only, auto-filled) */}
            <div style={{ marginBottom: '16px' }}>
              <ThemedText
                style={{
                  fontSize: '12px',
                  opacity: 0.6,
                  marginBottom: '6px',
                  display: 'block',
                  fontWeight: '500',
                }}
              >
                Account Name (Auto-filled)
              </ThemedText>
              <input
                type="text"
                value={bankAccountName}
                disabled
                placeholder="Will auto-fill when you enter account number"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: `1px solid ${Colors.border || '#ccc'}`,
                  backgroundColor: Colors.background || '#f5f5f5',
                  color: Colors.text,
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  opacity: 0.7,
                }}
              />
              <ThemedText
                style={{
                  fontSize: '11px',
                  opacity: 0.5,
                  marginTop: '4px',
                  display: 'block',
                  fontStyle: 'italic',
                }}
              >
                This will match your profile name: {profile?.first_name} {profile?.last_name}
              </ThemedText>
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={handleSaveBankAccount}
              disabled={saving || uploading || !selectedBankCode || !bankAccountNumber || !bankAccountName}
              style={{ width: '100%' }}
            >
              {saving ? 'Saving...' : 'Save Bank Account'}
            </Button>
              </>
            )}
          </>
        ) : bankAccount ? (
          <>
            <div style={{ marginBottom: '12px' }}>
              <ThemedText style={{ fontSize: '12px', opacity: 0.6, marginBottom: '4px', display: 'block' }}>
                Bank
              </ThemedText>
              <ThemedText style={{ fontSize: '14px', fontWeight: '600', display: 'block' }}>
                {selectedBankName}
              </ThemedText>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <ThemedText style={{ fontSize: '12px', opacity: 0.6, marginBottom: '4px', display: 'block' }}>
                Account Name
              </ThemedText>
              <ThemedText style={{ fontSize: '14px', fontWeight: '600', display: 'block' }}>
                {bankAccountName}
              </ThemedText>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <ThemedText style={{ fontSize: '12px', opacity: 0.6, marginBottom: '4px', display: 'block' }}>
                Account Number
              </ThemedText>
              <ThemedText style={{ fontSize: '14px', fontWeight: '600', display: 'block' }}>
                {bankAccountNumber.slice(-4).padStart(bankAccountNumber.length, '•')}
              </ThemedText>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 12px',
                backgroundColor: getBankStatusColor() + '15',
                borderRadius: '6px',
                marginTop: '12px',
              }}
            >
              {getBankStatusIcon()}
              <ThemedText
                style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: getBankStatusColor(),
                }}
              >
                {getBankStatusText()}
              </ThemedText>
            </div>
          </>
        ) : (
          <ThemedText style={{ fontSize: '13px', opacity: 0.7, marginBottom: '12px', display: 'block' }}>
            No bank account added yet. Click edit to add one.
          </ThemedText>
        )}
      </ThemedCard>

      {/* KYC Verification Card */}
      {!kycApproved && (
      <ThemedCard
        style={{
          marginBottom: '20px',
          borderLeft: `4px solid ${getKYCColor()}`,
          backgroundColor:
            kycStatus?.status === 'approved'
              ? '#22c55e20'
              : kycStatus?.status === 'rejected'
              ? Colors.error + '20'
              : kycStatus?.status === 'pending'
              ? Colors.warning + '20'
              : undefined,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          {getKYCIcon()}
          <ThemedText
            title
            style={{ fontSize: '16px', fontWeight: '600', display: 'block', color: getKYCColor() }}
          >
            KYC Verification
          </ThemedText>
        </div>

        {kycLoading ? (
          <ThemedText style={{ fontSize: '13px', opacity: 0.7, marginBottom: '12px', display: 'block' }}>
            Loading verification status...
          </ThemedText>
        ) : !kycStatus ? (
          <>
            <ThemedText style={{ fontSize: '13px', opacity: 0.7, marginBottom: '12px', display: 'block' }}>
              Verify your identity to unlock withdrawals and increase transaction limits.
            </ThemedText>
            <Button
              variant="primary"
              size="md"
              onClick={() => setShowKYCModal(true)}
              style={{ width: '100%' }}
            >
              Start KYC Verification
            </Button>
          </>
        ) : (
          <>
            <ThemedText
              style={{
                fontSize: '13px',
                opacity: 0.8,
                marginBottom: '12px',
                display: 'block',
                color: getKYCColor(),
                fontWeight: '600',
              }}
            >
              {getKYCStatusText()}
            </ThemedText>

            {kycStatus.status === 'rejected' && kycStatus.reason && (
              <ThemedText
                style={{
                  fontSize: '12px',
                  color: Colors.error,
                  marginBottom: '12px',
                  display: 'block',
                  padding: '8px',
                  backgroundColor: Colors.error + '10',
                  borderRadius: '4px',
                }}
              >
                <strong>Reason:</strong> {kycStatus.reason}
              </ThemedText>
            )}

            {kycStatus.status === 'rejected' && (
              <Button
                variant="primary"
                size="md"
                onClick={() => setShowKYCModal(true)}
                style={{ width: '100%', marginTop: '8px' }}
              >
                Resubmit KYC
              </Button>
            )}

            {kycStatus.status === 'pending' && (
              <ThemedText
                style={{
                  fontSize: '12px',
                  opacity: 0.6,
                  marginBottom: '12px',
                  display: 'block',
                  fontStyle: 'italic',
                }}
              >
                Our team is reviewing your documents. This usually takes 24 hours.
              </ThemedText>
            )}
          </>
        )}
      </ThemedCard>
      )}

      {/* ✅ NEW: Withdrawal History */}
      {withdrawalHistory.length > 0 && (
        <ThemedCard style={{ marginBottom: '20px' }}>
          <ThemedText title style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', display: 'block' }}>
            Withdrawal History ({withdrawalHistory.length})
          </ThemedText>

          <div style={{ display: 'grid', gap: '12px' }}>
            {withdrawalHistory.map((withdrawal) => (
              <div key={withdrawal.id} style={{ padding: '12px', backgroundColor: theme.background, borderRadius: '8px', borderLeft: `3px solid ${withdrawal.status === 'success' ? '#22c55e' : withdrawal.status === 'pending' ? Colors.warning : Colors.error}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                  <div>
                    <ThemedText title style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px', display: 'block', color: withdrawal.status === 'success' ? '#22c55e' : Colors.text }}>
                      ₦{Number(withdrawal.amount).toLocaleString()}
                    </ThemedText>
                    <ThemedText style={{ fontSize: '11px', opacity: 0.6, display: 'block' }}>
                      {new Date(withdrawal.created_at).toLocaleDateString()} • {new Date(withdrawal.created_at).toLocaleTimeString()}
                    </ThemedText>
                  </div>
                  <div style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: withdrawal.status === 'success' ? '#22c55e20' : withdrawal.status === 'pending' ? Colors.warning + '20' : Colors.error + '20', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', color: withdrawal.status === 'success' ? '#22c55e' : withdrawal.status === 'pending' ? Colors.warning : Colors.error }}>
                    {withdrawal.status}
                  </div>
                </div>

                {withdrawal.bank_accounts && (
                  <ThemedText style={{ fontSize: '12px', opacity: 0.7, display: 'block', marginBottom: '4px' }}>
                    {withdrawal.bank_accounts.bank_name} - {withdrawal.bank_accounts.account_name}
                  </ThemedText>
                )}

                <ThemedText style={{ fontSize: '11px', opacity: 0.5, display: 'block', fontFamily: 'monospace' }}>
                  Ref: {withdrawal.reference}
                </ThemedText>
                {withdrawal.paystack_transfer_code && (
                  <ThemedText style={{ fontSize: '11px', opacity: 0.5, display: 'block', fontFamily: 'monospace' }}>
                    Paystack ID: {withdrawal.paystack_transfer_code}
                  </ThemedText>
                )}
              </div>
            ))}
          </div>
        </ThemedCard>
      )}

      {/* Reviews */}
      {reviews.length > 0 && (
        <ThemedCard style={{ marginBottom: '20px' }}>
          <ThemedText
            title
            style={{
              fontSize: '16px',
              fontWeight: '600',
              marginBottom: '12px',
              display: 'block',
            }}
          >
            Reviews ({reviews.length})
          </ThemedText>

          <>
            <div style={{ display: 'grid', gap: '12px' }}>
              {reviews.slice(0, reviewVisibleCount).map((review) => (
                <div
                  key={review.id}
                  style={{
                    padding: '12px',
                    backgroundColor: theme.background,
                    borderRadius: '8px',
                  }}
                >
                  {review.errand && (
                    <ThemedText style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
                      Job: {review.errand.title} • ₦{Number(review.errand.price).toLocaleString()}
                    </ThemedText>
                  )}
                  <div
                    style={{
                      display: 'flex',
                      gap: '4px',
                      marginBottom: '6px',
                    }}
                  >
                    {[...Array(5)].map((_, i) => (
                      <span key={i} style={{ color: '#f59e0b' }}>
                        {i < review.rating ? '⭐' : '☆'}
                      </span>
                    ))}
                  </div>
                  {review.comment && (
                    <ThemedText style={{ fontSize: '13px', marginBottom: '4px', display: 'block' }}>
                      {review.comment}
                    </ThemedText>
                  )}
                  <ThemedText style={{ fontSize: '11px', opacity: 0.5, display: 'block' }}>
                    {new Date(review.created_at).toLocaleDateString()}
                  </ThemedText>
                </div>
              ))}
            </div>
            {reviewVisibleCount < reviews.length && (
              <div style={{ textAlign: 'center', marginTop: '12px' }}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReviewVisibleCount((p) => Math.min(reviews.length, p + 3))}
                >
                  Show more
                </Button>
              </div>
            )}
          </>
        </ThemedCard>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'grid', gap: '12px' }}>
        {isEditing && (
          <Button
            variant="primary"
            size="md"
            onClick={handleSaveProfile}
            disabled={saving || uploading}
            style={{ width: '100%' }}
          >
            {saving ? 'Saving...' : 'Save Profile Changes'}
          </Button>
        )}

        <Button
          variant="primary"
          size="md"
          onClick={() => navigate('/runner/home')}
          style={{ width: '100%' }}
        >
          Back to Jobs
        </Button>
      </div>

      {/* ✨ Services Modal */}
      {showServicesModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: Colors.warning + '33',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => !servicesMutation.isPending && setShowServicesModal(false)}
        >
          <ThemedCard
            style={{
              padding: '24px',
              maxWidth: '400px',
              width: '90%',
              borderRadius: '12px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <ThemedText
                title
                style={{
                  fontSize: '18px',
                  fontWeight: '700',
                  display: 'block',
                }}
              >
                {editingServiceId ? 'Edit Service' : 'Add Service'}
              </ThemedText>
              <button
                onClick={() => !servicesMutation.isPending && setShowServicesModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '20px',
                  padding: 0,
                }}
                disabled={servicesMutation.isPending}
              >
                <FiX />
              </button>
            </div>

            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <ThemedText
                  style={{
                    fontSize: '12px',
                    opacity: 0.6,
                    marginBottom: '6px',
                    display: 'block',
                    fontWeight: '500',
                  }}
                >
                  Service Title *
                </ThemedText>
                <ThemedTextInput
                  placeholder="e.g., House Cleaning"
                  value={serviceForm.title}
                  onChange={(value) => setServiceForm({ ...serviceForm, title: value })}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <ThemedText
                  style={{
                    fontSize: '12px',
                    opacity: 0.6,
                    marginBottom: '6px',
                    display: 'block',
                    fontWeight: '500',
                  }}
                >
                  Description *
                </ThemedText>
                <textarea
                  placeholder="Describe what this service includes"
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: `1px solid ${Colors.muted}`,
                    backgroundColor: theme.background,
                    color: theme.text,
                    fontFamily: 'inherit',
                    fontSize: '14px',
                    minHeight: '80px',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div>
                <ThemedText
                  style={{
                    fontSize: '12px',
                    opacity: 0.6,
                    marginBottom: '6px',
                    display: 'block',
                    fontWeight: '500',
                  }}
                >
                  Price (₦) *
                </ThemedText>
                <ThemedTextInput
                  placeholder="e.g., 5000"
                  value={serviceForm.price}
                  onChange={(value) => setServiceForm({ ...serviceForm, price: value })}
                  type="number"
                  min="1"
                  step="100"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: '1fr 1fr', marginTop: '20px' }}>
              <Button
                variant="secondary"
                size="md"
                onClick={() => setShowServicesModal(false)}
                disabled={servicesMutation.isPending}
                style={{ width: '100%' }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleSaveService}
                disabled={servicesMutation.isPending}
                style={{ width: '100%' }}
              >
                {servicesMutation.isPending ? 'Saving...' : 'Save Service'}
              </Button>
            </div>
          </ThemedCard>
        </div>
      )}

      {/* Logout Modal */}
      {showLogoutModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: Colors.warning + '33',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => !isLoggingOut && setShowLogoutModal(false)}
        >
          <ThemedCard
            style={{
              padding: '24px',
              maxWidth: '400px',
              width: '90%',
              borderRadius: '12px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <ThemedText
              title
              style={{
                fontSize: '20px',
                fontWeight: '700',
                marginBottom: '12px',
                display: 'block',
              }}
            >
              Log Out?
            </ThemedText>

            <ThemedText
              style={{
                fontSize: '14px',
                opacity: 0.7,
                marginBottom: '24px',
                display: 'block',
              }}
            >
              Are you sure you want to log out? You'll need to log in again to access your account.
            </ThemedText>

            <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: '1fr 1fr' }}>
              <Button
                variant="primary"
                size="md"
                onClick={() => setShowLogoutModal(false)}
                disabled={isLoggingOut}
                style={{ width: '100%' }}
              >
                Cancel
              </Button>
              <Button
                variant="warning"
                size="md"
                onClick={handleLogout}
                disabled={isLoggingOut}
                style={{ width: '100%', backgroundColor: Colors.warning }}
              >
                {isLoggingOut ? 'Logging out...' : 'Log Out'}
              </Button>
            </div>
          </ThemedCard>
        </div>
      )}

      {/* KYC Modal */}
      <KYCVerificationModal
        isOpen={showKYCModal}
        onClose={() => setShowKYCModal(false)}
        profile={profile}
        onSuccess={() => refetchKYC()}
      />
    </div>
  );
}
