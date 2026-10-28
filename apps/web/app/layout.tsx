import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://carthagoloisirs.com'),
  title: { default: 'CLS Travel — Agence de voyage en Tunisie', template: '%s | CLS Travel' },
  description:
    'CLS Travel (Carthago Loisirs) : circuits, séjours, excursions, Omra et voyages d’affaires au départ de la Tunisie.',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#1C3A5E' },
    { media: '(prefers-color-scheme: dark)', color: '#121417' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" dir="ltr" className={`${inter.variable} ${playfair.variable}`}>
      <body>{children}</body>
    </html>
  );
}
