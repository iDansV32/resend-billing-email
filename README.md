# Send a billing failure email with React Email and Resend

A complete, working example of the email you send when a customer's card is declined, built with Next.js,
[React Email](https://react.email) and [Resend](https://resend.com). Includes the invoice as an attachment.

This README takes you from an empty folder to a sent email, and shows you where to confirm delivery. Most
code blocks paste as they are; the two that are abridged say so and link to the complete file in this repo.

**What you end up with:** a page with one input, and an API route that renders a React email and sends it
with the invoice attached.

*Part of a take-home for Resend. The customer-ticket exercise is in
**[Ivan_Dans_Resend_Tickets.pdf](Ivan_Dans_Resend_Tickets.pdf)** (also as
[TICKETS.md](TICKETS.md)), and setup friction notes are in [STUMBLE_LOG.md](STUMBLE_LOG.md).*

---

## Before you start

- **Node 20.9 or newer**, which is what Next.js 16 requires. `node -v` to check.
- **A Resend account.** Free, and enough for everything here.
- **An API key**, from [resend.com/api-keys](https://resend.com/api-keys). Copy it when it is created,
  because it is only shown once.

### One thing that catches everybody

**Until you verify a domain, Resend only lets you send to the email address you signed up with.**

That is a deliberate anti-abuse measure, not a bug, and it is a common reason a first attempt returns a 403. You have two options:

- **You own a domain:** add it at [resend.com/domains](https://resend.com/domains), add the DNS records it
  gives you, wait for verification, then send anywhere.
- **You do not:** send from `onboarding@resend.dev` to your own signup address. Everything in this tutorial
  works. You just cannot send to anyone else yet.

The rest of this guide assumes the second case, because it needs nothing you do not already have.

---

## 1. Create the project

```bash
npx create-next-app@latest resend-billing-email \
  --typescript --eslint --app --no-tailwind --no-src-dir --import-alias "@/*"
cd resend-billing-email
```

## 2. Install the dependencies

```bash
npm install resend @react-email/components
npm install --save-dev react-email @react-email/ui
```

- `resend` is the SDK that sends the message.
- `@react-email/components` is the component library you build the email from.
- `react-email` is the local preview server, and `@react-email/ui` is what it renders with. **Install the
  second one now.** If you skip it, the preview server stops on a prompt asking to install it, which is
  confusing the first time and breaks any non-interactive setup.

If your first build warns that Next.js ignored a `package-lock.json` outside the project, pin the root in
`next.config.ts`. Turbopack walks up the filesystem looking for a lockfile and can settle on an unrelated one:

```ts
import path from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  turbopack: { root: path.resolve(__dirname) },
};

export default nextConfig;
```

Add the preview script to `package.json`:

```json
"scripts": {
  "email": "email dev --dir emails --port 3001"
}
```

## 3. Add your API key

Create `.env.example` and commit it, so the next person knows what the project needs:

```bash
# Your Resend API key. Create one at https://resend.com/api-keys
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxx

# The address the email is sent from.
# Before you verify a domain, use onboarding@resend.dev
# After you verify one, use something on it, e.g. billing@yourdomain.com
RESEND_FROM=onboarding@resend.dev
```

Then copy it to `.env.local` and fill in your real key:

```bash
cp .env.example .env.local
```

**`.env.local` is gitignored by default and must stay that way.** A leaked API key can send mail as you.

**One gotcha:** the Next.js `.gitignore` ignores `.env*`, which also excludes `.env.example`, the one file
that documents what the project needs. Add a negation so the example is committed and the real key is not:

```gitignore
.env*
!.env.example
```

## 4. Build the email

React Email lets you write an email as a React component instead of hand-writing nested HTML tables. It
renders to the HTML that email clients actually understand.

Create `emails/billing-failure.tsx`. **Abridged here**; the complete file is [`emails/billing-failure.tsx`](emails/billing-failure.tsx):

```tsx
import { Body, Container, Head, Heading, Html, Preview, Text } from '@react-email/components';

export default function BillingFailureEmail({ amountDue = '$49.00' }) {
  return (
    <Html lang="en">
      <Head />
      <Preview>Your {amountDue} payment did not go through. Nothing has been cancelled.</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={heading}>We could not process your payment</Heading>
          <Text style={paragraph}>...</Text>
        </Container>
      </Body>
    </Html>
  );
}

```

<details>
<summary>The style objects used above</summary>

```tsx
const body = {
  backgroundColor: '#f4f4f5',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
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

const heading = { color: '#18181b', fontSize: '22px', fontWeight: 600, lineHeight: '30px', margin: '0 0 24px' };
const paragraph = { color: '#3f3f46', fontSize: '15px', lineHeight: '24px', margin: '0 0 16px' };
```

The complete file, including the call-to-action and footer styles, is in this repo.
</details>

Three things worth knowing:

**Styles are inline objects, not a stylesheet.** Email clients strip `<style>` blocks unpredictably, so
everything is an inline style. This is not React Email being awkward, it is email being email.

**Web font support varies by client.** React Email ships a `<Font>` component and some clients honour it,
but plenty do not, so pick a system font stack as the fallback and assume that is what most people will see.

**`<Preview>` is the grey line next to the subject** in most inboxes. Leave it out and the client shows the
first words of your body instead, which is rarely what you want.

## 5. Look at it before you send it

```bash
npm run email
```

Open [localhost:3001](http://localhost:3001) and pick `billing-failure`. It hot-reloads as you edit, and it
can show you the desktop and mobile renderings side by side.

**Do this before every send.** It is much faster than sending yourself twenty test emails, and your sending
reputation does not care how many of them were tests.

## 6. Build the page that triggers it

Replace `app/page.tsx`. This is deliberately plain: one input, one button, and it shows you whatever the API
says rather than a generic failure message.

```tsx
'use client';

import { useState } from 'react';

export default function Home() {
  const [to, setTo] = useState('');
  const [status, setStatus] = useState('');

  async function send(event: React.FormEvent) {
    event.preventDefault();
    setStatus('Sending...');

    const response = await fetch('/api/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to }),
    });
    const payload = await response.json();

    setStatus(
      response.ok
        ? `Sent. Message id ${payload.id}`
        : String(payload?.error?.message ?? payload?.error ?? 'Request failed.'),
    );
  }

  return (
    <main style={{ padding: 40, fontFamily: 'system-ui' }}>
      <h1>Send the billing failure email</h1>
      <form onSubmit={send}>
        <input
          type="email"
          required
          value={to}
          onChange={(event) => setTo(event.target.value)}
          placeholder="you@example.com"
        />
        <button type="submit">Send email</button>
      </form>
      <p>{status}</p>
    </main>
  );
}
```

**Show the API's own error rather than replacing it with your own.** When this goes wrong, the difference
between a 403 and a 422 is the whole answer, and a friendly "something went wrong" throws it away.

## 7. Send it

Create `app/api/send/route.ts`:

```ts
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import BillingFailureEmail from '@/emails/billing-failure';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const { to } = await request.json();
  const resend = new Resend(process.env.RESEND_API_KEY);

  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM!,
    to,
    subject: 'Your payment did not go through (invoice INV-2026-0814)',
    react: BillingFailureEmail({}),
  });

  // Pass Resend's own status code through. Flattening everything to 400 throws
  // away the difference between an auth problem, a bad payload and a rate limit.
  if (error) {
    const status = (error as { statusCode?: number }).statusCode ?? 502;
    return NextResponse.json({ error }, { status });
  }
  return NextResponse.json({ id: data?.id });
}
```

`runtime = 'nodejs'` matters as soon as you attach a file, because reading from disk is not available on the
Edge runtime.

**Keep the `id` that comes back.** It is how you find this exact message in the dashboard later, which is the
first thing you will want when a customer says they never received it.

## 8. Attach the invoice

A billing email that says "your invoice is attached" should attach the invoice. **The snippet below is a
patch, not the whole route**; the complete version is [`app/api/send/route.ts`](app/api/send/route.ts).

Create an `invoices/` folder and put a PDF in it named `INV-2026-0814.pdf`. Any PDF will do while you are
following along; this repo includes a generated one. **If the file is not there, `readFile` throws `ENOENT`
and the send never happens**, which is a confusing failure because nothing about it mentions email.

```ts
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const invoice = await readFile(path.join(process.cwd(), 'invoices', 'INV-2026-0814.pdf'));

await resend.emails.send({
  // ...
  attachments: [{ filename: 'INV-2026-0814.pdf', content: invoice }],
});
```

`content` takes a Buffer, or a base64 string, or you can pass a `path` and let Resend fetch it. A Buffer is
the simplest thing that works when the file is already local.

**The whole message, attachments included, must be under 40MB after Base64 encoding.** Base64 adds about a
third to the size of a file, so 40MB encoded works out at roughly 30MB of raw file, and less than that once
the rest of the message is counted. Not every file type is accepted. And **attachments do not work on the
batch endpoint at all**, so anything with an invoice goes through the single-send path. If a file is large,
link to it instead of attaching it.

## 9. Check it actually arrived

Run it:

```bash
npm run dev
```

Open [localhost:3000](http://localhost:3000), enter your address, send.

**Then open the Emails tab in the [Resend dashboard](https://resend.com/emails) and find the message.**

This step is not optional and it is the habit worth forming. **A 200 from the API means Resend accepted the
message, not that a mailbox accepted it.** The dashboard shows what happened next: delivered, bounced,
delayed, complained. If you only ever check the API response, you will eventually tell a customer their
email sent when it bounced an hour later.

---

## Taking it to production

The example above works. Here is what changes when it is real.

**Verify a domain.** Sending from `onboarding@resend.dev` is for testing. In production you send from your
own domain. Resend's verification sets up **SPF and DKIM**; **DMARC is optional and worth adding anyway**.

- **SPF** authorises which servers may send for the envelope domain. It is one signal among several, not
  the only thing standing between you and a spoofer.
- **DKIM** signs each message so a receiver can prove it was not altered in transit.
- **DMARC** ties those to the visible `From:` address through **alignment**, and tells receivers what to do
  when neither aligned mechanism passes.

**The word that matters is alignment, and it is where most explanations go wrong.** DMARC passes if *either*
aligned SPF *or* aligned DKIM passes. It only fails when both fail to produce an aligned pass. And SPF is
evaluated against the envelope sender, not the visible From: Resend provisions its own Return-Path subdomain,
so SPF can pass and align even though you never added an SPF record to the domain you see in From. Read the
`Authentication-Results` header on a delivered message rather than reasoning from your DNS zone.

**Separate transactional mail from marketing.** Use a different subdomain, for example `billing.yourdomain.com`
for this and `news.yourdomain.com` for campaigns. Separating them helps segment your sending reputation,
though it does not fully isolate one stream from the other, since receivers also weigh the parent domain.
**If a marketing send goes badly, you do not want it dragging your payment emails towards spam**, and a
billing failure email landing in spam costs you the payment.

**Respect the rate limit.** The documented default is **10 requests per second per team**, shared across every
API key on the team. **Do not hard-code that number.** Read the `ratelimit-limit`, `ratelimit-remaining` and
`ratelimit-reset` headers, and back off using `retry-after` on a 429. The number can change; the headers
describe whatever your limit currently is, so design around them instead.

**And note the interaction with attachments**, because it catches people: the batch endpoint is the usual
answer to volume, but **Resend does not support attachments on the batch endpoint**. An invoice email like
this one has to go through the single-send endpoint, so pace it with the headers rather than batching it.

**Send this one immediately.** A billing failure email is time-sensitive: the customer has a window to fix the
card before the subscription pauses. Do not queue it behind a campaign.

---

## Troubleshooting

| What you see | What it means | Fix |
|---|---|---|
| **403**, "You can only send testing emails to your own email address" | New account, no verified domain | Send to your signup address, or verify a domain at [resend.com/domains](https://resend.com/domains) |
| **403**, "The domain is not verified" | Domain added but DNS not propagated or records wrong | Check the records in the dashboard match your DNS exactly. Propagation can take a while |
| **401** | The request had no usable key. The documented causes are a missing key and a send-only key used on a non-sending endpoint | In this app it usually means the key never loaded: check `.env.local` exists, the key starts with `re_`, and you restarted the dev server after adding it |
| **422** | Validation failed | Usually a malformed `from`, a missing `to`, or no subject. The error body names the field |
| **429**, "Too many requests" | You went over your team's current rate limit, which is shared across all its API keys | Pace your sends from the `ratelimit-*` headers and wait the `retry-after` value before retrying. Send an `Idempotency-Key` so a retry cannot duplicate. Do not batch this particular email, since the batch endpoint does not take attachments |
| **500** from this app, "Missing RESEND_API_KEY" | `.env.local` not created, or the dev server was started before it existed | Create it, then restart `npm run dev`. Next.js reads env at startup |
| Email sends, never arrives | It was accepted, then something happened downstream | Look it up in the dashboard by message id before doing anything else. Resending blindly could deliver two if the first is merely delayed |
| Preview looks right, delivered email looks wrong | The client stripped your CSS | Keep styles inline and simple. Test in more than one client |
| `npm run email` stops on a prompt | `@react-email/ui` is not installed | `npm install --save-dev @react-email/ui` |

---

## Notes on the email itself

The template is deliberately plain, and that is a design decision rather than laziness.

**One action.** Update the payment method. No cross-sell, no newsletter, no "explore our features". Anything
that competes with the one thing you need them to do makes it less likely they do it.

**Say what happens next, with dates.** "We will retry on Thursday, the subscription pauses on the 8th" turns
an alarming email into a manageable one, and it prevents a support ticket asking exactly that.

**Lead with reassurance.** "Your account is still active" is the first thing a customer wants to know. Getting
it into the preview text means they know it before they even open the email.

**Explain the likely cause.** Common possible reasons include an expired card, a changed billing address, or
a bank flagging a recurring charge. Naming them as possibilities removes the assumption that something is
wrong with your service. Do not assert a specific cause the system has not actually confirmed.

**Attach the invoice.** They may need it for accounting, and asking them to log in to find it is one more
step between you and the payment.

**Make the reply go somewhere.** A no-reply address on a billing email is a way of telling someone with a
payment problem that you do not want to hear from them.

In this project that is `RESEND_REPLY_TO`, and it is optional, which is a trap worth naming. Leave it unset
and it falls back to `RESEND_FROM`, which while you are still testing is `onboarding@resend.dev`, an address
nobody reads. The email tells the customer that a person will read their reply, so set `RESEND_REPLY_TO` to a
mailbox someone actually monitors before this goes near a real customer. The footer address and the reply
address come from the same variable on purpose, so the two cannot drift apart.
