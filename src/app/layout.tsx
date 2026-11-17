import type { Metadata } from 'next';
import './globals.css';
import AppLayout from '@/components/layout/AppLayout';

export const metadata: Metadata = {
  title: 'Apna Vyaapar — Billing & Inventory Management',
  description: 'Enterprise billing, GST tax invoicing, inventory control, and purchase management.',
  icons: {
    icon: '/brand/logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="icon" href="/brand/logo.png" />
      </head>
      <body className="h-full bg-slate-50 text-slate-900 antialiased font-sans selection:bg-slate-900 selection:text-white">
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
