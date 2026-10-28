import { loadStripe, type Appearance, type Stripe } from '@stripe/stripe-js';
import { STRIPE_PUBLISHABLE_KEY } from './config';

let stripePromise: Promise<Stripe | null> | null = null;

/** Charge Stripe.js une seule fois (depuis js.stripe.com : exigence PCI-DSS). */
export function getStripe(): Promise<Stripe | null> | null {
  if (!STRIPE_PUBLISHABLE_KEY.startsWith('pk_')) return null;
  stripePromise ??= loadStripe(STRIPE_PUBLISHABLE_KEY);
  return stripePromise;
}

/** Stripe Elements aux couleurs CLS Travel. */
export const stripeAppearance: Appearance = {
  theme: 'stripe',
  variables: {
    colorPrimary: '#1C3A5E',
    colorText: '#1A1612',
    colorTextSecondary: '#5A5042',
    colorDanger: '#B42318',
    colorBackground: '#FFFFFF',
    fontFamily: 'Inter, system-ui, sans-serif',
    borderRadius: '8px',
  },
};
