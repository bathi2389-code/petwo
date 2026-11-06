import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PETWO Central Admin',
  description: 'Super Admin and Operations Portal for PETWO Marketplace',
  icons: { icon: '/petwo-icon.svg' },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
