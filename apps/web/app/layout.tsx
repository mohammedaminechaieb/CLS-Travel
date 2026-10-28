import type { Metadata, Viewport } from 'next';
import { Inter, Noto_Kufi_Arabic, Noto_Sans_Arabic, Playfair_Display } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getTranslations } from 'next-intl/server';
import { direction, type Locale } from '@/i18n/config';
import { SITE_URL } from '@/lib/config';
import { Providers } from '@/lib/providers';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair', display: 'swap' });
// Polices arabes : préchargées uniquement quand la page est en arabe (classe appliquée conditionnellement)
const notoArabic = Noto_Sans_Arabic({ subsets: ['arabic'], variable: '--font-arabic', display: 'swap', preload: false });
const kufiArabic = Noto_Kufi_Arabic({ subsets: ['arabic'], variable: '--font-arabic-display', display: 'swap', preload: false });

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta');
  const locale = await getLocale();
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: t('title'), template: '%s | CLS Travel' },
    description: t('description'),
    applicationName: 'CLS Travel',
    keywords: ['agence de voyage Tunisie', 'circuit Tunisie', 'Omra', 'Djerba', 'Sahara', 'voyage organisé', 'Carthago Loisirs'],
    alternates: { canonical: '/' },
    openGraph: {
      type: 'website',
      siteName: 'CLS Travel',
      locale: { fr: 'fr_TN', ar: 'ar_TN', en: 'en_GB' }[locale] ?? 'fr_TN',
      url: SITE_URL,
      title: t('title'),
      description: t('description'),
    },
    twitter: { card: 'summary_large_image', title: t('title'), description: t('description') },
    formatDetection: { telephone: false },
    robots: { index: true, follow: true, 'max-image-preview': 'large' },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#1C3A5E' },
    { media: '(prefers-color-scheme: dark)', color: '#121417' },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = (await getLocale()) as Locale;
  const fonts = [inter.variable, playfair.variable, locale === 'ar' && `${notoArabic.variable} ${kufiArabic.variable}`].filter(Boolean).join(' ');
  return (
    <html lang={locale} dir={direction(locale)} className={fonts}>
      <body className="flex min-h-screen flex-col">
        <NextIntlClientProvider>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
