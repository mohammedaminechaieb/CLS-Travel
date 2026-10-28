export const NOTIFICATION_TYPES = {
  bookingCreated: 'BOOKING_CREATED',
  bookingConfirmed: 'BOOKING_CONFIRMED',
  bookingCancelled: 'BOOKING_CANCELLED',
  bookingCompleted: 'BOOKING_COMPLETED',
  bookingAssigned: 'BOOKING_ASSIGNED',
  newBooking: 'NEW_BOOKING', // staff
  paymentReceived: 'PAYMENT_RECEIVED',
  paymentFailed: 'PAYMENT_FAILED',
  newMessage: 'NEW_MESSAGE',
} as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];
