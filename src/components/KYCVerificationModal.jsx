// KYCVerificationModal.jsx - Runner KYC submission component

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { showError, showSuccess } from '../lib/notify';
import { useTheme } from '../context/ThemeContext';
import { ThemedText, ThemedCard } from './ThemedComponents';
import Button from './Button';
import { FiX, FiCamera, FiCheckCircle, FiClock, FiAlertCircle } from 'react-icons/fi';

export default function KYCVerificationModal({ isOpen, onClose, profile, onSuccess }) {
  const { Colors } = useTheme();
  const queryClient = useQueryClient();

  // State
  const [step, setStep] = useState('document-type'); // 'document-type', 'upload', 'selfie', 'review'
  const [documentType, setDocumentType] = useState('nin'); // 'nin', 'driver-license', 'passport'
  const [documentNumber, setDocumentNumber] = useState('');
  const [documentImage, setDocumentImage] = useState(null);
  const [documentImageUrl, setDocumentImageUrl] = useState(null);
  const [selfieImage, setSelfieImage] = useState(null);
  const [selfieImageUrl, setSelfieImageUrl] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Fetch existing KYC request
  const { data: existingKYC } = useQuery({
    queryKey: ['kyc-request', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;
      const { data } = await supabase
        .from('kyc_requests')
        .select('*')
        .eq('profile_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(1);

      return data?.[0] ?? null;
    },
    enabled: !!profile?.id,
  });

  // Submit KYC mutation
  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!documentImageUrl || !selfieImageUrl) {
        throw new Error('Both document and selfie images are required');
      }

      const { error } = await supabase
        .from('kyc_requests')
        .insert([
          {
            profile_id: profile.id,
            document_type: documentType,
            document_number: documentNumber,
            document_url: documentImageUrl,
            selfie_url: selfieImageUrl,
            status: 'pending',
          },
        ]);

      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess('KYC submission successful! Our team will review it within 24 hours.');
      queryClient.invalidateQueries(['kyc-request']);
      onSuccess?.();
      handleClose();
    },
    onError: (err) => {
      showError('kyc-review', err);
    },
  });

  const handleImageUpload = async (file, isDocument) => {
    if (!file || !profile?.id) return;

    try {
      setUploading(true);

      const userId = profile.id; // ✅ canonical ID

      const fileName = `${userId}/${isDocument ? 'document' : 'selfie'}-${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('kyc-documents')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // For private buckets we store the file path (not a public URL).
      // Admins should generate signed URLs when viewing.
      if (isDocument) {
        setDocumentImage(file);
        setDocumentImageUrl(fileName);
      } else {
        setSelfieImage(file);
        setSelfieImageUrl(fileName);
      }
    } catch (err) {
      showError('upload-image', err);
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setStep('document-type');
    setDocumentType('nin');
    setDocumentNumber('');
    setDocumentImage(null);
    setDocumentImageUrl(null);
    setSelfieImage(null);
    setSelfieImageUrl(null);
    onClose?.();
  };

  if (!isOpen) return null;

  // Show existing KYC status
  if (existingKYC) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
        onClick={handleClose}
      >
        <ThemedCard
          style={{
            width: '90%',
            maxWidth: '500px',
            padding: '24px',
            cursor: 'default',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ textAlign: 'center' }}>
            {existingKYC.status === 'pending' && (
              <>
                <FiClock size={48} color={Colors.primary} style={{ margin: '0 auto 16px' }} />
                <ThemedText
                  title
                  style={{ fontSize: '22px', fontWeight: '700', marginBottom: '12px', display: 'block' }}
                >
                  Verification In Progress
                </ThemedText>
                <ThemedText style={{ fontSize: '14px', opacity: 0.7, marginBottom: '24px', display: 'block' }}>
                  Your KYC document is being reviewed by our team. This usually takes 24 hours.
                </ThemedText>
                <div style={{ padding: '16px', backgroundColor: '#f0f9ff', borderRadius: '8px', marginBottom: '24px' }}>
                  <ThemedText style={{ fontSize: '12px', opacity: 0.8, marginBottom: '4px', display: 'block' }}>
                    Document Type: {documentType === 'nin' ? 'NIN' : documentType === 'driver-license' ? "Driver's License" : 'Passport'}
                  </ThemedText>
                  <ThemedText style={{ fontSize: '12px', opacity: 0.8, display: 'block' }}>
                    Submitted: {new Date(existingKYC.created_at).toLocaleDateString()}
                  </ThemedText>
                </div>
              </>
            )}

            {existingKYC.status === 'approved' && (
              <>
                <FiCheckCircle size={48} color="#22c55e" style={{ margin: '0 auto 16px' }} />
                <ThemedText
                  title
                  style={{ fontSize: '22px', fontWeight: '700', marginBottom: '12px', display: 'block', color: '#22c55e' }}
                >
                  KYC Verified ✓
                </ThemedText>
                <ThemedText style={{ fontSize: '14px', opacity: 0.7, marginBottom: '24px', display: 'block' }}>
                  Your identity has been verified. You can now withdraw funds.
                </ThemedText>
              </>
            )}

            {existingKYC.status === 'rejected' && (
              <>
                <FiAlertCircle size={48} color="#ef4444" style={{ margin: '0 auto 16px' }} />
                <ThemedText
                  title
                  style={{ fontSize: '22px', fontWeight: '700', marginBottom: '12px', display: 'block', color: '#ef4444' }}
                >
                  Verification Rejected
                </ThemedText>
                <ThemedText style={{ fontSize: '14px', opacity: 0.7, marginBottom: '12px', display: 'block' }}>
                  Reason: {existingKYC.reason || 'Documents do not meet requirements'}
                </ThemedText>
                {existingKYC.admin_notes && (
                  <ThemedText style={{ fontSize: '13px', opacity: 0.6, marginBottom: '24px', display: 'block', color: '#ef4444' }}>
                    {existingKYC.admin_notes}
                  </ThemedText>
                )}
                <Button variant="primary" size="md" onClick={() => {
                  setStep('document-type');
                  setDocumentNumber('');
                  setDocumentImage(null);
                  setDocumentImageUrl(null);
                  setSelfieImage(null);
                  setSelfieImageUrl(null);
                }}>
                  Resubmit KYC
                </Button>
              </>
            )}

            <Button
              variant="ghost"
              size="md"
              onClick={handleClose}
              style={{ width: '100%', marginTop: '12px' }}
            >
              Close
            </Button>
          </div>
        </ThemedCard>
      </div>
    );
  }

  // Step 1: Select Document Type
  if (step === 'document-type') {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
        onClick={handleClose}
      >
        <ThemedCard
          style={{
            width: '90%',
            maxWidth: '500px',
            padding: '24px',
            cursor: 'default',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <ThemedText
              title
              style={{ fontSize: '22px', fontWeight: '700', display: 'block' }}
            >
              KYC Verification
            </ThemedText>
            <button
              onClick={handleClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '24px',
              }}
            >
              <FiX />
            </button>
          </div>

          <ThemedText style={{ fontSize: '14px', opacity: 0.7, marginBottom: '20px', display: 'block' }}>
            Select the type of ID document you want to verify with.
          </ThemedText>

          <div style={{ display: 'grid', gap: '12px', marginBottom: '24px' }}>
            {[
              { value: 'nin', label: 'National ID (NIN)', description: 'Nigerian National ID Card' },
              { value: 'driver-license', label: "Driver's License", description: 'Valid driver license' },
              { value: 'passport', label: 'International Passport', description: 'Valid passport' },
            ].map((doc) => (
              <div
                key={doc.value}
                onClick={() => setDocumentType(doc.value)}
                style={{
                  padding: '16px',
                  border: `2px solid ${documentType === doc.value ? Colors.primary : '#e5e7eb'}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor: documentType === doc.value ? Colors.primary + '10' : 'transparent',
                  transition: 'all 0.2s',
                }}
              >
                <ThemedText
                  title
                  style={{ fontSize: '15px', fontWeight: '600', marginBottom: '4px', display: 'block' }}
                >
                  {doc.label}
                </ThemedText>
                <ThemedText style={{ fontSize: '12px', opacity: 0.6, display: 'block' }}>
                  {doc.description}
                </ThemedText>
              </div>
            ))}
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={() => setStep('upload')}
            style={{ width: '100%', marginBottom: '12px' }}
          >
            Continue
          </Button>
          <Button
            variant="ghost"
            size="md"
            onClick={handleClose}
            style={{ width: '100%' }}
          >
            Cancel
          </Button>
        </ThemedCard>
      </div>
    );
  }

  // Step 2: Upload Document
  if (step === 'upload') {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
        onClick={handleClose}
      >
        <ThemedCard
          style={{
            width: '90%',
            maxWidth: '500px',
            padding: '24px',
            cursor: 'default',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <ThemedText
              title
              style={{ fontSize: '22px', fontWeight: '700', display: 'block' }}
            >
              Upload Document
            </ThemedText>
            <button
              onClick={handleClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '24px',
              }}
            >
              <FiX />
            </button>
          </div>

          <ThemedText style={{ fontSize: '14px', opacity: 0.7, marginBottom: '20px', display: 'block' }}>
            Upload a clear photo of your {documentType === 'nin' ? 'NIN' : documentType === 'driver-license' ? "driver's license" : 'passport'}.
          </ThemedText>

          {/* Document Upload */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
              ID Document Photo
            </label>
            <div
              style={{
                border: `2px dashed ${Colors.primary}`,
                borderRadius: '8px',
                padding: '30px',
                textAlign: 'center',
                cursor: uploading ? 'not-allowed' : 'pointer',
                backgroundColor: Colors.primary + '10',
                opacity: uploading ? 0.6 : 1,
              }}
              onClick={() => !uploading && document.getElementById('document-upload')?.click()}
            >
              {documentImage ? (
                <div>
                  <FiCheckCircle size={40} color={Colors.primary} style={{ margin: '0 auto 8px' }} />
                  <ThemedText style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px', display: 'block' }}>
                    ✓ Document uploaded
                  </ThemedText>
                  <ThemedText style={{ fontSize: '12px', opacity: 0.6, display: 'block' }}>
                    {documentImage.name}
                  </ThemedText>
                </div>
              ) : (
                <div>
                  <FiCamera size={40} color={Colors.primary} style={{ margin: '0 auto 8px' }} />
                  <ThemedText style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px', display: 'block' }}>
                    Click to upload or drag and drop
                  </ThemedText>
                  <ThemedText style={{ fontSize: '12px', opacity: 0.6, display: 'block' }}>
                    JPG, PNG (max 5MB)
                  </ThemedText>
                </div>
              )}
            </div>
            <input
              id="document-upload"
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e.target.files?.[0], true)}
              disabled={uploading}
              style={{ display: 'none' }}
            />
          </div>

          {/* Document Number */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
              Document Number
            </label>
            <input
              type="text"
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
              placeholder={
                documentType === 'nin'
                  ? 'Enter your NIN (11 digits)'
                  : documentType === 'driver-license'
                  ? 'Enter license number'
                  : 'Enter passport number'
              }
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                fontSize: '14px',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Button
              variant="ghost"
              size="md"
              onClick={() => setStep('document-type')}
              style={{ width: '100%' }}
              disabled={uploading}
            >
              Back
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => setStep('selfie')}
              disabled={!documentImage || !documentNumber || uploading}
              style={{ width: '100%' }}
            >
              {uploading ? 'Uploading...' : 'Continue'}
            </Button>
          </div>
        </ThemedCard>
      </div>
    );
  }

  // Step 3: Take Selfie
  if (step === 'selfie') {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
        onClick={handleClose}
      >
        <ThemedCard
          style={{
            width: '90%',
            maxWidth: '500px',
            padding: '24px',
            cursor: 'default',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <ThemedText
              title
              style={{ fontSize: '22px', fontWeight: '700', display: 'block' }}
            >
              Selfie with ID
            </ThemedText>
            <button
              onClick={handleClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '24px',
              }}
            >
              <FiX />
            </button>
          </div>

          <ThemedText style={{ fontSize: '14px', opacity: 0.7, marginBottom: '20px', display: 'block' }}>
            Take a selfie while holding your {documentType === 'nin' ? 'NIN' : documentType === 'driver-license' ? "driver's license" : 'passport'} below your chin so the document is clearly visible.
          </ThemedText>

          {/* Instructions */}
          <div style={{ padding: '16px', backgroundColor: '#f0f9ff', borderRadius: '8px', marginBottom: '20px' }}>
            <ThemedText
              title
              style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px', display: 'block' }}
            >
              Requirements:
            </ThemedText>
            <ul style={{ fontSize: '12px', opacity: 0.7, margin: 0, paddingLeft: '20px' }}>
              <li>Hold your ID below your chin</li>
              <li>Your face must be clearly visible</li>
              <li>ID document must be fully visible</li>
              <li>Good lighting (no shadows)</li>
              <li>No filters or edits</li>
            </ul>
          </div>

          {/* Selfie Upload */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
              Your Selfie
            </label>
            <div
              style={{
                border: `2px dashed ${Colors.primary}`,
                borderRadius: '8px',
                padding: '30px',
                textAlign: 'center',
                cursor: uploading ? 'not-allowed' : 'pointer',
                backgroundColor: Colors.primary + '10',
                opacity: uploading ? 0.6 : 1,
              }}
              onClick={() => !uploading && document.getElementById('selfie-upload')?.click()}
            >
              {selfieImage ? (
                <div>
                  <FiCheckCircle size={40} color={Colors.primary} style={{ margin: '0 auto 8px' }} />
                  <ThemedText style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px', display: 'block' }}>
                    ✓ Selfie uploaded
                  </ThemedText>
                  <ThemedText style={{ fontSize: '12px', opacity: 0.6, display: 'block' }}>
                    {selfieImage.name}
                  </ThemedText>
                </div>
              ) : (
                <div>
                  <FiCamera size={40} color={Colors.primary} style={{ margin: '0 auto 8px' }} />
                  <ThemedText style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px', display: 'block' }}>
                    Click to upload or drag and drop
                  </ThemedText>
                  <ThemedText style={{ fontSize: '12px', opacity: 0.6, display: 'block' }}>
                    JPG, PNG (max 5MB)
                  </ThemedText>
                </div>
              )}
            </div>
            <input
              id="selfie-upload"
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e.target.files?.[0], false)}
              disabled={uploading}
              style={{ display: 'none' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Button
              variant="ghost"
              size="md"
              onClick={() => setStep('upload')}
              disabled={uploading}
              style={{ width: '100%' }}
            >
              Back
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => setStep('review')}
              disabled={!selfieImage || uploading}
              style={{ width: '100%' }}
            >
              {uploading ? 'Uploading...' : 'Review'}
            </Button>
          </div>
        </ThemedCard>
      </div>
    );
  }

  // Step 4: Review
  if (step === 'review') {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          overflowY: 'auto',
        }}
        onClick={handleClose}
      >
        <ThemedCard
          style={{
            width: '90%',
            maxWidth: '500px',
            padding: '24px',
            cursor: 'default',
            margin: '20px auto',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <ThemedText
              title
              style={{ fontSize: '22px', fontWeight: '700', display: 'block' }}
            >
              Review Submission
            </ThemedText>
            <button
              onClick={handleClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '24px',
              }}
            >
              <FiX />
            </button>
          </div>

          <ThemedText style={{ fontSize: '14px', opacity: 0.7, marginBottom: '20px', display: 'block' }}>
            Please review your information before submitting.
          </ThemedText>

          {/* Summary */}
          <div style={{ padding: '16px', backgroundColor: '#f0f9ff', borderRadius: '8px', marginBottom: '20px' }}>
            <ThemedText
              title
              style={{ fontSize: '13px', fontWeight: '600', marginBottom: '12px', display: 'block' }}
            >
              Verification Details:
            </ThemedText>

            <div style={{ marginBottom: '12px' }}>
              <ThemedText style={{ fontSize: '12px', opacity: 0.6, display: 'block', marginBottom: '4px' }}>
                Document Type
              </ThemedText>
              <ThemedText style={{ fontSize: '13px', fontWeight: '600', display: 'block' }}>
                {documentType === 'nin' ? 'National ID (NIN)' : documentType === 'driver-license' ? "Driver's License" : 'Passport'}
              </ThemedText>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <ThemedText style={{ fontSize: '12px', opacity: 0.6, display: 'block', marginBottom: '4px' }}>
                Document Number
              </ThemedText>
              <ThemedText style={{ fontSize: '13px', fontWeight: '600', display: 'block' }}>
                {documentNumber}
              </ThemedText>
            </div>

            <div>
              <ThemedText style={{ fontSize: '12px', opacity: 0.6, display: 'block', marginBottom: '4px' }}>
                Images
              </ThemedText>
              <ThemedText style={{ fontSize: '12px', display: 'block' }}>
                ✓ Document uploaded
              </ThemedText>
              <ThemedText style={{ fontSize: '12px', display: 'block' }}>
                ✓ Selfie uploaded
              </ThemedText>
            </div>
          </div>

          <ThemedText style={{ fontSize: '12px', opacity: 0.6, marginBottom: '24px', display: 'block' }}>
            By submitting, you confirm that all information is accurate and authentic. Fraudulent documents will result in account suspension.
          </ThemedText>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Button
              variant="ghost"
              size="md"
              onClick={() => setStep('selfie')}
              disabled={submitMutation.isPending}
              style={{ width: '100%' }}
            >
              Back
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => submitMutation.mutate()}
              disabled={submitMutation.isPending}
              style={{ width: '100%' }}
            >
              {submitMutation.isPending ? 'Submitting...' : 'Submit for Review'}
            </Button>
          </div>
        </ThemedCard>
      </div>
    );
  }
}