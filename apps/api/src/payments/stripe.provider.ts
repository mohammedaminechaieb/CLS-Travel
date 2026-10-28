import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

export const STRIPE = Symbol('STRIPE');

export const stripeProvider = {
  provide: STRIPE,
  inject: [ConfigService],
  useFactory: (config: ConfigService): Stripe | null => {
    const key = config.get<string>('stripe.secretKey');
    if (!key || !key.startsWith('sk_')) return null; // paiements désactivés (dev sans clé)
    return new Stripe(key, { maxNetworkRetries: 2, appInfo: { name: 'CLS Travel' } });
  },
};
