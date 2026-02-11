import { registerAs } from '@nestjs/config';

export const paymentFrontendConfig = registerAs('paymentFrontend', () => ({
  successUrl: process.env.PAYMENT_FRONTEND_SUCCESS_URL,
  failUrl: process.env.PAYMENT_FRONTEND_FAILURE_URL,
  cancelUrl: process.env.PAYMENT_FRONTEND_CANCEL_URL,
}));
