import { ThemedView, ThemedCard, ThemedText } from '../components/ThemedComponents';
import { PRIVACY_POLICY_VERSION } from '../constants/policies';

export default function Privacy() {
  return (
    <ThemedView style={{ minHeight: '100vh', padding: '24px' }}>
      <div style={{ maxWidth: '920px', margin: '0 auto' }}>
        <ThemedCard style={{ padding: '24px' }}>
          <ThemedText title style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px', display: 'block' }}>
            Doabli Privacy Policy
          </ThemedText>
          <ThemedText style={{ fontSize: '13px', opacity: 0.7, marginBottom: '18px', display: 'block' }}>
            Effective Date: {PRIVACY_POLICY_VERSION}
          </ThemedText>
          <ThemedText style={{ fontSize: '14px', lineHeight: 1.7, display: 'block', opacity: 0.85 }}>
            Doabli ("we," "our," "us") is committed to protecting your privacy. This Privacy Policy explains how we
            collect, use, store, and share your information when you use our platform connecting clients and runners to
            complete errands.
          </ThemedText>

          <ThemedText title style={{ fontSize: '18px', fontWeight: 700, marginTop: '18px', display: 'block' }}>
            1. Information We Collect
          </ThemedText>

          <ThemedText style={{ fontSize: '15px', fontWeight: 700, marginTop: '10px', display: 'block' }}>
            1.1 Account & Identity Data
          </ThemedText>
          <ThemedText style={{ fontSize: '14px', lineHeight: 1.7, display: 'block', opacity: 0.85 }}>
            We collect information you provide when creating an account: full name, email address, phone number, role
            (client, runner, admin), profile bio, and avatar image. Authentication credentials include passwords
            (securely hashed) and Google OAuth tokens. We also process email verification and password reset details.
            Your profile is linked to a Supabase authentication ID.
          </ThemedText>

          <ThemedText style={{ fontSize: '15px', fontWeight: 700, marginTop: '10px', display: 'block' }}>
            1.2 Errand Marketplace Data
          </ThemedText>
          <ThemedText style={{ fontSize: '14px', lineHeight: 1.7, display: 'block', opacity: 0.85 }}>
            We collect data related to errands, including title, description, location (free-text), price, proposed
            price, and billing type (hourly or fixed), as well as assigned runner, errand status history, and updates.
            We also store applications, offers, counter-offers, and acceptance flows.
          </ThemedText>

          <ThemedText style={{ fontSize: '15px', fontWeight: 700, marginTop: '10px', display: 'block' }}>
            1.3 Messaging & Communications
          </ThemedText>
          <ThemedText style={{ fontSize: '14px', lineHeight: 1.7, display: 'block', opacity: 0.85 }}>
            We store in-app messages between clients and runners, including status (sent, delivered, read) and
            timestamps. We also store notification records for messages, applications, disputes, and payouts, and
            mobile push notification device tokens sent via Firebase Cloud Messaging (FCM).
          </ThemedText>

          <ThemedText style={{ fontSize: '15px', fontWeight: 700, marginTop: '10px', display: 'block' }}>
            1.4 Contact Sharing Controls
          </ThemedText>
          <ThemedText style={{ fontSize: '14px', lineHeight: 1.7, display: 'block', opacity: 0.85 }}>
            Users can choose to share or hide email and phone numbers with counterparts. Contact info is only visible
            when the related errand is active.
          </ThemedText>

          <ThemedText style={{ fontSize: '15px', fontWeight: 700, marginTop: '10px', display: 'block' }}>
            1.5 Payments, Escrow, and Fees
          </ThemedText>
          <ThemedText style={{ fontSize: '14px', lineHeight: 1.7, display: 'block', opacity: 0.85 }}>
            Payment provider: Paystack (initialization, verification, webhooks, transfers). Stored payment data includes
            references, Paystack transaction IDs, and raw webhook events. Escrow holds funds until the client confirms
            completion; auto-release occurs after the runner marks a task done. Platform fee is 10% per transaction
            (VAT 7.5% covered by the platform).
          </ThemedText>

          <ThemedText style={{ fontSize: '15px', fontWeight: 700, marginTop: '10px', display: 'block' }}>
            1.6 Withdrawals & Banking
          </ThemedText>
          <ThemedText style={{ fontSize: '14px', lineHeight: 1.7, display: 'block', opacity: 0.85 }}>
            Bank account details include account name, number, and bank code. Accounts must match the profile name.
            Withdrawals require admin approval and are processed via Paystack transfers.
          </ThemedText>

          <ThemedText style={{ fontSize: '15px', fontWeight: 700, marginTop: '10px', display: 'block' }}>
            1.7 KYC (Sensitive Personal Data)
          </ThemedText>
          <ThemedText style={{ fontSize: '14px', lineHeight: 1.7, display: 'block', opacity: 0.85 }}>
            For withdrawals above NGN 10,000, KYC documents are collected: document type (NIN, Driver's License,
            Passport), document number, document photo, and selfie image. KYC data is stored securely in private
            Supabase storage and reviewed by admins.
          </ThemedText>

          <ThemedText style={{ fontSize: '15px', fontWeight: 700, marginTop: '10px', display: 'block' }}>
            1.8 Disputes & Evidence
          </ThemedText>
          <ThemedText style={{ fontSize: '14px', lineHeight: 1.7, display: 'block', opacity: 0.85 }}>
            We store dispute details, evidence images, runner defense details, and completion images. Admins resolve
            disputes as "released" or "refunded," with all actions logged.
          </ThemedText>

          <ThemedText style={{ fontSize: '15px', fontWeight: 700, marginTop: '10px', display: 'block' }}>
            1.9 Support & Admin Access
          </ThemedText>
          <ThemedText style={{ fontSize: '14px', lineHeight: 1.7, display: 'block', opacity: 0.85 }}>
            Support messages include name, email, subject, message, and status. Admins can access user data, KYC
            documents, disputes, withdrawals, transactions, and audit logs. Admin actions are logged in admin_audit for
            accountability.
          </ThemedText>

          <ThemedText title style={{ fontSize: '18px', fontWeight: 700, marginTop: '18px', display: 'block' }}>
            2. How We Use Your Information
          </ThemedText>
          <ThemedText style={{ fontSize: '14px', lineHeight: 1.7, display: 'block', opacity: 0.85 }}>
            We use your data to operate and improve the platform, process payments, manage escrow, handle withdrawals,
            communicate with you via messages, emails, and push notifications, verify identity for withdrawals, prevent
            fraud, resolve disputes, enforce platform rules, and maintain security.
          </ThemedText>

          <ThemedText title style={{ fontSize: '18px', fontWeight: 700, marginTop: '18px', display: 'block' }}>
            3. Third-Party Service Providers
          </ThemedText>
          <ThemedText style={{ fontSize: '14px', lineHeight: 1.7, display: 'block', opacity: 0.85 }}>
            We may share information with trusted third parties to provide our services: Supabase (authentication,
            database, storage, realtime updates), Paystack (payments, bank verification, fund transfers), SendGrid and
            Zoho SMTP (transactional and support emails), and Firebase Cloud Messaging (FCM) (push notifications for
            mobile devices). We do not sell your data to third parties.
          </ThemedText>

          <ThemedText title style={{ fontSize: '18px', fontWeight: 700, marginTop: '18px', display: 'block' }}>
            4. Data Retention
          </ThemedText>
          <ThemedText style={{ fontSize: '14px', lineHeight: 1.7, display: 'block', opacity: 0.85 }}>
            We retain data according to legal, auditing, and operational needs. Transactions, KYC, disputes, and support
            messages are retained for auditing and legal compliance. Messages, reviews, and user-generated content are
            retained until the errand or account is deleted, plus audit requirements.
          </ThemedText>

          <ThemedText title style={{ fontSize: '18px', fontWeight: 700, marginTop: '18px', display: 'block' }}>
            5. Your Rights
          </ThemedText>
          <ThemedText style={{ fontSize: '14px', lineHeight: 1.7, display: 'block', opacity: 0.85 }}>
            Depending on applicable law, you may access, correct, or request deletion of your personal data, opt out of
            marketing communications, control visibility of your contact info and profile, and withdraw consent where
            legally possible.
          </ThemedText>

          <ThemedText title style={{ fontSize: '18px', fontWeight: 700, marginTop: '18px', display: 'block' }}>
            6. Security
          </ThemedText>
          <ThemedText style={{ fontSize: '14px', lineHeight: 1.7, display: 'block', opacity: 0.85 }}>
            We implement reasonable measures to protect your data. Passwords are securely hashed, sensitive files
            (including KYC documents) are stored in private buckets, and admin access is logged and monitored. Regular
            backups and audits are conducted.
          </ThemedText>

          <ThemedText title style={{ fontSize: '18px', fontWeight: 700, marginTop: '18px', display: 'block' }}>
            7. Children
          </ThemedText>
          <ThemedText style={{ fontSize: '14px', lineHeight: 1.7, display: 'block', opacity: 0.85 }}>
            Our platform is not intended for children under 13.
          </ThemedText>

          <ThemedText title style={{ fontSize: '18px', fontWeight: 700, marginTop: '18px', display: 'block' }}>
            8. Policy Updates
          </ThemedText>
          <ThemedText style={{ fontSize: '14px', lineHeight: 1.7, display: 'block', opacity: 0.85 }}>
            We may update this Privacy Policy to reflect platform changes or legal requirements. Changes will be posted
            at /privacy with the updated effective date.
          </ThemedText>

          <ThemedText title style={{ fontSize: '18px', fontWeight: 700, marginTop: '18px', display: 'block' }}>
            9. Contact Us
          </ThemedText>
          <ThemedText style={{ fontSize: '14px', lineHeight: 1.7, display: 'block', opacity: 0.85 }}>
            For questions about this Privacy Policy or your personal data, contact: support@doabli.com
          </ThemedText>
        </ThemedCard>
      </div>
    </ThemedView>
  );
}
