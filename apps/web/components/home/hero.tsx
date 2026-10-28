import type { Destination } from '@cls/shared';
import { getTranslations } from 'next-intl/server';
import { SmartImage } from '@/components/smart-image';
import { SearchBar } from './search-bar';

const HERO_IMAGE = 'https://images.unsplash.com/photo-1590059390047-f5e617690a0b?auto=format&fit=crop&w=2000&q=80';

export async function Hero({ destinations }: { destinations: Destination[] }) {
  const t = await getTranslations('home');
  return (
    <section className="relative isolate overflow-hidden bg-primary" aria-labelledby="hero-title">
      <SmartImage src={HERO_IMAGE} alt="" fill priority sizes="100vw" className="-z-10 object-cover" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#0F2236]/80 via-[#0F2236]/60 to-[#0F2236]/85" aria-hidden />
      <div className="container-content flex min-h-[78vh] flex-col justify-center gap-8 py-20">
        <div className="max-w-3xl animate-fade-in">
          <p className="mb-4 inline-block rounded-full border border-accent/60 bg-black/20 px-4 py-1 text-sm font-semibold uppercase tracking-widest text-accent">
            {t('heroEyebrow')}
          </p>
          <h1 id="hero-title" className="text-4xl font-bold leading-tight text-white md:text-6xl">
            {t('heroTitle')}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/90 md:text-xl">{t('heroSubtitle')}</p>
        </div>
        <div className="max-w-5xl">
          <SearchBar destinations={destinations} />
        </div>
      </div>
    </section>
  );
}
