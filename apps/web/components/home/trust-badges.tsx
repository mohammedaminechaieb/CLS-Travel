import { BadgeCheck, Compass, Headset, ShieldCheck } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

export async function TrustBadges() {
  const t = await getTranslations('home');
  const items = [
    { icon: BadgeCheck, title: t('trustLicensed'), text: t('trustLicensedText') },
    { icon: ShieldCheck, title: t('trustPayment'), text: t('trustPaymentText') },
    { icon: Headset, title: t('trustSupport'), text: t('trustSupportText') },
    { icon: Compass, title: t('trustExperience'), text: t('trustExperienceText') },
  ];
  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {items.map(({ icon: Icon, title, text }) => (
        <li key={title} className="flex flex-col items-center gap-3 rounded-lg p-6 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-accent/15 text-accent">
            <Icon className="size-7" aria-hidden />
          </span>
          <h3 className="font-serif text-lg font-semibold">{title}</h3>
          <p className="text-sm text-text-muted">{text}</p>
        </li>
      ))}
    </ul>
  );
}
