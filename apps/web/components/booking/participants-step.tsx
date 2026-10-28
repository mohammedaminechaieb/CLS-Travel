'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { Participant } from '@cls/shared';
import { Plus, Trash2 } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

export interface ParticipantsValue {
  departure_date: string;
  participants: Participant[];
}

const MAX = 20;
const DAY = 86_400_000;

export function ParticipantsStep({
  initial,
  durationDays,
  onNext,
}: {
  initial: ParticipantsValue;
  durationDays: number;
  onNext: (value: ParticipantsValue) => void;
}) {
  const t = useTranslations('booking');
  const ta = useTranslations('auth');
  const format = useFormatter();
  const tomorrow = new Date(Date.now() + DAY).toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);

  const schema = z.object({
    departure_date: z.string().refine((v) => v >= tomorrow, t('errors.date')),
    participants: z
      .array(
        z.object({
          nom: z.string().trim().min(1, ta('errors.required')).max(80),
          prenom: z.string().trim().min(1, ta('errors.required')).max(80),
          passport: z
            .string()
            .trim()
            .toUpperCase()
            .regex(/^[A-Z0-9]{6,12}$/, t('errors.passport')),
          dob: z.string().refine((v) => /^\d{4}-\d{2}-\d{2}$/.test(v) && v < today && v > '1900-01-01', t('errors.dob')),
        }),
      )
      .min(1)
      .max(MAX),
  });

  const { register, control, handleSubmit, watch, formState } = useForm<ParticipantsValue>({
    resolver: zodResolver(schema),
    defaultValues: initial,
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'participants' });
  const departure = watch('departure_date');
  const returnDate = departure ? new Date(new Date(departure).getTime() + (durationDays - 1) * DAY) : null;
  const e = formState.errors;

  return (
    <form onSubmit={handleSubmit(onNext)} noValidate className="flex flex-col gap-8">
      <section className="rounded-lg border border-border bg-surface p-6">
        <Field id="departure_date" label={t('departure')} error={e.departure_date?.message} required className="max-w-xs">
          <Input type="date" min={tomorrow} {...register('departure_date')} />
        </Field>
        {returnDate && !Number.isNaN(returnDate.getTime()) && (
          <p className="mt-2 text-sm text-text-muted">{t('returnDate', { date: format.dateTime(returnDate, { dateStyle: 'full' }) })}</p>
        )}
      </section>

      <section aria-labelledby="participants-title" className="flex flex-col gap-4">
        <div>
          <h2 id="participants-title" className="text-2xl font-bold">{t('participantsTitle')}</h2>
          <p className="text-sm text-text-muted">{t('participantsHint')}</p>
        </div>
        {fields.map((field, i) => {
          const pe = e.participants?.[i];
          return (
            <fieldset key={field.id} className="rounded-lg border border-border bg-surface p-6">
              <div className="mb-4 flex items-center justify-between">
                <legend className="font-serif text-lg font-semibold">{t('participant', { index: i + 1 })}</legend>
                {fields.length > 1 && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => remove(i)} aria-label={t('removeTraveler', { index: i + 1 })}>
                    <Trash2 className="text-danger" />
                  </Button>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id={`p${i}-nom`} label={t('lastName')} error={pe?.nom?.message} required>
                  <Input autoComplete={i === 0 ? 'family-name' : 'off'} {...register(`participants.${i}.nom`)} />
                </Field>
                <Field id={`p${i}-prenom`} label={t('firstName')} error={pe?.prenom?.message} required>
                  <Input autoComplete={i === 0 ? 'given-name' : 'off'} {...register(`participants.${i}.prenom`)} />
                </Field>
                <Field id={`p${i}-passport`} label={t('passport')} error={pe?.passport?.message} required>
                  <Input className="uppercase" dir="ltr" {...register(`participants.${i}.passport`)} />
                </Field>
                <Field id={`p${i}-dob`} label={t('dob')} error={pe?.dob?.message} required>
                  <Input type="date" max={today} {...register(`participants.${i}.dob`)} />
                </Field>
              </div>
            </fieldset>
          );
        })}
        <Button
          type="button"
          variant="outline"
          className="self-start"
          disabled={fields.length >= MAX}
          onClick={() => append({ nom: '', prenom: '', passport: '', dob: '' })}
        >
          <Plus aria-hidden /> {t('addTraveler')}
        </Button>
        {fields.length >= MAX && <p className="text-sm text-text-muted">{t('maxTravelers')}</p>}
      </section>

      <div className="flex justify-end">
        <Button type="submit" size="lg">{t('continue')}</Button>
      </div>
    </form>
  );
}
