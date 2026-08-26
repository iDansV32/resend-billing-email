import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import BillingFailureEmail from '@/emails/billing-failure';

// Reading a file off disk needs Node, not the Edge runtime.
export const runtime = 'nodejs';

/**
 * This route is a demonstration, not production code. Three things it
 * deliberately does not do, which you would need before putting it anywhere real:
 *
 *   - Authenticate the caller. As written, anyone who can reach this endpoint
 *     can spend your sending quota. Put it behind a session check, or restrict
 *     it to your own billing webhook.
 *   - Deduplicate. A billing webhook retried after a timeout sends a second
 *     notice. Pass an idempotency key derived from the invoice so a retry is a
 *     no-op rather than a duplicate charge notification.
 *   - Use real data. The customer, amount, invoice number, card and dates below
 *     are hard-coded so the example runs with no database. In production they
 *     come from the payment event that triggered the send.
 */

export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;

  // Fail loudly and specifically. A missing key otherwise surfaces later as a
  // confusing 401 from the API, which is a worse thing to debug.
  if (!apiKey || !from) {
    return NextResponse.json(
      {
        error: {
          message:
            'Missing RESEND_API_KEY or RESEND_FROM. Copy .env.example to .env.local and fill both in.',
        },
      },
      { status: 500 },
    );
  }

  const { to } = (await request.json().catch(() => ({}))) as { to?: string };
  if (!to || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) {
    return NextResponse.json(
      { error: { message: 'Send a JSON body with a valid "to" address.' } },
      { status: 400 },
    );
  }

  const resend = new Resend(apiKey);

  try {
    // The invoice lives in the repo so the example runs with no external storage.
    // In production this would come from wherever you generate invoices.
    const invoice = await readFile(
      path.join(process.cwd(), 'invoices', 'INV-2026-0814.pdf'),
    );

    const { data, error } = await resend.emails.send({
      from,
      to,
      // The email tells the customer a person reads replies, so replies have to
      // reach a person. Without this they go to the sending address, which on
      // the sandbox sender is nobody at all.
      replyTo: process.env.RESEND_REPLY_TO ?? from,
      subject: 'Your payment did not go through (invoice INV-2026-0814)',
      react: BillingFailureEmail({
        updatePaymentUrl: 'https://jointhereef.com/billing',
        // Same mailbox replyTo points at, so the footer and the actual reply
        // routing cannot drift apart.
        supportEmail: process.env.RESEND_REPLY_TO ?? from,
        // Optional. Set REPO_URL to append a "built as a worked example" line.
        repoUrl: process.env.REPO_URL,
      }),
      attachments: [
        {
          filename: 'INV-2026-0814.pdf',
          content: invoice,
        },
      ],
      // Tags are optional. They make the message findable in the dashboard later,
      // which matters when someone asks "did this actually send?".
      tags: [{ name: 'category', value: 'billing_failure' }],
    });

    if (error) {
      // Preserve the upstream status. Flattening everything to 400 destroys the
      // distinction between "your key is wrong" (401), "this domain is not
      // verified" (403), "the payload is invalid" (422) and "slow down" (429),
      // which is the entire diagnostic value of the response.
      const status =
        typeof (error as { statusCode?: number }).statusCode === 'number'
          ? (error as { statusCode: number }).statusCode
          : 502;
      return NextResponse.json({ error }, { status });
    }

    return NextResponse.json({ id: data?.id });
  } catch (cause) {
    // The likeliest cause is a missing invoice PDF, which throws ENOENT and says
    // nothing about email. Surface the real message rather than a bare 500.
    const message =
      cause instanceof Error ? cause.message : 'Unexpected error sending the email.';
    return NextResponse.json({ error: { message } }, { status: 500 });
  }
}
