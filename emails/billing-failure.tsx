import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';

export interface BillingFailureEmailProps {
  customerName: string;
  amountDue: string;
  cardBrand: string;
  cardLast4: string;
  invoiceNumber: string;
  nextRetryDate: string;
  gracePeriodEnds: string;
  updatePaymentUrl: string;
  supportEmail: string;
}

// Sensible defaults so the React Email preview server renders something real.
export const defaultProps: BillingFailureEmailProps = {
  customerName: 'Alex',
  amountDue: '$49.00',
  cardBrand: 'Visa',
  cardLast4: '4242',
  invoiceNumber: 'INV-2026-0814',
  nextRetryDate: 'Thursday 27 August',
  gracePeriodEnds: '8 September',
  updatePaymentUrl: 'https://example.com/billing',
  supportEmail: 'support@example.com',
};

export default function BillingFailureEmail(
  props: Partial<BillingFailureEmailProps> = {},
) {
  const {
    customerName,
    amountDue,
    cardBrand,
    cardLast4,
    invoiceNumber,
    nextRetryDate,
    gracePeriodEnds,
    updatePaymentUrl,
    supportEmail,
  } = { ...defaultProps, ...props };

  return (
    <Html lang="en">
      <Head />
      {/* The preview text is the grey line next to the subject in most inboxes.
          Leave it out and the client shows the first words of the body instead. */}
      <Preview>
        Your {amountDue} payment did not go through. Nothing has been cancelled.
      </Preview>
      <Body style={body}>
        <Container style={container}>
          <Text style={eyebrow}>Billing</Text>

          <Heading style={heading}>We could not process your payment</Heading>

          <Text style={paragraph}>Hi {customerName},</Text>

          <Text style={paragraph}>
            Your payment of <strong>{amountDue}</strong> for invoice{' '}
            <strong>{invoiceNumber}</strong> was declined by your bank. The card
            on file is the {cardBrand} ending {cardLast4}. A copy of the invoice
            is attached to this email.
          </Text>

          <Text style={paragraph}>
            <strong>Your account is still active.</strong> We will try the same
            card again on {nextRetryDate}. If it has not gone through by{' '}
            {gracePeriodEnds}, the subscription will be paused.
          </Text>

          {/* One action, stated as a link rather than a button.
              Buttons in email are table hacks and some clients strip them. */}
          <Section style={actionSection}>
            <Link href={updatePaymentUrl} style={action}>
              Update your payment method
            </Link>
          </Section>

          <Text style={paragraph}>
            Most declines are the card expiring, a new billing address, or the
            bank flagging a recurring charge. Updating the card usually clears
            it in a couple of minutes.
          </Text>

          <Hr style={hr} />

          <Text style={footer}>
            If you think this is a mistake, reply to this email or write to{' '}
            <Link href={`mailto:${supportEmail}`} style={footerLink}>
              {supportEmail}
            </Link>
            . A person reads it.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

/* Email clients only reliably support inline styles, so everything is a plain
   object rather than a stylesheet. Web fonts do not load either, which is why
   the stack below is all system fonts. */

const body = {
  backgroundColor: '#f4f4f5',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  margin: 0,
  padding: '32px 0',
};

const container = {
  backgroundColor: '#ffffff',
  border: '1px solid #e4e4e7',
  borderRadius: '8px',
  margin: '0 auto',
  maxWidth: '560px',
  padding: '40px',
};

const eyebrow = {
  color: '#71717a',
  fontSize: '12px',
  fontWeight: 600,
  letterSpacing: '0.06em',
  margin: '0 0 12px',
  textTransform: 'uppercase' as const,
};

const heading = {
  color: '#18181b',
  fontSize: '22px',
  fontWeight: 600,
  lineHeight: '30px',
  margin: '0 0 24px',
};

const paragraph = {
  color: '#3f3f46',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '0 0 16px',
};

const actionSection = {
  margin: '28px 0',
};

const action = {
  backgroundColor: '#18181b',
  borderRadius: '6px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '15px',
  fontWeight: 600,
  padding: '12px 20px',
  textDecoration: 'none',
};

const hr = {
  border: 'none',
  borderTop: '1px solid #e4e4e7',
  margin: '32px 0 20px',
};

const footer = {
  color: '#71717a',
  fontSize: '13px',
  lineHeight: '20px',
  margin: 0,
};

const footerLink = {
  color: '#71717a',
  textDecoration: 'underline',
};
