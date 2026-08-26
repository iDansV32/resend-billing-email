# Stumble log

Points where the setup left me guessing while building this. Kept as I went rather than reconstructed
afterwards, which is the only way this stays honest.

**Not part of the tutorial.** This is the raw list, and it is the answer to "what would you change so the next
person does not have to ask."

---

## 1. The preview server stops on an interactive prompt

`npm run email` does not start. It asks:

> To run the preview server, the package "@react-email/ui" must be installed. Would you like to install it?

**Why it matters.** It is a dead stop for a first-time user who does not know whether saying yes is safe, and
it breaks entirely in any non-interactive context: CI, a container, a script, or an agent running the setup.

**What I would change.** Either make it a stated peer dependency so npm surfaces it at install time, or have
the quickstart include it in the install line. One extra package name in the docs removes the prompt.

**Where it goes in the tutorial.** Prerequisites, as part of the install command, so nobody meets it.

---

## 2. `.env*` in the Next.js gitignore also excludes `.env.example`

`create-next-app` writes `.env*`, which is correct for secrets and wrong for the example file that documents
which variables the project needs. The result is that the one file a new contributor needs is silently not
committed.

**Not Resend's issue**, it comes from the Next.js template. But it lands on anyone following a Resend
quickstart that says "add your key to `.env.local`", because the natural next step is to commit an example and
it quietly does not happen.

**What I would change.** Mention the `!.env.example` negation in the quickstart, one line.

---

## 3. Turbopack picks a lockfile from outside the project

The build warns:

> Next.js ignored package-lock.json in /Users/... because it is outside the current Git repository

It walks up the filesystem looking for a lockfile and can settle on an unrelated one. Harmless here, but it
makes the first build noisy, and a warning on a first run makes people think they did something wrong.

**Fix:** pin `turbopack.root` in `next.config.ts`. Again a Next.js thing rather than a Resend thing, but it is
in the path of anyone starting from `create-next-app`.

---

## 4. The sending restriction is discovered as an error, not as a fact

New accounts can only send to the signup address until a domain is verified. This is sensible anti-abuse
behaviour. **The problem is where you learn it.**

Working from the quickstart, the natural first action is to send to a real address, and you find out via a
403. The message is clear once you read it, but by then you are debugging rather than following a tutorial,
and you do not yet know whether you broke something.

**What I would change.** State it in the quickstart prerequisites, before the first code block, with both
paths spelled out: verify a domain, or send to yourself from `onboarding@resend.dev`. It costs two sentences
and removes the most common first failure.

**This is the one I would actually prioritise.** It is the first thing every new user hits, it looks like an
error rather than a rule, and it is entirely preventable with documentation.

---

## 5. Attachment `content` accepts several shapes and the difference is not obvious

A Buffer, a base64 string, or a remote `path` are all valid. Which one you want depends on where the file
lives, and getting it wrong produces an unhelpful failure rather than a validation error naming the field.

**What I would change.** A three-row table in the attachments doc: file is local, file is remote, file is
generated in memory, with the right shape for each.

---

## 6. Nothing tells you the 200 is not the end

The API returns a message id on success, and it is easy to read that as delivered. It is not: it means
accepted. Delivery, bounces and complaints appear afterwards in the dashboard.

**Nowhere in the send flow does the documentation point at the Emails tab**, so a developer can finish the
quickstart with the wrong mental model and only discover it during their first incident.

**What I would change.** One line at the end of the quickstart: here is the id, here is where you look up what
happened to it. It is a small addition that changes how someone debugs their first bounce.

---

## 7. Verifying a domain reads as "deliverability, done". It is not

Set up `send.jointhereef.com`, verified it, sent the first message to a Gmail address. **SPF pass, DKIM pass,
DMARC pass. Gmail put it in Junk anyway.**

The authentication was not the problem and there was nothing left to fix in DNS. What actually caused it was
reputation and content: a brand-new sending domain with no history, carrying a payment-failure email whose
call-to-action pointed at a different domain than the sender. Textbook phishing shape, correctly signed.

**Why this matters for the docs.** The domain setup flow ends at a green "verified" badge, and the natural
reading is that deliverability is now handled. **A new sender's first real surprise is landing in spam with
every check passing**, and at that point they have nothing left to check and no idea what to do next.

**What I would change.** One paragraph at the end of domain verification: authentication is necessary and not
sufficient, a new domain has no reputation yet, start with low volume to engaged recipients, and make sure
links in the message point at the sending domain. Three sentences would prevent a whole class of ticket.

**Verified by fixing it:** repointing the CTA and the support address from `example.com` to the sending domain
was the single change that mattered.
