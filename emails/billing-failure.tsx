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
  /** Only set for the take-home submission. Omitted in the real example. */
  repoUrl?: string;
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
  updatePaymentUrl: 'https://jointhereef.com/billing',
  supportEmail: 'support@jointhereef.com',
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
    repoUrl,
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
            We could not process your payment of <strong>{amountDue}</strong>{' '}
            for invoice <strong>{invoiceNumber}</strong>. The card on file is the{' '}
            {cardBrand} ending {cardLast4}, and a copy of the invoice is attached.
          </Text>

          <Text style={paragraph}>
            <strong>Your account is still active.</strong> We will try the same
            card again on {nextRetryDate}. If it has not gone through by{' '}
            {gracePeriodEnds}, the subscription will be paused.
          </Text>

          {/* One action. React Email ships a <Button>, which is an anchor styled
              to look like one; this is the same thing with the styles inline so
              the whole template is visible in one file. */}
          <Section style={actionSection}>
            <Link href={updatePaymentUrl} style={action}>
              Update your payment method
            </Link>
          </Section>

          <Text style={paragraph}>
            Declines like this are often the card expiring, a new billing
            address, or the bank flagging a recurring charge. Updating the card
            is usually all it takes.
          </Text>

          <Hr style={hr} />

          <Text style={footer}>
            If you think this is a mistake, reply to this email or write to{' '}
            <Link href={`mailto:${supportEmail}`} style={footerLink}>
              {supportEmail}
            </Link>
            .
          </Text>

          {repoUrl && (
            <Text style={footer}>
              Built as a worked example.{' '}
              <Link href={repoUrl} style={footerLink}>
                {repoUrl.replace('https://', '')}
              </Link>
            </Text>
          )}
        </Container>
      </Body>
    </Html>
  );
}

/* Email clients only reliably support inline styles, so everything is a plain
   object rather than a stylesheet. Web font support varies by client: React
   Email ships a <Font> component for it, but a system stack renders the same
   everywhere with no fallback to reason about, which is the right trade for a
   billing notice. */

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
