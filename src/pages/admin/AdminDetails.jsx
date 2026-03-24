import { useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Lock, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { getApiBase } from '../../lib/apiBase';
import { getAdminLevel } from '../../lib/adminAccess';
import { showError, showSuccess } from '../../lib/notify';

export default function AdminDetails() {
  const { Colors } = useTheme();
  const { profile: adminProfile } = useAuth();
  const adminLevel = getAdminLevel(adminProfile?.role);
  const canSuper = adminLevel >= 3;
  const navigate = useNavigate();
  const { id } = useParams();
  const apiBase = getApiBase();
  const adminQueryDefaults = {
    staleTime: 30000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    keepPreviousData: true,
  };

  const [pinInput, setPinInput] = useState('');
  const [pin, setPin] = useState('');
  const [pinUnlocked, setPinUnlocked] = useState(false);
  const [pinError, setPinError] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [selectedAudit, setSelectedAudit] = useState(null);

  const api = useCallback(async (path, opts = {}) => {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;

    const res = await fetch(`${apiBase}${path}`, {
      ...opts,
      headers: {
        ...(opts.headers || {}),
        Authorization: token ? `Bearer ${token}` : undefined,
        'Content-Type': opts.body ? 'application/json' : undefined,
      },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `API ${path} failed with ${res.status}`);
    }
    return res.json();
  }, [apiBase]);

  const { data: adminData, isLoading: adminLoading, refetch: refetchAdmin } = useQuery({
    queryKey: ['adminDetails', id],
    queryFn: () => api(`/admin/admins/${id}`),
    enabled: !!id && canSuper,
    ...adminQueryDefaults,
  });

  const admin = adminData?.admin || null;

  const { data: auditsData = { audits: [], total: 0, page: 1 }, isLoading: auditsLoading } = useQuery({
    queryKey: ['adminActivity', id, page, pin],
    queryFn: () => api(`/admin/audits?page=${page}&limit=${pageSize}&admin_id=${id}&scope=admin_activity`, {
      headers: pin ? { 'x-admin-pin': pin } : undefined,
    }),
    enabled: !!id && canSuper && pinUnlocked,
    ...adminQueryDefaults,
  });

  const audits = auditsData.audits || [];
  const totalPages = Math.ceil((auditsData.total || 0) / pageSize);

  const verifyPinMutation = useMutation({
    mutationFn: async (value) => api('/admin/security/verify-pin', {
      method: 'POST',
      body: JSON.stringify({ pin: value }),
    }),
    onSuccess: (_, value) => {
      setPin(value);
      setPinUnlocked(true);
      setPinInput('');
      setPinError('');
    },
    onError: (err) => {
      let message = err?.message || 'Failed to verify PIN';
      try {
        const parsed = JSON.parse(message);
        if (parsed?.error) message = parsed.error;
      } catch (_) {
        // ignore
      }
      setPinError(message);
      setPinUnlocked(false);
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ role, pinValue }) =>
      api(`/admin/admins/${id}/role`, { method: 'POST', body: JSON.stringify({ role, pin: pinValue }) }),
    onSuccess: () => {
      showSuccess('Admin role updated');
      refetchAdmin();
    },
    onError: (err) => {
      showError('admin-role', err);
    },
  });

  const suspendMutation = useMutation({
    mutationFn: async ({ suspended, reason }) =>
      api(`/admin/admins/${id}/suspend`, { method: 'POST', body: JSON.stringify({ suspended, reason }) }),
    onSuccess: () => {
      showSuccess('Admin status updated');
      refetchAdmin();
    },
    onError: (err) => {
      showError('admin-suspend', err);
    },
  });

  const promptForPin = useCallback((actionLabel) => {
    const raw = window.prompt(`Enter admin PIN to ${actionLabel}:`);
    if (raw === null) return null;
    const cleaned = String(raw).trim().replace(/\D/g, '');
    if (!/^\d{4,6}$/.test(cleaned)) {
      showError('validation', 'PIN must be 4-6 digits');
      return null;
    }
    return cleaned;
  }, []);

  const getAuditDetails = (details) => {
    if (!details) return null;
    if (typeof details === 'object') return details;
    try {
      return JSON.parse(details);
    } catch (_) {
      return details;
    }
  };

  if (!canSuper) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: Colors.background }}>
        <div style={{ textAlign: 'center', padding: '40px', borderRadius: '12px', background: Colors.cardBackground }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px', color: Colors.text }}>Unauthorized</h2>
          <p style={{ color: Colors.muted }}>Super admin privileges required.</p>
        </div>
      </div>
    );
  }

  if (adminLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: Colors.background }}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '16px', color: Colors.text }}>Loading...</div>
        </div>
      </div>
    );
  }

  if (!admin) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: Colors.background }}>
        <div style={{ textAlign: 'center', padding: '40px', borderRadius: '12px', background: Colors.cardBackground }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px', color: Colors.text }}>Admin Not Found</h2>
          <p style={{ color: Colors.muted }}>The admin profile could not be found.</p>
        </div>
      </div>
    );
  }

  const fullName = `${admin.first_name || ''} ${admin.last_name || ''}`.trim() || 'N/A';

  return (
    <div style={{ minHeight: '100vh', background: Colors.background, padding: '24px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <button
          onClick={() => navigate('/admin')}
          style={{
            background: Colors.cardBackground,
            color: Colors.text,
            border: `1px solid ${Colors.border}`,
            borderRadius: '8px',
            padding: '8px 12px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '16px',
          }}
        >
          <ChevronLeft size={14} /> Back to Admin
        </button>

        <div style={{ display: 'grid', gap: '16px' }}>
          <div style={{ background: Colors.cardBackground, border: `1px solid ${Colors.border}`, borderRadius: '12px', padding: '24px' }}>
            <h2 style={{ margin: 0, color: Colors.text, fontSize: '22px', fontWeight: '700' }}>{fullName}</h2>
            <p style={{ margin: '6px 0 0', color: Colors.muted, fontSize: '13px' }}>{admin.email}</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginTop: '16px' }}>
              <div>
                <p style={{ margin: 0, color: Colors.muted, fontSize: '12px', fontWeight: '600' }}>ROLE</p>
                <p style={{ margin: '6px 0 0', color: Colors.text }}>{admin.role}</p>
              </div>
              <div>
                <p style={{ margin: 0, color: Colors.muted, fontSize: '12px', fontWeight: '600' }}>STATUS</p>
                <p style={{ margin: '6px 0 0', color: Colors.text }}>{admin.suspended ? 'Suspended' : 'Active'}</p>
              </div>
              <div>
                <p style={{ margin: 0, color: Colors.muted, fontSize: '12px', fontWeight: '600' }}>PIN SET</p>
                <p style={{ margin: '6px 0 0', color: Colors.text }}>{admin.admin_pin_set_at ? new Date(admin.admin_pin_set_at).toLocaleString() : '—'}</p>
              </div>
              <div>
                <p style={{ margin: 0, color: Colors.muted, fontSize: '12px', fontWeight: '600' }}>PIN LAST USED</p>
                <p style={{ margin: '6px 0 0', color: Colors.text }}>{admin.admin_pin_last_used_at ? new Date(admin.admin_pin_last_used_at).toLocaleString() : '—'}</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
              <select
                value={admin.role}
                onChange={(e) => {
                  const newRole = e.target.value;
                  if (newRole === admin.role) return;
                  const pinValue = promptForPin('change admin role');
                  if (!pinValue) return;
                  updateRoleMutation.mutate({ role: newRole, pinValue });
                }}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: `1px solid ${Colors.border}`,
                  background: Colors.cardBackground,
                  color: Colors.text,
                  fontSize: '13px',
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

              <button
                onClick={() => {
                  const reason = window.prompt(`Reason for ${admin.suspended ? 'unsuspending' : 'suspending'} this admin?`);
                  if (reason === null) return;
                  suspendMutation.mutate({ suspended: !admin.suspended, reason });
                }}
                style={{
                  background: admin.suspended ? Colors.success : Colors.error,
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '13px',
                }}
              >
                {admin.suspended ? 'Unsuspend' : 'Suspend'}
              </button>
            </div>
          </div>

          {!pinUnlocked ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0' }}>
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
                {pinError && (
                  <p style={{ color: Colors.error, fontSize: '12px', marginBottom: '12px' }}>{pinError}</p>
                )}
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Enter PIN"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
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
                  onClick={() => verifyPinMutation.mutate(pinInput.trim())}
                  disabled={verifyPinMutation.isPending || !pinInput.trim()}
                  style={{
                    width: '100%',
                    background: Colors.primary,
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 16px',
                    cursor: verifyPinMutation.isPending ? 'not-allowed' : 'pointer',
                    opacity: verifyPinMutation.isPending ? 0.7 : 1,
                    fontWeight: '600',
                    fontSize: '14px',
                  }}
                >
                  {verifyPinMutation.isPending ? 'Verifying...' : 'Unlock Activity'}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ background: Colors.cardBackground, border: `1px solid ${Colors.border}`, borderRadius: '12px', padding: '24px' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: '700', color: Colors.text }}>Activity</h3>
              {auditsLoading ? (
                <p style={{ color: Colors.muted }}>Loading activity...</p>
              ) : audits.length === 0 ? (
                <p style={{ color: Colors.muted }}>No activity found.</p>
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
                                  <Eye size={14} /> View
                                </button>
                              ) : '-'}
                            </td>
                            <td style={{ padding: '12px', color: Colors.text, fontSize: '14px' }}>{new Date(audit.created_at).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {totalPages > 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '20px', padding: '0 16px' }}>
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
                        <ChevronLeft size={16} /> Previous
                      </button>
                      <span style={{ color: Colors.text }}>
                        Page {page} of {totalPages || 1}
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
                        Next <ChevronRight size={16} />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

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
    </div>
  );
}
