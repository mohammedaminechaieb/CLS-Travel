import { BookingStatus } from '@prisma/client';
import { BOOKING_REFERENCE_REGEX } from '@cls/shared';
import { formatBookingReference } from './booking-reference';
import { canTransitionBooking } from './booking-status';

describe('booking reference', () => {
  it('formats CLS-YYYY-NNNNN', () => {
    expect(formatBookingReference(2026, 142)).toBe('CLS-2026-00142');
    expect(BOOKING_REFERENCE_REGEX.test(formatBookingReference(2026, 1))).toBe(true);
  });

  it('refuses overflow', () => {
    expect(() => formatBookingReference(2026, 100_000)).toThrow();
  });
});

describe('booking status machine', () => {
  it.each([
    [BookingStatus.pending, BookingStatus.confirmed, true],
    [BookingStatus.pending, BookingStatus.cancelled, true],
    [BookingStatus.confirmed, BookingStatus.completed, true],
    [BookingStatus.pending, BookingStatus.completed, false],
    [BookingStatus.cancelled, BookingStatus.confirmed, false],
    [BookingStatus.completed, BookingStatus.cancelled, false],
  ])('%s → %s = %s', (from, to, ok) => expect(canTransitionBooking(from, to)).toBe(ok));
});
