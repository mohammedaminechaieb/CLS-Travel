import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function SectionHeading({
  id,
  title,
  subtitle,
  href,
  linkLabel,
}: {
  id: string;
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <h2 id={id} className="text-3xl font-bold text-text md:text-4xl">
          {title}
        </h2>
        <span className="mt-3 block h-1 w-16 rounded-full bg-accent" aria-hidden />
        {subtitle && <p className="mt-3 text-text-muted">{subtitle}</p>}
      </div>
      {href && linkLabel && (
        <Link href={href} className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">
          {linkLabel} <ArrowRight className="size-4 rtl:rotate-180" aria-hidden />
        </Link>
      )}
    </div>
  );
}
