import type { Metadata } from 'next';
import './globals.css';
import AppLayout from '@/components/layout/AppLayout';

export const metadata: Metadata = {
  title: 'ASHIRWAD TECH — Repair | Upgrade | Build | Service',
  description: 'Official Billing, Inventory, and Business Management System for ASHIRWAD TECH.',
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
      <body className="h-full bg-slate-50 text-slate-800 antialiased font-sans">
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
