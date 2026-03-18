import { ThemedView, ThemedCard, ThemedText } from '../components/ThemedComponents';
import { DATA_POLICY_VERSION } from '../constants/policies';
import Seo from '../components/Seo';

export default function DataPolicy() {
  return (
    <ThemedView style={{ minHeight: '100vh', padding: '24px' }}>
      <Seo
        title="Doabli Data Policy"
        description="Read the Doabli Data Policy and learn how data is collected, stored, and used."
        path="/data-policy"
      />
      <div style={{ maxWidth: '920px', margin: '0 auto' }}>
        <ThemedCard style={{ padding: '24px' }}>
          <ThemedText title style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px', display: 'block' }}>
            Doabli Data Policy
          </ThemedText>
          <ThemedText style={{ fontSize: '13px', opacity: 0.7, marginBottom: '18px', display: 'block' }}>
            Effective Date: {DATA_POLICY_VERSION}
          </ThemedText>
          <ThemedText style={{ fontSize: '14px', lineHeight: 1.7, display: 'block', opacity: 0.85 }}>
            Doabli ("we," "our," "us") is committed to responsibly handling user data. This Data Policy explains how we
            collect, store, use, and analyze data to improve our platform while protecting your privacy.
          </ThemedText>

          <ThemedText title style={{ fontSize: '18px', fontWeight: 700, marginTop: '18px', display: 'block' }}>
            1. Scope of Data
          </ThemedText>
          <ThemedText style={{ fontSize: '15px', fontWeight: 700, marginTop: '10px', display: 'block' }}>
            1.1 Personal Data
          </ThemedText>
          <ThemedText style={{ fontSize: '14px', lineHeight: 1.7, display: 'block', opacity: 0.85 }}>
            Includes account information, profile details, contact info, messaging, payments, KYC documents, and
            support interactions. Personal data is handled according to our Privacy Policy (/privacy).
          </ThemedText>

          <ThemedText style={{ fontSize: '15px', fontWeight: 700, marginTop: '10px', display: 'block' }}>
            1.2 Non-Personal / Aggregated Data
          </ThemedText>
          <ThemedText style={{ fontSize: '14px', lineHeight: 1.7, display: 'block', opacity: 0.85 }}>
            Includes anonymized metrics such as number of errands created, completed, or canceled; platform usage
            patterns (time spent, pages visited, feature usage); device type, browser, and general location (for
            analytics purposes). This data cannot identify individual users and is used for improving platform
            functionality.
          </ThemedText>

          <ThemedText title style={{ fontSize: '18px', fontWeight: 700, marginTop: '18px', display: 'block' }}>
            2. How We Use Data
          </ThemedText>
          <ThemedText style={{ fontSize: '14px', lineHeight: 1.7, display: 'block', opacity: 0.85 }}>
            We use both personal and non-personal data to improve platform features and user experience, optimize
            website and mobile app performance, analyze trends and engagement to better match clients with runners,
            monitor platform health, detect errors, prevent fraud, and comply with legal or regulatory obligations when
            necessary.
          </ThemedText>

          <ThemedText title style={{ fontSize: '18px', fontWeight: 700, marginTop: '18px', display: 'block' }}>
            3. Data Sharing
          </ThemedText>
          <ThemedText style={{ fontSize: '14px', lineHeight: 1.7, display: 'block', opacity: 0.85 }}>
            Personal data is shared only with trusted third parties required for platform operations (e.g., Supabase,
            Paystack, FCM, email providers). Aggregated and anonymized data may be shared for platform analytics,
            research, and marketing insights without revealing any individual user's identity. We do not sell personal
            data to third parties.
          </ThemedText>

          <ThemedText title style={{ fontSize: '18px', fontWeight: 700, marginTop: '18px', display: 'block' }}>
            4. Data Storage & Retention
          </ThemedText>
          <ThemedText style={{ fontSize: '14px', lineHeight: 1.7, display: 'block', opacity: 0.85 }}>
            Personal data is stored securely according to our Privacy Policy. Aggregated and non-identifiable data may
            be retained indefinitely for analytics and platform improvement. We regularly audit stored data to ensure
            accuracy and security.
          </ThemedText>

          <ThemedText title style={{ fontSize: '18px', fontWeight: 700, marginTop: '18px', display: 'block' }}>
            5. Your Rights
          </ThemedText>
          <ThemedText style={{ fontSize: '14px', lineHeight: 1.7, display: 'block', opacity: 0.85 }}>
            Users can access, correct, or delete their personal data via the platform. Users may opt out of analytics
            tracking where feasible (e.g., push notifications, non-essential cookies). Contact us at support@doabli.com
            for questions regarding data usage.
          </ThemedText>

          <ThemedText title style={{ fontSize: '18px', fontWeight: 700, marginTop: '18px', display: 'block' }}>
            6. Security
          </ThemedText>
          <ThemedText style={{ fontSize: '14px', lineHeight: 1.7, display: 'block', opacity: 0.85 }}>
            All personal and aggregated data is stored using industry-standard security practices. Admin access to data
            is logged and monitored. We regularly review security measures to prevent unauthorized access or misuse.
          </ThemedText>

          <ThemedText title style={{ fontSize: '18px', fontWeight: 700, marginTop: '18px', display: 'block' }}>
            7. Policy Updates
          </ThemedText>
          <ThemedText style={{ fontSize: '14px', lineHeight: 1.7, display: 'block', opacity: 0.85 }}>
            This Data Policy may be updated to reflect changes in platform features or analytics practices.
          </ThemedText>
        </ThemedCard>
      </div>
    </ThemedView>
  );
}
