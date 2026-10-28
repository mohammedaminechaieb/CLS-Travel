import type { Prisma } from '@prisma/client';

export function formatBookingReference(year: number, sequence: number): string {
  if (sequence > 99_999) throw new Error('Booking sequence overflow for year ' + year);
  return `CLS-${year}-${String(sequence).padStart(5, '0')}`;
}

/**
 * Incrément atomique du compteur annuel (INSERT … ON CONFLICT DO UPDATE … RETURNING) :
 * sûr en concurrence, sans trou lié à des lectures concurrentes.
 */
export async function nextBookingReference(tx: Prisma.TransactionClient, now = new Date()): Promise<string> {
  const year = now.getUTCFullYear();
  const [row] = await tx.$queryRaw<{ last_value: number }[]>`
    INSERT INTO booking_sequences (year, last_value) VALUES (${year}, 1)
    ON CONFLICT (year) DO UPDATE SET last_value = booking_sequences.last_value + 1
    RETURNING last_value`;
  return formatBookingReference(year, row.last_value);
}
