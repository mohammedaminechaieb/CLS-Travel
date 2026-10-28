import { BookingStatus } from '@prisma/client';

/** pending → confirmed → completed ; pending/confirmed → cancelled. États finaux : cancelled, completed. */
export const BOOKING_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  pending: [BookingStatus.confirmed, BookingStatus.cancelled],
  confirmed: [BookingStatus.completed, BookingStatus.cancelled],
  cancelled: [],
  completed: [],
};

export function canTransitionBooking(from: BookingStatus, to: BookingStatus): boolean {
  return BOOKING_TRANSITIONS[from].includes(to);
}
