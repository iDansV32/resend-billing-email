# Setup notes: friction encountered, and what I would change

Kept while building rather than reconstructed afterwards. These are the points where I had to guess, and what
I would change so the next person does not have to.

**On confidence.** Each item says how sure I am. Where I have a hypothesis rather than a finding, it says so.
A support note that overstates its own certainty is worse than one that admits what it does not know, and
several of these are observations from a single environment rather than controlled results.

**Two of these are Next.js or React Email rather than Resend.** They are included because they sit in the path
of anyone starting from `create-next-app` and following a Resend quickstart, but they are marked as such.

---

# Resend

## 1. The sending restriction is discovered as an error, not stated as a rule

**Confidence: high.** Reproduced directly.

New accounts can only send to the signup address until a domain is verified. This is sensible anti-abuse
behaviour. The friction is where you learn it: following the quickstart, the natural first action is to send
to a real address, and you find out through a 403. The message is clear once you read it, but by then you are
debugging rather than following a tutorial, and you do not yet know whether you broke something.

**Suggested change.** State it in the quickstart prerequisites, before the first code block, with both paths
spelled out: verify a domain, or send to yourself from `onboarding@resend.dev`. Two sentences.

**Priority: highest of these.** It is early in the funnel, it looks like a failure rather than a rule, and it
is entirely preventable with documentation.

## 2. Nothing in the send flow signals that a 200 is not the end

**Confidence: high** on the observation, **medium** on how much confusion it causes in practice.

The API returns a message id on success and it is easy to read that as delivered. It means accepted. Delivery,
bounces and complaints appear afterwards in the dashboard, and I did not find a pointer to the Emails tab
anywhere in the send flow.

**Suggested change.** One line at the end of the quickstart: here is the id, here is where you look up what
happened to it. Small addition, and it changes how someone debugs their first bounce.

## 3. Attachment `content` accepts several shapes and the difference is not obvious

**Confidence: medium.** Based on reading the reference rather than on hitting a failure.

A Buffer, a base64 string, or a remote `path` are all valid, and which one you want depends on where the file
lives.

**Suggested change.** A three-row table: file is local, file is remote, file is generated in memory, with the
right shape for each.

## 4. Verifying a domain reads as "deliverability, handled". It is not

**Confidence: high** on what happened. **Low to medium** on the cause, and the original version of this note
overstated it.

**What I observed.** Set up `send.jointhereef.com`, verified it, sent the first message to a Gmail address.
**SPF pass, DKIM pass, DMARC pass, disposition none. Gmail filed it in Junk anyway.** I then changed the
call-to-action and support address from `example.com` to the sending domain and re-sent. The next message
landed in the inbox.

**What I can and cannot conclude.** That is consistent with link-domain mismatch contributing, and Resend's own
deliverability guidance lists mismatched URLs as something filters weigh. **It does not establish cause.** It
was one send before and one after, with no control for domain age, recipient engagement, message reputation,
or the fact that both were test sends to my own address. A real diagnosis would need volume, a holdout, and
more than one recipient domain.

**Why it is worth writing down regardless.** The domain flow ends on a green verified badge, and the natural
reading is that deliverability is now handled. **A new sender's first real surprise is landing in spam with
every authentication check passing**, and at that point they have nothing left to check.

**Suggested change.** A paragraph at the end of domain verification: authentication is necessary and not
sufficient, a new domain has no reputation yet, start small with engaged recipients, and keep links on the
sending domain.

---

# Next.js and React Email, encountered on the way

## 5. The React Email preview server stops on an interactive prompt

**Confidence: high.** Reproduced.

`npm run email` does not start. It asks whether to install `@react-email/ui`. That is a dead stop for a
first-time user who does not know whether saying yes is safe, and it fails outright in any non-interactive
context: CI, a container, or a script.

**Suggested change.** Make it a stated peer dependency, or include it in the documented install line.

## 6. `.env*` in the Next.js gitignore also excludes `.env.example`

**Confidence: high.** Reproduced.

`create-next-app` writes `.env*`, which is right for secrets and wrong for the example file documenting what
the project needs. The one file a new contributor needs is silently not committed. A `!.env.example` negation
fixes it.

**Not a Resend issue**, but it lands on anyone following a Resend quickstart that says "add your key to
`.env.local`".

## 7. Turbopack can pick a lockfile from outside the project

**Confidence: high.** Reproduced.

The first build warns that Next.js ignored a `package-lock.json` outside the project. Harmless, but a warning
on a first run makes people think they broke something. Pinning `turbopack.root` in `next.config.ts` clears it.

---

# One I got wrong myself

Worth recording, since the point of this file is what actually happened.

**I wrote that the default rate limit is 2 requests per second.** The documented default is **10 per second
per team**. I had taken the number from an error string rather than from the reference, and did not check it.
The right guidance is not a number at all: read `ratelimit-limit`, `ratelimit-remaining` and `ratelimit-reset`,
and honour `retry-after`. Limits change, headers do not.

**I also recommended the batch endpoint for volume in a tutorial built around an attachment**, without noticing
that **Resend does not support attachments on the batch endpoint.** Two sections written separately, each
sensible alone, contradicting each other on the page.
