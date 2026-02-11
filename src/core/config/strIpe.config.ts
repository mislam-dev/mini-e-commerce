import { registerAs } from '@nestjs/config';

export const stripeConfig = registerAs('stripe', () => ({
  success_url: process.env.STRIPE_SUCCESS_URL,
  failure_url: process.env.STRIPE_FAILURE_URL,
  cancel_url: process.env.STRIPE_CANCEL_URL,
  base_url: process.env.STRIPE_BASE_URL,
  secret_key: process.env.STRIPE_SECRET_KEY,
  stripe_currency: process.env.STRIPE_STRIPE_CURRENCY,
  webhook_secret: process.env.STRIPE_WEBHOOK_SECRET,
  publishable_key: process.env.STRIPE_PUBLISHABLE_KEY,
}));
