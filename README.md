# Send a billing failure email with React Email and Resend

A complete, working example of the email you send when a customer's card is declined, built with Next.js,
[React Email](https://react.email) and [Resend](https://resend.com). Includes the invoice as an attachment.

This README takes you from an empty folder to a delivered email. Every code block is complete and can be
pasted as it is.

**What you end up with:** a page with one input, and an API route that renders a React email and sends it
with the invoice attached.

---

## Before you start

- **Node 20 or newer.** `node -v` to check.
- **A Resend account.** Free, and enough for everything here.
- **An API key**, from [resend.com/api-keys](https://resend.com/api-keys). Copy it when it is created,
  because it is only shown once.

### One thing that catches everybody

**Until you verify a domain, Resend only lets you send to the email address you signed up with.**

That is a deliberate anti-abuse measure, not a bug, and it is the single most common reason a first attempt
returns a 403. You have two options:

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

Create `emails/billing-failure.tsx`. The full component is in this repo; the parts that matter:

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

const body = { backgroundColor: '#f4f4f5', margin: 0, padding: '32px 0' };
```

Three things worth knowing:

**Styles are inline objects, not a stylesheet.** Email clients strip `<style>` blocks unpredictably, so
everything is an inline style. This is not React Email being awkward, it is email being email.

**Web fonts do not load.** Use a system font stack.

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

## 6. Send it

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

  if (error) return NextResponse.json({ error }, { status: 400 });
  return NextResponse.json({ id: data?.id });
}
```

`runtime = 'nodejs'` matters as soon as you attach a file, because reading from disk is not available on the
Edge runtime.

**Keep the `id` that comes back.** It is how you find this exact message in the dashboard later, which is the
first thing you will want when a customer says they never received it.

## 7. Attach the invoice

A billing email that says "your invoice is attached" should attach the invoice.

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

There is a size limit on the whole message, so generated PDFs are fine and video is not. If you are attaching
something large, link to it instead.

## 8. Check it actually arrived

Run it:

```bash
npm run dev
```

Open [localhost:3000](http://localhost:3000), enter your address, send.

**Then open the Emails tab in the [Resend dashboard](https://resend.com/emails) and find the message.**

This step is not optional and it is the habit worth forming. **A 200 from the API means Resend accepted the
message, not that a mailbox accepted it.** The dashboard shows what happened next: delivered, bounced,
deferred, complained. If you only ever check the API response, you will eventually tell a customer their
email sent when it bounced an hour later.

---

## Taking it to production

The example above works. Here is what changes when it is real.

**Verify a domain.** Sending from `onboarding@resend.dev` is for testing. In production you send from your
own domain, which means three DNS records:

- **SPF** lists who is allowed to send on your behalf. Without it, receivers cannot tell your mail from
  someone spoofing you.
- **DKIM** signs each message so the receiver can prove it was not altered in transit.
- **DMARC** tells receivers what to do when SPF or DKIM fail, and gets you reports about who is sending as
  you.

**Separate transactional mail from marketing.** Use a different subdomain, for example `billing.yourdomain.com`
for this and `news.yourdomain.com` for campaigns. Reputation is tracked per domain. **If a marketing send goes
badly, you do not want it taking your payment emails to spam with it**, and a billing failure email landing in
spam costs you the payment.

**Respect the rate limit.** The default is **2 requests per second**. If you are sending a batch, use the batch
endpoint or add backoff. A tight loop will start returning 429 and drop mail on the floor.

**Send this one immediately.** A billing failure email is time-sensitive: the customer has a window to fix the
card before the subscription pauses. Do not queue it behind a campaign.

---

## Troubleshooting

| What you see | What it means | Fix |
|---|---|---|
| **403**, "You can only send testing emails to your own email address" | New account, no verified domain | Send to your signup address, or verify a domain at [resend.com/domains](https://resend.com/domains) |
| **403**, "The domain is not verified" | Domain added but DNS not propagated or records wrong | Check the records in the dashboard match your DNS exactly. Propagation can take a while |
| **401** | Bad or missing API key | Check `.env.local` exists, the key starts with `re_`, and you restarted the dev server after adding it |
| **422** | Validation failed | Usually a malformed `from`, a missing `to`, or no subject. The error body names the field |
| **429**, "Too many requests" | You exceeded 2 requests per second | Batch, or add exponential backoff. Do not retry immediately in a loop |
| **500** from this app, "Missing RESEND_API_KEY" | `.env.local` not created, or the dev server was started before it existed | Create it, then restart `npm run dev`. Next.js reads env at startup |
| Email sends, never arrives | It was accepted, then something happened downstream | Look it up in the dashboard by message id. Do not resend blindly, you will just send two |
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

**Explain the likely cause.** Most declines are an expired card, a changed billing address, or a bank flagging
a recurring charge. Saying so removes the assumption that something is wrong with your service.

**Attach the invoice.** They may need it for accounting, and asking them to log in to find it is one more
step between you and the payment.

**Make the reply go somewhere.** A no-reply address on a billing email is a way of telling someone with a
payment problem that you do not want to hear from them.
