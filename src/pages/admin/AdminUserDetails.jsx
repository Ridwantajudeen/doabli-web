import { useMemo, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { showError, showSuccess } from '../../lib/notify';
import { getApiBase } from '../../lib/apiBase';
import Button from '../../components/Button';
import { FiArrowLeft, FiMail, FiPhone, FiUser, FiShield, FiClock, FiSearch } from 'react-icons/fi';
import { getAdminLevel } from '../../lib/adminAccess';

const maskAccountNumber = (value) => {
  const str = String(value || '');
  if (str.length <= 4) return str;
  return `${'*'.repeat(Math.max(0, str.length - 4))}${str.slice(-4)}`;
};

const formatNaira = (amount) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount || 0);

export default function AdminUserDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { Colors } = useTheme();
  const { profile: adminProfile } = useAuth();
  const apiBase = getApiBase();
  const [activeSection, setActiveSection] = useState('overview');
  const [sectionSearch, setSectionSearch] = useState({});
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const adminLevel = getAdminLevel(adminProfile?.role);
  const canSupport = adminLevel >= 1;
  const canFinance = adminLevel >= 2;
  const adminQueryDefaults = {
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: 'always',
  };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['adminUserDetails', id],
    queryFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      const res = await fetch(`${apiBase}/api/admin/users/${id}/details`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to load user details');
      }
      return res.json();
    },
    enabled: !!id,
    ...adminQueryDefaults,
  });

  const suspendMutation = useMutation({
    mutationFn: async ({ suspended }) => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      const res = await fetch(`${apiBase}/api/admin/users/${id}/suspend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : undefined,
        },
        body: JSON.stringify({ suspended }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update user status');
      }
      return res.json();
    },
    onSuccess: () => {
      showSuccess('User status updated');
      refetch();
    },
    onError: (err) => showError('user-status', err),
  });

  const profile = data?.profile;
  const counts = data?.counts || {};

  const userName = useMemo(() => {
    if (!profile) return 'User';
    const name = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    return name || 'User';
  }, [profile]);

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

  if (isLoading) {
    return <div style={{ padding: '40px', color: Colors.muted }}>Loading user details...</div>;
  }

  if (error || !profile) {
    return (
      <div style={{ padding: '40px' }}>
        <Button variant="secondary" onClick={() => navigate('/admin')} style={{ marginBottom: '16px' }}>
          <FiArrowLeft size={16} /> Back
        </Button>
        <div style={{ color: Colors.error }}>Failed to load user details.</div>
      </div>
    );
  }

  const role = profile?.role || 'user';
  const isClient = role === 'client';
  const isRunner = role === 'runner';

  const sections = [
    { key: 'overview', label: 'Overview' },
    isClient ? { key: 'errands_posted', label: 'Errands Posted' } : null,
    isRunner ? { key: 'errands_assigned', label: 'Errands Assigned' } : null,
    canFinance ? { key: 'escrows', label: 'Escrows' } : null,
    canFinance ? { key: 'transactions', label: 'Transactions' } : null,
    canFinance && isRunner ? { key: 'withdrawals', label: 'Withdrawals' } : null,
    canFinance ? { key: 'kyc_requests', label: 'KYC' } : null,
    canFinance ? { key: 'bank_accounts', label: 'Bank Accounts' } : null,
    isRunner ? { key: 'reviews_as_runner', label: 'Reviews (Runner)' } : null,
    isClient ? { key: 'reviews_as_client', label: 'Reviews (Client)' } : null,
  ].filter(Boolean);

  const applySearch = (key, value) => {
    setSectionSearch((prev) => ({ ...prev, [key]: value }));
  };

  const getSearchValue = (key) => sectionSearch?.[key] || '';

  const openDetails = (type, item) => {
    setSelectedType(type);
    setSelectedItem(item);
  };

  const closeDetails = () => {
    setSelectedType(null);
    setSelectedItem(null);
  };

  const adminFetch = async (path, body) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    const res = await fetch(`${apiBase}${path}`, {
      method: body ? 'POST' : 'GET',
      headers: {
        'Content-Type': body ? 'application/json' : undefined,
        Authorization: token ? `Bearer ${token}` : undefined,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Request failed');
    }
    return res.json();
  };

  const handleAction = async (action, payload) => {
    try {
      setActionLoading(true);
      await action(payload);
      showSuccess('Action completed');
      closeDetails();
      refetch();
    } catch (err) {
      showError('admin-action', err);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredItems = (items, query, extractor) => {
    if (!query) return items;
    const q = query.toLowerCase();
    return items.filter((item) => extractor(item).toLowerCase().includes(q));
  };

  const sectionContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <>
            <div style={{ marginTop: '24px', display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
              <StatCard label="Errands Posted" value={counts.errands_posted || 0} />
              <StatCard label="Errands Assigned" value={counts.errands_assigned || 0} />
              <StatCard label="Transactions" value={counts.transactions || 0} />
              <StatCard label="Escrows" value={counts.escrows || 0} />
              <StatCard label="Withdrawals" value={counts.withdrawals || 0} />
              <StatCard label="KYC Requests" value={counts.kyc_requests || 0} />
              <StatCard label="Bank Accounts" value={counts.bank_accounts || 0} />
              <StatCard label="Reviews (Runner)" value={counts.reviews_as_runner || 0} />
              <StatCard label="Reviews (Client)" value={counts.reviews_as_client || 0} />
            </div>
          </>
        );
      case 'errands_posted': {
        const query = getSearchValue('errands_posted');
        const items = filteredItems(data.errands_posted || [], query, (e) =>
          `${e.title || ''} ${e.description || ''} ${e.status || ''} ${e.id}`.trim()
        );
        return (
          <SectionList
            title="Errands Posted"
            searchValue={query}
            onSearch={(v) => applySearch('errands_posted', v)}
            items={items}
            renderItem={(e) => (
              <ItemRow
                key={e.id}
                primary={e.title || 'Untitled'}
                secondary={`${e.status} · ${formatNaira(e.price)}`}
                meta={e.id}
                onClick={() => openDetails('errand', e)}
              />
            )}
          />
        );
      }
      case 'errands_assigned': {
        const query = getSearchValue('errands_assigned');
        const items = filteredItems(data.errands_assigned || [], query, (e) =>
          `${e.title || ''} ${e.description || ''} ${e.status || ''} ${e.id}`.trim()
        );
        return (
          <SectionList
            title="Errands Assigned"
            searchValue={query}
            onSearch={(v) => applySearch('errands_assigned', v)}
            items={items}
            renderItem={(e) => (
              <ItemRow
                key={e.id}
                primary={e.title || 'Untitled'}
                secondary={`${e.status} · ${formatNaira(e.price)}`}
                meta={e.id}
                onClick={() => openDetails('errand', e)}
              />
            )}
          />
        );
      }
      case 'escrows': {
        const query = getSearchValue('escrows');
        const items = filteredItems(data.escrows || [], query, (e) =>
          `${e.status || ''} ${e.payment_reference || ''} ${e.errand_id || ''} ${e.id}`.trim()
        );
        return (
          <SectionList
            title="Escrows"
            searchValue={query}
            onSearch={(v) => applySearch('escrows', v)}
            items={items}
            renderItem={(e) => (
              <ItemRow
                key={e.id}
                primary={`${formatNaira(e.amount)} · ${e.status}`}
                secondary={e.payment_reference || 'No reference'}
                meta={e.errand_id}
                onClick={() => openDetails('escrow', e)}
              />
            )}
          />
        );
      }
      case 'transactions': {
        const query = getSearchValue('transactions');
        const items = filteredItems(data.transactions || [], query, (t) =>
          `${t.type || ''} ${t.status || ''} ${t.reference || ''} ${t.id}`.trim()
        );
        return (
          <SectionList
            title="Transactions"
            searchValue={query}
            onSearch={(v) => applySearch('transactions', v)}
            items={items}
            renderItem={(t) => (
              <ItemRow
                key={t.id}
                primary={`${t.type} · ${formatNaira(t.amount)} · ${t.status}`}
                secondary={t.reference || 'No reference'}
                meta={t.escrow_id || t.id}
                onClick={() => openDetails('transaction', t)}
              />
            )}
          />
        );
      }
      case 'withdrawals': {
        const query = getSearchValue('withdrawals');
        const items = filteredItems(data.withdrawals || [], query, (w) =>
          `${w.status || ''} ${w.reference || ''} ${w.id}`.trim()
        );
        return (
          <SectionList
            title="Withdrawals"
            searchValue={query}
            onSearch={(v) => applySearch('withdrawals', v)}
            items={items}
            renderItem={(w) => (
              <ItemRow
                key={w.id}
                primary={`${formatNaira(w.amount)} · ${w.status}`}
                secondary={w.reference || 'No reference'}
                meta={w.id}
                onClick={() => openDetails('withdrawal', w)}
              />
            )}
          />
        );
      }
      case 'kyc_requests': {
        const query = getSearchValue('kyc_requests');
        const items = filteredItems(data.kyc_requests || [], query, (k) =>
          `${k.status || ''} ${k.document_type || ''} ${k.document_number || ''} ${k.id}`.trim()
        );
        return (
          <SectionList
            title="KYC Requests"
            searchValue={query}
            onSearch={(v) => applySearch('kyc_requests', v)}
            items={items}
            renderItem={(k) => (
              <ItemRow
                key={k.id}
                primary={`${k.status} · ${k.document_type}`}
                secondary={k.document_number || 'No document number'}
                meta={k.id}
                onClick={() => openDetails('kyc', k)}
              />
            )}
          />
        );
      }
      case 'bank_accounts': {
        const query = getSearchValue('bank_accounts');
        const items = filteredItems(data.bank_accounts || [], query, (b) =>
          `${b.bank_name || ''} ${b.account_name || ''} ${b.account_number || ''} ${b.status || ''}`.trim()
        );
        return (
          <SectionList
            title="Bank Accounts"
            searchValue={query}
            onSearch={(v) => applySearch('bank_accounts', v)}
            items={items}
            renderItem={(b) => (
              <ItemRow
                key={b.id}
                primary={`${b.bank_name} · ${maskAccountNumber(b.account_number)}`}
                secondary={`${b.account_name || 'N/A'} · ${b.status}`}
                meta={b.id}
                onClick={() => openDetails('bank', b)}
              />
            )}
          />
        );
      }
      case 'reviews_as_runner': {
        const query = getSearchValue('reviews_as_runner');
        const items = filteredItems(data.reviews_as_runner || [], query, (r) =>
          `${r.rating || ''} ${r.comment || ''} ${r.id}`.trim()
        );
        return (
          <SectionList
            title="Reviews As Runner"
            searchValue={query}
            onSearch={(v) => applySearch('reviews_as_runner', v)}
            items={items}
            renderItem={(r) => (
              <ItemRow
                key={r.id}
                primary={`Rating: ${r.rating || 'N/A'}`}
                secondary={r.comment || 'No comment'}
                meta={r.errand_id}
                onClick={() => openDetails('review', r)}
              />
            )}
          />
        );
      }
      case 'reviews_as_client': {
        const query = getSearchValue('reviews_as_client');
        const items = filteredItems(data.reviews_as_client || [], query, (r) =>
          `${r.rating || ''} ${r.comment || ''} ${r.id}`.trim()
        );
        return (
          <SectionList
            title="Reviews As Client"
            searchValue={query}
            onSearch={(v) => applySearch('reviews_as_client', v)}
            items={items}
            renderItem={(r) => (
              <ItemRow
                key={r.id}
                primary={`Rating: ${r.rating || 'N/A'}`}
                secondary={r.comment || 'No comment'}
                meta={r.errand_id}
                onClick={() => openDetails('review', r)}
              />
            )}
          />
        );
      }
      default:
        return null;
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <button
        onClick={() => navigate('/admin')}
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
          gap: '6px',
        }}
      >
        <FiArrowLeft size={16} /> Back to Admin
      </button>

      <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: '2fr 1fr' }}>
        <div style={{ background: Colors.cardBackground, border: `1px solid ${Colors.border}`, borderRadius: '12px', padding: '20px' }}>
          <h2 style={{ margin: 0, color: Colors.text }}>{userName}</h2>
          <p style={{ marginTop: '6px', color: Colors.muted, fontSize: '14px' }}>{profile.role || 'user'} · {profile.suspended ? 'Suspended' : 'Active'}</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
            <div>
              <div style={{ color: Colors.muted, fontSize: '12px' }}>Profile ID</div>
              <div style={{ fontFamily: 'monospace', fontSize: '12px', color: Colors.text }}>{profile.id}</div>
            </div>
            <div>
              <div style={{ color: Colors.muted, fontSize: '12px' }}>User ID</div>
              <div style={{ fontFamily: 'monospace', fontSize: '12px', color: Colors.text }}>{profile.user_id || 'N/A'}</div>
            </div>
            <div>
              <div style={{ color: Colors.muted, fontSize: '12px' }}>Email</div>
              <div style={{ color: Colors.text, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FiMail size={14} /> {profile.email || 'N/A'}
              </div>
            </div>
            <div>
              <div style={{ color: Colors.muted, fontSize: '12px' }}>Phone</div>
              <div style={{ color: Colors.text, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FiPhone size={14} /> {profile.phone_number || 'N/A'}
              </div>
            </div>
            <div>
              <div style={{ color: Colors.muted, fontSize: '12px' }}>KYC</div>
              <div style={{ color: Colors.text, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FiShield size={14} /> {profile.kyc_verified ? 'Verified' : 'Not verified'}
              </div>
            </div>
            <div>
              <div style={{ color: Colors.muted, fontSize: '12px' }}>Created</div>
              <div style={{ color: Colors.text, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FiClock size={14} /> {profile.created_at ? new Date(profile.created_at).toLocaleString() : 'N/A'}
              </div>
            </div>
          </div>
        </div>

        <div style={{ background: Colors.cardBackground, border: `1px solid ${Colors.border}`, borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ marginTop: 0, color: Colors.text }}>Actions</h3>
          {canSupport ? (
            <>
              <Button
                variant={profile.suspended ? 'primary' : 'warning'}
                onClick={() => suspendMutation.mutate({ suspended: !profile.suspended })}
                style={{ width: '100%', marginBottom: '10px' }}
              >
                {profile.suspended ? 'Unblock / Unsuspend' : 'Suspend'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => window.location.href = `mailto:${profile.email || ''}`}
                style={{ width: '100%' }}
                disabled={!profile.email}
              >
                <FiUser size={14} /> Assist via Email
              </Button>
              <div style={{ marginTop: '10px', display: 'grid', gap: '10px' }}>
                <Button
                  variant="warning"
                  onClick={async () => {
                    if (!window.confirm('Force logout this user? This will temporarily block sessions.')) return;
                    await handleAction(() => adminFetch(`/api/admin/users/${profile.id}/force-logout`, {}));
                  }}
                  style={{ width: '100%' }}
                >
                  Force Logout
                </Button>
                <Button
                  variant="secondary"
                  onClick={async () => {
                    if (!window.confirm('Send password reset email to this user?')) return;
                    await handleAction(() => adminFetch(`/api/admin/users/${profile.id}/password-reset`, {}));
                  }}
                  style={{ width: '100%' }}
                  disabled={!profile.email}
                >
                  Send Password Reset
                </Button>
              </div>
            </>
          ) : (
            <div style={{ color: Colors.muted, fontSize: '13px' }}>
              You do not have access to user actions.
            </div>
          )}
        </div>
      </div>

      <div style={{
        display: 'flex',
        gap: '8px',
        marginTop: '24px',
        borderBottom: `1px solid ${Colors.border}`,
        overflowX: 'auto',
        paddingBottom: '12px',
      }}>
        {sections.map((section) => (
          <button
            key={section.key}
            onClick={() => setActiveSection(section.key)}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              border: 'none',
              background: activeSection === section.key ? Colors.primary : 'transparent',
              color: activeSection === section.key ? 'white' : Colors.text,
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
              whiteSpace: 'nowrap',
            }}
          >
            {section.label}
          </button>
        ))}
      </div>

      <div style={{ marginTop: '16px' }}>
        {sectionContent()}
      </div>

      {selectedItem && (
        <DetailsModal
          type={selectedType}
          item={selectedItem}
          onClose={closeDetails}
          onAction={handleAction}
          actionLoading={actionLoading}
          adminFetch={adminFetch}
          promptForPin={promptForPin}
          canFinance={canFinance}
          canSupport={canSupport}
        />
      )}
    </div>
  );
}

function SectionList({ title, items = [], renderItem, searchValue, onSearch }) {
  const { Colors } = useTheme();
  return (
    <div style={{ background: Colors.cardBackground, border: `1px solid ${Colors.border}`, borderRadius: '12px', padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', gap: '12px' }}>
        <h3 style={{ margin: 0, color: Colors.text }}>{title}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '240px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <FiSearch size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: Colors.muted }} />
            <input
              type="text"
              placeholder="Search..."
              value={searchValue || ''}
              onChange={(e) => onSearch(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: '30px',
                padding: '8px 10px 8px 30px',
                borderRadius: '8px',
                border: `1px solid ${Colors.border}`,
                background: Colors.background,
                color: Colors.text,
                fontSize: '13px',
              }}
            />
          </div>
        </div>
      </div>
      {items.length === 0 ? (
        <div style={{ color: Colors.muted, fontSize: '14px' }}>No records</div>
      ) : (
        <div style={{ display: 'grid', gap: '8px' }}>
          {items.map(renderItem)}
        </div>
      )}
    </div>
  );
}

function ItemRow({ primary, secondary, meta, onClick }) {
  const { Colors } = useTheme();
  return (
    <div
      onClick={onClick}
      style={{
        padding: '10px',
        borderRadius: '8px',
        border: `1px solid ${Colors.border}`,
        background: Colors.background,
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <div style={{ fontWeight: 600, color: Colors.text }}>{primary}</div>
      <div style={{ fontSize: '12px', color: Colors.muted }}>{secondary}</div>
      {meta && <div style={{ fontSize: '11px', color: Colors.muted, marginTop: '4px', fontFamily: 'monospace' }}>{meta}</div>}
    </div>
  );
}

function StatCard({ label, value }) {
  const { Colors } = useTheme();
  return (
    <div style={{ background: Colors.cardBackground, border: `1px solid ${Colors.border}`, borderRadius: '12px', padding: '16px' }}>
      <div style={{ color: Colors.muted, fontSize: '12px' }}>{label}</div>
      <div style={{ fontSize: '24px', fontWeight: 700, color: Colors.text }}>{value}</div>
    </div>
  );
}

function DetailsModal({ type, item, onClose, onAction, actionLoading, adminFetch, promptForPin, canFinance, canSupport }) {
  const { Colors } = useTheme();
  if (!item) return null;
  const safeItem = type === 'bank'
    ? { ...item, account_number: maskAccountNumber(item.account_number) }
    : item;

  const actionButton = (label, onClick, variant = 'primary') => (
    <Button variant={variant} onClick={onClick} disabled={actionLoading} style={{ width: '100%' }}>
      {actionLoading ? 'Processing...' : label}
    </Button>
  );

  const renderActions = () => {
    if (type === 'errand') {
      if (!canSupport) return null;
      return actionButton('Cancel Errand', async () => {
        const reason = window.prompt('Cancel reason (optional):') || '';
        await onAction(() => adminFetch(`/api/admin/errands/${item.id}/cancel`, { reason }));
      }, 'warning');
    }
    if (type === 'escrow') {
      if (!canFinance) return null;
      const disabled = item.status !== 'pending_payment' || !item.payment_reference;
      return (
        <Button
          variant="primary"
          onClick={async () => {
            if (disabled) return;
            const pin = promptForPin?.('reconcile this payment');
            if (!pin) return;
            await onAction(() => adminFetch('/api/admin/escrows/reconcile', { escrow_id: item.id, limit: 1, pin }));
          }}
          disabled={actionLoading || disabled}
          style={{ width: '100%' }}
        >
          {actionLoading ? 'Processing...' : 'Reconcile Payment'}
        </Button>
      );
    }
    if (type === 'withdrawal') {
      if (!canFinance) return null;
      return (
        <div style={{ display: 'grid', gap: '8px' }}>
          {actionButton('Approve Withdrawal', async () => {
            const pin = promptForPin?.('approve this withdrawal');
            if (!pin) return;
            await onAction(() => adminFetch(`/api/admin/withdrawals/${item.id}/approve`, { pin }));
          })}
          {actionButton('Reject Withdrawal', async () => {
            const reason = window.prompt('Rejection reason:');
            if (!reason) return;
            const pin = promptForPin?.('reject this withdrawal');
            if (!pin) return;
            await onAction(() => adminFetch(`/api/admin/withdrawals/${item.id}/reject`, { reason, pin }));
          }, 'warning')}
        </div>
      );
    }
    if (type === 'kyc') {
      if (!canFinance) return null;
      return (
        <div style={{ display: 'grid', gap: '8px' }}>
          {actionButton('Approve KYC', async () => {
            await onAction(() => adminFetch(`/api/admin/kyc/${item.id}/review`, { status: 'approved', admin_notes: '' }));
          })}
          {actionButton('Reject KYC', async () => {
            const reason = window.prompt('Rejection reason (required):');
            if (!reason) return;
            await onAction(() => adminFetch(`/api/admin/kyc/${item.id}/review`, { status: 'rejected', reason, admin_notes: '' }));
          }, 'warning')}
        </div>
      );
    }
    if (type === 'bank') {
      if (!canFinance) return null;
      return (
        <div style={{ display: 'grid', gap: '8px' }}>
          {actionButton('Approve Bank Account', async () => {
            await onAction(() => adminFetch(`/api/admin/bank-accounts/${item.id}/review`, { status: 'approved', admin_notes: '' }));
          })}
          {actionButton('Reject Bank Account', async () => {
            const reason = window.prompt('Rejection reason (required):');
            if (!reason) return;
            await onAction(() => adminFetch(`/api/admin/bank-accounts/${item.id}/review`, { status: 'rejected', rejected_reason: reason, admin_notes: '' }));
          }, 'warning')}
        </div>
      );
    }
    return null;
  };

  const toDate = (value) => (value ? new Date(value).toLocaleString() : 'N/A');

  const renderDetails = () => {
    if (type === 'errand') {
      return (
        <DetailGrid rows={[
          ['Title', safeItem.title || 'Untitled'],
          ['Description', safeItem.description || 'N/A'],
          ['Location', safeItem.location || 'N/A'],
          ['Status', safeItem.status || 'N/A'],
          ['Price', formatNaira(safeItem.price)],
          ['Proposed Price', formatNaira(safeItem.proposed_price)],
          ['Hourly', safeItem.is_hourly ? 'Yes' : 'No'],
          ['Posted By', safeItem.posted_by || 'N/A'],
          ['Assigned To', safeItem.assigned_to || 'N/A'],
          ['Created', toDate(safeItem.created_at)],
        ]} />
      );
    }
    if (type === 'escrow') {
      return (
        <DetailGrid rows={[
          ['Amount', formatNaira(safeItem.amount)],
          ['Status', safeItem.status || 'N/A'],
          ['Payment Reference', safeItem.payment_reference || 'N/A'],
          ['Errand ID', safeItem.errand_id || 'N/A'],
          ['Client ID', safeItem.client_id || 'N/A'],
          ['Runner ID', safeItem.runner_id || 'N/A'],
          ['Paid At', toDate(safeItem.paid_at)],
          ['Release At', toDate(safeItem.release_at)],
          ['Created', toDate(safeItem.created_at)],
        ]} />
      );
    }
    if (type === 'transaction') {
      return (
        <DetailGrid rows={[
          ['Type', safeItem.type || 'N/A'],
          ['Amount', formatNaira(safeItem.amount)],
          ['Status', safeItem.status || 'N/A'],
          ['Reference', safeItem.reference || 'N/A'],
          ['Escrow ID', safeItem.escrow_id || 'N/A'],
          ['User ID', safeItem.user_id || 'N/A'],
          ['Paystack ID', safeItem.paystack_transaction_id || 'N/A'],
          ['Created', toDate(safeItem.created_at)],
        ]} />
      );
    }
    if (type === 'withdrawal') {
      return (
        <DetailGrid rows={[
          ['Amount', formatNaira(safeItem.amount)],
          ['Status', safeItem.status || 'N/A'],
          ['Reference', safeItem.reference || 'N/A'],
          ['Bank Account', safeItem.bank_account_id || 'N/A'],
          ['Rejection Reason', safeItem.rejection_reason || 'N/A'],
          ['Approved At', toDate(safeItem.approved_at)],
          ['Reviewed At', toDate(safeItem.reviewed_at)],
          ['Created', toDate(safeItem.created_at)],
        ]} />
      );
    }
    if (type === 'kyc') {
      return (
        <DetailGrid rows={[
          ['Status', safeItem.status || 'N/A'],
          ['Document Type', safeItem.document_type || 'N/A'],
          ['Document Number', safeItem.document_number || 'N/A'],
          ['Reason', safeItem.reason || 'N/A'],
          ['Admin Notes', safeItem.admin_notes || 'N/A'],
          ['Reviewed At', toDate(safeItem.reviewed_at)],
          ['Created', toDate(safeItem.created_at)],
        ]} />
      );
    }
    if (type === 'bank') {
      return (
        <DetailGrid rows={[
          ['Bank', safeItem.bank_name || 'N/A'],
          ['Account Name', safeItem.account_name || 'N/A'],
          ['Account Number', safeItem.account_number || 'N/A'],
          ['Status', safeItem.status || 'N/A'],
          ['Verified', safeItem.verified ? 'Yes' : 'No'],
          ['Rejected Reason', safeItem.rejected_reason || 'N/A'],
          ['Approved At', toDate(safeItem.approved_at)],
          ['Created', toDate(safeItem.created_at)],
        ]} />
      );
    }
    if (type === 'review') {
      return (
        <DetailGrid rows={[
          ['Rating', safeItem.rating || 'N/A'],
          ['Comment', safeItem.comment || 'N/A'],
          ['Errand ID', safeItem.errand_id || 'N/A'],
          ['Created', toDate(safeItem.created_at)],
        ]} />
      );
    }
    return null;
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        overflowY: 'auto',
        padding: '24px 12px',
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '20px',
          width: '90%',
          maxWidth: '720px',
          maxHeight: '85vh',
          overflowY: 'auto',
          border: `1px solid ${Colors.border}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h3 style={{ margin: 0, color: '#111', textTransform: 'capitalize' }}>{type} Details</h3>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', color: Colors.text, cursor: 'pointer', fontSize: '18px' }}>✕</button>
        </div>
        <div style={{ background: '#ffffff', borderRadius: '8px', border: `1px solid ${Colors.border}`, padding: '12px' }}>
          {renderDetails()}
        </div>
        {['errand', 'escrow', 'withdrawal', 'kyc', 'bank'].includes(type) && (
          <div style={{ marginTop: '12px' }}>
            {renderActions()}
          </div>
        )}
      </div>
    </div>
  );
}

function DetailGrid({ rows }) {
  const { Colors } = useTheme();
  return (
    <div style={{ display: 'grid', gap: '10px' }}>
      {rows.map(([label, value]) => (
        <div key={label} style={{ borderBottom: `1px solid ${Colors.border}`, paddingBottom: '8px' }}>
          <div style={{ fontSize: '12px', color: Colors.muted, textTransform: 'uppercase', fontWeight: 600 }}>{label}</div>
          <div style={{ fontSize: '14px', color: '#111' }}>{value}</div>
        </div>
      ))}
    </div>
  );
}
