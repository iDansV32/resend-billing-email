import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Billing failure email',
  description:
    'A worked example of sending a billing failure email with React Email and Resend.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
