// Notification helper using react-toastify
import { toast } from 'react-toastify';

export function friendlyMessage(context, err) {
  const msg = (err && err.message) || (typeof err === 'string' ? err : '') || '';

  const low = msg.toLowerCase();
  if (low.includes('failed to fetch') || low.includes('networkerror') || low.includes('network')) {
    return 'Network issue — please check your connection and try again.';
  }

  if (low.includes('unauthorized') || low.includes('invalid token') || low.includes('invalid') || low.includes('401')) {
    return 'Authentication failed — please sign in again.';
  }

  if (low.includes('timeout')) return 'Request timed out — please try again.';

  switch (context) {
    case 'kyc-review':
      return 'Could not process the KYC review. Please try again.';
    case 'bank-review':
      return 'Could not submit the bank review. Please try again.';
    case 'update-profile':
      return 'Could not update your profile — please try again.';
    case 'save-bank':
      return 'Couldn\'t save your bank details — please try again.';
    case 'resolve-account':
      return 'We couldn\'t verify the account details — please double-check and try again.';
    case 'upload-image':
      return 'Image upload failed — please try again.';
    case 'withdrawal':
      return 'Couldn\'t process your withdrawal — please try again later.';
    case 'send-message':
      return 'Couldn\'t send your message — please try again.';
    case 'validation':
      return msg || 'Please fill in the required fields.';
    default:
      return msg ? 'Something went wrong — please try again.' : 'Something went wrong — please try again.';
  }
}

export function showError(context, errOrMessage) {
  const payload = typeof errOrMessage === 'string' ? errOrMessage : null;
  const message = payload || friendlyMessage(context, errOrMessage);
  toast.error(message, { position: 'top-right', autoClose: 5000 });
}

export function showSuccess(message) {
  toast.success(message, { position: 'top-right', autoClose: 3000 });
}
