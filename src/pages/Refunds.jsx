import { ThemedView, ThemedCard, ThemedText } from '../components/ThemedComponents';
import Seo from '../components/Seo';

export default function Refunds() {
  return (
    <ThemedView style={{ minHeight: '100vh', padding: '24px' }}>
      <Seo
        title="Doabli Refund Policy"
        description="Read the Doabli Refund Policy and understand how refunds are handled."
        path="/refunds"
      />
      <div style={{ maxWidth: '920px', margin: '0 auto' }}>
        <ThemedCard style={{ padding: '24px' }}>
          <ThemedText title style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px', display: 'block' }}>
            Doabli Refund & Escrow Policy
          </ThemedText>
          <ThemedText style={{ fontSize: '13px', opacity: 0.7, marginBottom: '18px', display: 'block' }}>
            Effective Date: March 2026
          </ThemedText>
          <ThemedText style={{ fontSize: '14px', lineHeight: 1.7, display: 'block', opacity: 0.85 }}>
            Doabli ("we," "our," "us") provides a secure escrow system to ensure safe transactions between clients and
            runners. This Refund & Escrow Policy explains how funds are held, released, and refunded on the platform.
          </ThemedText>

          <ThemedText title style={{ fontSize: '18px', fontWeight: 700, marginTop: '18px', display: 'block' }}>
            1. Escrow Overview
          </ThemedText>
          <ThemedText style={{ fontSize: '14px', lineHeight: 1.7, display: 'block', opacity: 0.85 }}>
            All payments for errands are held in escrow until the task is confirmed as completed. The escrow system
            ensures funds are not released until the client approves completion, protecting both clients and runners.
            Platform fee (10%) is automatically deducted from the payment before release to the runner.
          </ThemedText>

          <ThemedText title style={{ fontSize: '18px', fontWeight: 700, marginTop: '18px', display: 'block' }}>
            2. Payment Flow
          </ThemedText>
          <ThemedText style={{ fontSize: '14px', lineHeight: 1.7, display: 'block', opacity: 0.85 }}>
            Client payment: the client pays for an errand via Paystack and the full amount is held in escrow. Errand
            completion: the runner marks the errand as completed. Client confirmation: the client confirms completion,
            triggering the release of funds to the runner. Automatic release: if the client does not respond within a
            defined period, funds are auto-released to the runner.
          </ThemedText>

          <ThemedText title style={{ fontSize: '18px', fontWeight: 700, marginTop: '18px', display: 'block' }}>
            3. Refunds
          </ThemedText>
          <ThemedText style={{ fontSize: '14px', lineHeight: 1.7, display: 'block', opacity: 0.85 }}>
            Refunds may be issued under the following circumstances: errand cancellation before the runner starts, a
            dispute resolution that results in a refund, or payment errors such as duplicate payments or technical
            errors. Refunds are processed via the original payment method and may take several business days to appear
            in your account.
          </ThemedText>

          <ThemedText title style={{ fontSize: '18px', fontWeight: 700, marginTop: '18px', display: 'block' }}>
            4. Disputes
          </ThemedText>
          <ThemedText style={{ fontSize: '14px', lineHeight: 1.7, display: 'block', opacity: 0.85 }}>
            Clients can raise a dispute if there is an issue with the errand. Disputes are reviewed by Doabli admins,
            who may request messages between client and runner, evidence (photos, documents), and KYC verification if
            needed. Admin decisions are final and determine whether funds are released to the runner or refunded to the
            client.
          </ThemedText>

          <ThemedText title style={{ fontSize: '18px', fontWeight: 700, marginTop: '18px', display: 'block' }}>
            5. Platform Fee & VAT
          </ThemedText>
          <ThemedText style={{ fontSize: '14px', lineHeight: 1.7, display: 'block', opacity: 0.85 }}>
            Doabli charges a 10% platform fee per transaction, which includes VAT. Platform fees are deducted before
            funds are released to the runner. Fees are non-refundable except in cases of duplicate payments or
            admin-approved exceptions.
          </ThemedText>

          <ThemedText title style={{ fontSize: '18px', fontWeight: 700, marginTop: '18px', display: 'block' }}>
            6. Withdrawals & Banking
          </ThemedText>
          <ThemedText style={{ fontSize: '14px', lineHeight: 1.7, display: 'block', opacity: 0.85 }}>
            Withdrawals to bank accounts require admin approval. Bank accounts must match the registered profile name.
            Withdrawals above NGN 10,000 require KYC verification. Admins reserve the right to pause or review
            withdrawals in case of suspicious activity, disputes, or errors.
          </ThemedText>

          <ThemedText title style={{ fontSize: '18px', fontWeight: 700, marginTop: '18px', display: 'block' }}>
            7. Payment Provider
          </ThemedText>
          <ThemedText style={{ fontSize: '14px', lineHeight: 1.7, display: 'block', opacity: 0.85 }}>
            All payments and transfers are processed through Paystack. We store payment references, transaction IDs,
            and raw webhook events for auditing. Doabli is not responsible for delays caused by the payment processor.
          </ThemedText>

          <ThemedText title style={{ fontSize: '18px', fontWeight: 700, marginTop: '18px', display: 'block' }}>
            8. Timing & Processing
          </ThemedText>
          <ThemedText style={{ fontSize: '14px', lineHeight: 1.7, display: 'block', opacity: 0.85 }}>
            Escrow release occurs immediately upon client confirmation or after the auto-release period. Refunds
            typically take 3 to 5 business days to process via the payment provider. Withdrawals to bank accounts may
            also take additional processing time depending on banking schedules.
          </ThemedText>

          <ThemedText title style={{ fontSize: '18px', fontWeight: 700, marginTop: '18px', display: 'block' }}>
            9. User Responsibilities
          </ThemedText>
          <ThemedText style={{ fontSize: '14px', lineHeight: 1.7, display: 'block', opacity: 0.85 }}>
            Clients should confirm completion only when satisfied with the errand. Runners should mark errands complete
            only when work is fully done. Both parties must communicate clearly and provide evidence if requested during
            disputes.
          </ThemedText>

          <ThemedText title style={{ fontSize: '18px', fontWeight: 700, marginTop: '18px', display: 'block' }}>
            10. Limitation of Liability
          </ThemedText>
          <ThemedText style={{ fontSize: '14px', lineHeight: 1.7, display: 'block', opacity: 0.85 }}>
            Doabli is not responsible for loss, delay, or errors caused by third-party payment processors. Admins handle
            disputes and refunds based on available evidence; users agree to abide by these decisions. Doabli does not
            guarantee specific outcomes for disputes, only fair processing according to platform rules.
          </ThemedText>

          <ThemedText title style={{ fontSize: '18px', fontWeight: 700, marginTop: '18px', display: 'block' }}>
            11. Changes to Policy
          </ThemedText>
          <ThemedText style={{ fontSize: '14px', lineHeight: 1.7, display: 'block', opacity: 0.85 }}>
            This Refund & Escrow Policy may be updated to reflect changes in the platform or legal requirements.
            Updates will be posted at /refunds with a new effective date. Continued use of the platform indicates
            acceptance of the updated policy.
          </ThemedText>

          <ThemedText title style={{ fontSize: '18px', fontWeight: 700, marginTop: '18px', display: 'block' }}>
            12. Contact
          </ThemedText>
          <ThemedText style={{ fontSize: '14px', lineHeight: 1.7, display: 'block', opacity: 0.85 }}>
            For questions regarding escrow or refunds, contact: support@doabli.com
          </ThemedText>
        </ThemedCard>
      </div>
    </ThemedView>
  );
}
