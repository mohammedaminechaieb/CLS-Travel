import type { Destination } from '@cls/shared';
import Link from 'next/link';
import { getFormatter, getLocale, getTranslations } from 'next-intl/server';
import { SmartImage } from '@/components/smart-image';
import { tr } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export async function DestinationsGrid({ destinations }: { destinations: Destination[] }) {
  const t = await getTranslations('home');
  const tc = await getTranslations('common');
  const locale = await getLocale();
  const format = await getFormatter();

  return (
    <ul className="grid auto-rows-[220px] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {destinations.map((d, i) => {
        const name = tr(d, 'name', locale);
        return (
          <li key={d.id} className={cn('group relative overflow-hidden rounded-lg', i === 0 && 'sm:col-span-2 sm:row-span-2')}>
            <SmartImage
              src={d.cover_url}
              alt={name}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" aria-hidden />
            <div className="absolute inset-x-0 bottom-0 p-5 text-white">
              <h3 className="font-serif text-2xl font-bold">
                <Link href={`/voyages?destination_id=${d.id}`} className="after:absolute after:inset-0">
                  {name}
                </Link>
              </h3>
              <p className="text-sm text-white/90">
                {d.country} · {t('destinationTrips', { count: d.package_count ?? 0 })}
                {d.price_from && (
                  <>
                    {' · '}
                    {tc('from')} {format.number(Number(d.price_from), { style: 'currency', currency: 'TND', minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </>
                )}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
