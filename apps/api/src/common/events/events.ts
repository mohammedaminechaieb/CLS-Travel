import type { BookingStatus, PaymentType } from '@prisma/client';

/** Événements de domaine émis via EventEmitter2 (consommés par les notifications). */
export const EVENTS = {
  bookingCreated: 'booking.created',
  bookingStatusChanged: 'booking.status_changed',
  bookingAgentAssigned: 'booking.agent_assigned',
  bookingMessage: 'booking.message',
  paymentSucceeded: 'payment.succeeded',
  paymentFailed: 'payment.failed',
} as const;

export interface BookingCreatedEvent {
  bookingId: string;
}

export interface BookingStatusChangedEvent {
  bookingId: string;
  from: BookingStatus;
  to: BookingStatus;
  actorId: string;
}

export interface BookingAgentAssignedEvent {
  bookingId: string;
  agentId: string | null;
}

export interface BookingMessageEvent {
  bookingId: string;
  messageId: string;
  senderId: string;
}

export interface PaymentEvent {
  bookingId: string;
  paymentId: string;
  amount: string;
  currency: string;
  type: PaymentType;
}
