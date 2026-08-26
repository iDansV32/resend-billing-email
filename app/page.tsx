'use client';

import { useState } from 'react';

type Result =
  | { kind: 'idle' }
  | { kind: 'sending' }
  | { kind: 'sent'; id: string }
  | { kind: 'failed'; message: string };

export default function Home() {
  const [to, setTo] = useState('');
  const [result, setResult] = useState<Result>({ kind: 'idle' });

  async function send(event: React.FormEvent) {
    event.preventDefault();
    setResult({ kind: 'sending' });

    const response = await fetch('/api/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to }),
    });
    const payload = await response.json();

    if (!response.ok) {
      // Surface whatever the API said. Guessing at the cause here is how you
      // end up telling someone "something went wrong".
      const message =
        payload?.error?.message ?? payload?.error ?? 'Request failed.';
      setResult({ kind: 'failed', message: String(message) });
      return;
    }

    setResult({ kind: 'sent', id: payload.id });
  }

  return (
    <main style={styles.main}>
      <div style={styles.card}>
        <h1 style={styles.heading}>Send the billing failure email</h1>
        <p style={styles.subheading}>
          Sends the React Email template with the invoice attached, through
          Resend.
        </p>

        <form onSubmit={send} style={styles.form}>
          <label htmlFor="to" style={styles.label}>
            Send to
          </label>
          <input
            id="to"
            type="email"
            required
            value={to}
            onChange={(event) => setTo(event.target.value)}
            placeholder="you@example.com"
            style={styles.input}
          />
          <button
            type="submit"
            disabled={result.kind === 'sending'}
            style={styles.button}
          >
            {result.kind === 'sending' ? 'Sending...' : 'Send email'}
          </button>
        </form>

        {result.kind === 'sent' && (
          <p style={styles.ok}>
            Sent. Message id <code>{result.id}</code>. Check the Emails tab in
            the Resend dashboard for the delivery events.
          </p>
        )}

        {result.kind === 'failed' && (
          <p style={styles.error}>{result.message}</p>
        )}
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    alignItems: 'center',
    background: '#f4f4f5',
    display: 'flex',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '24px',
  },
  card: {
    background: '#ffffff',
    border: '1px solid #e4e4e7',
    borderRadius: 8,
    maxWidth: 440,
    padding: 32,
    width: '100%',
  },
  heading: { color: '#18181b', fontSize: 20, margin: '0 0 8px' },
  subheading: { color: '#71717a', fontSize: 14, lineHeight: '21px', margin: '0 0 24px' },
  form: { display: 'flex', flexDirection: 'column', gap: 8 },
  label: { color: '#3f3f46', fontSize: 13, fontWeight: 600 },
  input: {
    border: '1px solid #d4d4d8',
    borderRadius: 6,
    fontSize: 15,
    padding: '10px 12px',
  },
  button: {
    background: '#18181b',
    border: 'none',
    borderRadius: 6,
    color: '#ffffff',
    cursor: 'pointer',
    fontSize: 15,
    fontWeight: 600,
    marginTop: 8,
    padding: '11px 16px',
  },
  ok: { color: '#166534', fontSize: 13, lineHeight: '20px', marginTop: 20 },
  error: { color: '#b91c1c', fontSize: 13, lineHeight: '20px', marginTop: 20 },
};
