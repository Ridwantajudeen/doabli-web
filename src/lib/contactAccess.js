import { supabase } from './supabase';

export const ACTIVE_MESSAGE_STATUSES = [
  'offered',
  'pending_funding',
  'assigned',
  'in_progress',
  'funded',
  'completed',
  'disputed',
];

export const MESSAGE_BLOCKED_ESCROW_STATUSES = [
  'released',
  'releasable',
  'withdrawn',
  'refunded',
  'split',
];

export const maskEmail = (email) => {
  if (!email) return 'Not available';
  const [name, domain] = String(email).split('@');
  if (!name || !domain) return 'Not available';
  const safeName = name.length <= 2 ? `${name[0] || '*'}*` : `${name.slice(0, 2)}***`;
  return `${safeName}@${domain}`;
};

export const maskPhone = (phone) => {
  if (!phone) return 'Not available';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length < 4) return '********';
  return `${'*'.repeat(Math.max(0, digits.length - 4))}${digits.slice(-4)}`;
};

export async function fetchMessagingAccess(supabase, userId, partnerId) {
  if (!userId || !partnerId) return { canMessage: false };

  const { data: errands, error } = await supabase
    .from('errands')
    .select('id,status')
    .in('status', ACTIVE_MESSAGE_STATUSES)
    .or(`and(posted_by.eq.${userId},assigned_to.eq.${partnerId}),and(posted_by.eq.${partnerId},assigned_to.eq.${userId})`)
    .limit(10);

  if (error) throw error;

  for (const errand of errands || []) {
    const { data: escrow, error: escrowError } = await supabase
      .from('escrow')
      .select('status')
      .eq('errand_id', errand.id)
      .single();
    if (escrowError) continue;
    if (!escrow || !MESSAGE_BLOCKED_ESCROW_STATUSES.includes(escrow.status)) {
      return { canMessage: true };
    }
  }

  return { canMessage: false };
}

export async function fetchViewerContactAccess(ownerId, viewerId, errandId) {
  if (!ownerId || !viewerId) {
    return { can_owner_manage: false, can_view_email: false, can_view_phone: false };
  }

  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error('Authentication required');
  const qs = new URLSearchParams({
    owner_id: ownerId,
    viewer_id: viewerId,
  });
  if (errandId) qs.set('errand_id', errandId);

  const res = await fetch(`${apiBase}/api/contact/access?${qs.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to fetch contact access');
  return data;
}

export async function updateOwnerContactShare({
  ownerId,
  viewerId,
  errandId,
  shareEmail,
  sharePhone,
}) {
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error('Authentication required');
  const res = await fetch(`${apiBase}/api/contact/share`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      owner_id: ownerId,
      viewer_id: viewerId,
      errand_id: errandId,
      share_email: !!shareEmail,
      share_phone: !!sharePhone,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to update contact sharing');
  return data;
}
