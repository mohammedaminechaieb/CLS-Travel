import { getFormatter, getTranslations } from 'next-intl/server';

type Section = { title: string; body: string };

/** Page légale générée depuis le dictionnaire i18n (legal.<key>). */
export async function LegalPage({ docKey }: { docKey: 'cgv' | 'notice' | 'privacy' }) {
  const t = await getTranslations('legal');
  const format = await getFormatter();
  const sections = t.raw(`${docKey}.sections`) as Section[];
  return (
    <article className="container-content max-w-3xl py-10 md:py-14">
      <h1 className="text-3xl font-bold md:text-5xl">{t(`${docKey}.title`)}</h1>
      <p className="mt-2 text-sm text-text-muted">{t('updated', { date: format.dateTime(new Date('2026-10-01'), { dateStyle: 'long' }) })}</p>
      <p className="mt-6 text-lg">{t(`${docKey}.intro`)}</p>
      <nav aria-label={t('toc')} className="my-8 rounded-lg bg-muted/60 p-5">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-text-muted">{t('toc')}</h2>
        <ol className="flex flex-col gap-1 text-sm">
          {sections.map((s, i) => <li key={i}><a href={`#s${i}`} className="text-primary hover:underline">{s.title}</a></li>)}
        </ol>
      </nav>
      <div className="flex flex-col gap-8">
        {sections.map((s, i) => (
          <section key={i} id={`s${i}`} className="scroll-mt-24">
            <h2 className="mb-2 text-xl font-bold">{s.title}</h2>
            <p className="leading-relaxed text-text">{s.body}</p>
          </section>
        ))}
      </div>
    </article>
  );
}
