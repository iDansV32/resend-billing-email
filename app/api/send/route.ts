import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import BillingFailureEmail from '@/emails/billing-failure';

// Reading a file off disk needs Node, not the Edge runtime.
export const runtime = 'nodejs';

export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;

  // Fail loudly and specifically. A missing key otherwise surfaces later as a
  // confusing 401 from the API, which is a worse thing to debug.
  if (!apiKey || !from) {
    return NextResponse.json(
      {
        error:
          'Missing RESEND_API_KEY or RESEND_FROM. Copy .env.example to .env.local and fill both in.',
      },
      { status: 500 },
    );
  }

  const { to } = (await request.json().catch(() => ({}))) as { to?: string };
  if (!to) {
    return NextResponse.json(
      { error: 'Send a JSON body with a "to" address.' },
      { status: 400 },
    );
  }

  const resend = new Resend(apiKey);

  // The invoice lives in the repo so the example runs with no external storage.
  // In production this would come from S3 or wherever you generate invoices.
  const invoice = await readFile(
    path.join(process.cwd(), 'invoices', 'INV-2026-0814.pdf'),
  );

  const { data, error } = await resend.emails.send({
    from,
    to,
    subject: 'Your payment did not go through (invoice INV-2026-0814)',
    react: BillingFailureEmail({
      updatePaymentUrl: 'https://jointhereef.com/billing',
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
    // Pass the API's own error through rather than flattening it. The name and
    // message are what you need to tell a 403 from a 422.
    return NextResponse.json({ error }, { status: 400 });
  }

  return NextResponse.json({ id: data?.id });
}
