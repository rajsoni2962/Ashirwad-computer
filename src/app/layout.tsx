import type { Metadata, Viewport } from 'next';
import './globals.css';
import AppLayout from '@/components/layout/AppLayout';

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: 'Apna Vyaapar — Billing & Inventory Management',
  description: 'Enterprise billing, GST tax invoicing, inventory control, and purchase management synced across Android & Web.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Apna Vyaapar',
  },
  icons: {
    icon: '/brand/logo.png',
    apple: '/brand/logo.png',
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
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="h-full bg-slate-50 text-slate-900 antialiased font-sans selection:bg-slate-900 selection:text-white">
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
