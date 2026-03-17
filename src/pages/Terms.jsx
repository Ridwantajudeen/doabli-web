import { ThemedView, ThemedCard, ThemedText } from '../components/ThemedComponents';
import { TERMS_OF_SERVICE_VERSION } from '../constants/policies';

export default function Terms() {
  return (
    <ThemedView style={{ minHeight: '100vh', padding: '24px' }}>
      <div style={{ maxWidth: '920px', margin: '0 auto' }}>
        <ThemedCard style={{ padding: '24px' }}>
          <ThemedText title style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px', display: 'block' }}>
            Doabli Terms of Service
          </ThemedText>
          <ThemedText style={{ fontSize: '13px', opacity: 0.7, marginBottom: '18px', display: 'block' }}>
            Effective Date: {TERMS_OF_SERVICE_VERSION}
          </ThemedText>
          <ThemedText style={{ fontSize: '14px', lineHeight: 1.7, display: 'block', opacity: 0.85 }}>
            These Terms of Service ("Terms") govern your use of Doabli ("we," "our," "us"), a platform connecting
            clients and runners to complete errands. By using the platform, you agree to these Terms.
          </ThemedText>

          <ThemedText title style={{ fontSize: '18px', fontWeight: 700, marginTop: '18px', display: 'block' }}>
            1. Platform Role
          </ThemedText>
          <ThemedText style={{ fontSize: '14px', lineHeight: 1.7, display: 'block', opacity: 0.85 }}>
            Doabli is a marketplace connecting clients with independent service providers (runners). Doabli does not
            directly provide the services listed on the platform. We are not responsible for the actions, omissions, or
            performance of users.
          </ThemedText>

          <ThemedText title style={{ fontSize: '18px', fontWeight: 700, marginTop: '18px', display: 'block' }}>
            2. Account Creation & Obligations
          </ThemedText>
          <ThemedText style={{ fontSize: '14px', lineHeight: 1.7, display: 'block', opacity: 0.85 }}>
            You must provide accurate, current information when registering. You are responsible for keeping your
            account credentials secure. You must comply with all platform rules and applicable laws. Accounts may be
            suspended or terminated for policy violations, fraud, harassment, or illegal activity.
          </ThemedText>

          <ThemedText title style={{ fontSize: '18px', fontWeight: 700, marginTop: '18px', display: 'block' }}>
            3. Payments & Escrow
          </ThemedText>
          <ThemedText style={{ fontSize: '14px', lineHeight: 1.7, display: 'block', opacity: 0.85 }}>
            All payments are processed via Paystack. Payments for errands are held in escrow until the client confirms
            task completion. Automatic release occurs after the runner marks a task done, unless a dispute is initiated.
            Platform fee: 10% per transaction (VAT included). You agree that payment instructions via the platform are
            binding and accurate.
          </ThemedText>

          <ThemedText title style={{ fontSize: '18px', fontWeight: 700, marginTop: '18px', display: 'block' }}>
            4. Withdrawals & Banking
          </ThemedText>
          <ThemedText style={{ fontSize: '14px', lineHeight: 1.7, display: 'block', opacity: 0.85 }}>
            Bank account details must match the registered profile name. Withdrawals are reviewed and approved by
            admins before processing via Paystack. Withdrawals above NGN 10,000 require KYC verification.
          </ThemedText>

          <ThemedText title style={{ fontSize: '18px', fontWeight: 700, marginTop: '18px', display: 'block' }}>
            5. KYC & Sensitive Data
          </ThemedText>
          <ThemedText style={{ fontSize: '14px', lineHeight: 1.7, display: 'block', opacity: 0.85 }}>
            KYC documents (NIN, Driver's License, Passport, selfie) may be required for withdrawals. KYC data is stored
            securely and reviewed by admins. Providing false KYC information may result in account suspension.
          </ThemedText>

          <ThemedText title style={{ fontSize: '18px', fontWeight: 700, marginTop: '18px', display: 'block' }}>
            6. Messaging & Content
          </ThemedText>
          <ThemedText style={{ fontSize: '14px', lineHeight: 1.7, display: 'block', opacity: 0.85 }}>
            Users may send messages and upload images, reviews, or other content. By using the platform, you grant
            Doabli the right to store, display, and moderate content. Messaging and user-generated content may be used
            for dispute resolution and auditing.
          </ThemedText>

          <ThemedText title style={{ fontSize: '18px', fontWeight: 700, marginTop: '18px', display: 'block' }}>
            7. Disputes & Admin Authority
          </ThemedText>
          <ThemedText style={{ fontSize: '14px', lineHeight: 1.7, display: 'block', opacity: 0.85 }}>
            Admin decisions on disputes, escrow release, and refunds are final. Dispute resolution is based on
            available evidence, messaging logs, and KYC verification. Users agree to cooperate with the platform
            during dispute investigations.
          </ThemedText>

          <ThemedText title style={{ fontSize: '18px', fontWeight: 700, marginTop: '18px', display: 'block' }}>
            8. User Conduct
          </ThemedText>
          <ThemedText style={{ fontSize: '14px', lineHeight: 1.7, display: 'block', opacity: 0.85 }}>
            Users must not engage in fraudulent or illegal activity, harass or abuse other users, or attempt to bypass
            escrow or payment rules. Doabli may suspend or terminate accounts violating these rules.
          </ThemedText>

          <ThemedText title style={{ fontSize: '18px', fontWeight: 700, marginTop: '18px', display: 'block' }}>
            9. Limitation of Liability
          </ThemedText>
          <ThemedText style={{ fontSize: '14px', lineHeight: 1.7, display: 'block', opacity: 0.85 }}>
            Doabli is not liable for loss, damages, or disputes arising from the actions of runners or clients. Payment
            errors, delays, or disputes are handled via escrow and admin review.
          </ThemedText>

          <ThemedText title style={{ fontSize: '18px', fontWeight: 700, marginTop: '18px', display: 'block' }}>
            10. Termination
          </ThemedText>
          <ThemedText style={{ fontSize: '14px', lineHeight: 1.7, display: 'block', opacity: 0.85 }}>
            Accounts may be terminated for violations, inactivity, or at the user's request. Termination does not
            affect your obligations regarding pending errands, payments, or disputes.
          </ThemedText>

          <ThemedText title style={{ fontSize: '18px', fontWeight: 700, marginTop: '18px', display: 'block' }}>
            11. Privacy & Data Use
          </ThemedText>
          <ThemedText style={{ fontSize: '14px', lineHeight: 1.7, display: 'block', opacity: 0.85 }}>
            Use of the platform is subject to our Privacy Policy (/privacy). By using the platform, you consent to
            collection and use of data as described in the Privacy Policy.
          </ThemedText>

          <ThemedText title style={{ fontSize: '18px', fontWeight: 700, marginTop: '18px', display: 'block' }}>
            12. Governing Law
          </ThemedText>
          <ThemedText style={{ fontSize: '14px', lineHeight: 1.7, display: 'block', opacity: 0.85 }}>
            These Terms are governed by Nigerian laws, including applicable privacy regulations (NDPR). Users agree to
            platform arbitration for disputes prior to taking legal action.
          </ThemedText>

          <ThemedText title style={{ fontSize: '18px', fontWeight: 700, marginTop: '18px', display: 'block' }}>
            13. Changes to Terms
          </ThemedText>
          <ThemedText style={{ fontSize: '14px', lineHeight: 1.7, display: 'block', opacity: 0.85 }}>
            Doabli may update these Terms from time to time. Updated Terms will be posted at /terms with a new effective
            date. Continued use of the platform constitutes acceptance of the updated Terms.
          </ThemedText>

          <ThemedText title style={{ fontSize: '18px', fontWeight: 700, marginTop: '18px', display: 'block' }}>
            14. Contact
          </ThemedText>
          <ThemedText style={{ fontSize: '14px', lineHeight: 1.7, display: 'block', opacity: 0.85 }}>
            For questions about these Terms, disputes, or platform rules: support@doabli.com
          </ThemedText>
        </ThemedCard>
      </div>
    </ThemedView>
  );
}
