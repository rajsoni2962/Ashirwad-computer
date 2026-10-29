import type { Metadata, Viewport } from 'next';
import './globals.css';
import AppLayout from '@/components/layout/AppLayout';

export const viewport: Viewport = {
  themeColor: '#0B132B',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://ashirwad-computer.vercel.app'),
  title: {
    default: 'Ashirwad Technologies | Laptop & PC Repair, Refurbished Laptops & Custom Builds Ahmedabad',
    template: '%s | Ashirwad Technologies',
  },
  description:
    'Ahmedabad’s premier computer hardware and repair specialists. Chip-level motherboard repair, SSD/RAM upgrades, custom PC builds, certified refurbished laptops with 6-month warranty, and rapid doorstep tech support in New Ranip, Ahmedabad.',
  keywords: [
    'Ashirwad Technologies',
    'laptop repair Ahmedabad',
    'computer repair New Ranip',
    'motherboard repair Ahmedabad',
    'chip level laptop repair',
    'refurbished laptops Ahmedabad',
    'custom PC build Ahmedabad',
    'SSD RAM upgrade Ahmedabad',
    'gaming PC builder Ahmedabad',
    'Dell HP Lenovo repair Ahmedabad',
    'laptop service center New Ranip',
  ],
  authors: [{ name: 'Ashirwad Technologies' }],
  creator: 'Ashirwad Technologies',
  publisher: 'Ashirwad Technologies',
  formatDetection: {
    telephone: true,
    address: true,
    email: true,
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Ashirwad Technologies — Beyond Tech Limits...',
    description:
      'Precision Laptop & PC Repair, Chip-Level Motherboard Diagnostics, Custom Gaming & Workstation Builds, and Certified Refurbished Laptops with 6-Month Warranty in Ahmedabad.',
    url: 'https://ashirwad-computer.vercel.app',
    siteName: 'Ashirwad Technologies',
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: '/brand/logo.png',
        width: 800,
        height: 800,
        alt: 'Ashirwad Technologies Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ashirwad Technologies — Beyond Tech Limits...',
    description:
      'Precision Laptop & PC Repair, Motherboard Micro-Soldering, Custom PC Builds & Certified Refurbished Laptops in Ahmedabad.',
    images: ['/brand/logo.png'],
  },
  icons: {
    icon: [
      { url: '/brand/logo.png', type: 'image/png' },
      { url: '/favicon.ico' },
    ],
    apple: '/brand/logo.png',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

const localBusinessSchema = {
  '@context': 'https://schema.org',
  '@type': 'ComputerStore',
  name: 'Ashirwad Technologies',
  image: 'https://ashirwad-computer.vercel.app/brand/logo.png',
  '@id': 'https://ashirwad-computer.vercel.app/#store',
  url: 'https://ashirwad-computer.vercel.app',
  telephone: '+919662278994',
  priceRange: '₹₹',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Ashraya 10, GST compound, New Ranip',
    addressLocality: 'Ahmedabad',
    addressRegion: 'Gujarat',
    postalCode: '382470',
    addressCountry: 'IN',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 23.0825,
    longitude: 72.5714,
  },
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      opens: '10:00',
      closes: '20:30',
    },
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Sunday'],
      opens: '11:00',
      closes: '18:00',
    },
  ],
  areaServed: [
    'New Ranip',
    'Ranip',
    'Chandkheda',
    'Sabarmati',
    'Motera',
    'Ghatlodiya',
    'Gota',
    'Chandlodiya',
    'SG Highway',
    'Naranpura',
    'Memnagar',
    'Ahmedabad',
  ],
  makesOffer: [
    {
      '@type': 'Offer',
      itemOffered: {
        '@type': 'Service',
        name: 'Laptop and PC Repair',
        description: 'Chip-level motherboard repair, screen replacement, hinge fixing, and power diagnostics.',
      },
    },
    {
      '@type': 'Offer',
      itemOffered: {
        '@type': 'Service',
        name: 'Custom PC Builds',
        description: 'High-performance gaming computers, content creation workstations, and office desktops.',
      },
    },
    {
      '@type': 'Offer',
      itemOffered: {
        '@type': 'Service',
        name: 'Refurbished Business Laptops',
        description: 'Certified Dell Latitude, HP EliteBook, and Lenovo ThinkPad laptops with 6 months hardware warranty.',
      },
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <head>
        <link rel="icon" href="/brand/logo.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
        />
      </head>
      <body className="h-full bg-slate-50 text-slate-900 antialiased font-sans selection:bg-blue-600 selection:text-white">
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
