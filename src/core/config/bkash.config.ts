import { registerAs } from '@nestjs/config';

export const bkashConfig = registerAs('bkash', () => ({
  success_url: process.env.BKASH_SUCCESS_URL,
  failure_url: process.env.BKASH_FAILURE_URL,
  cancel_url: process.env.BKASH_CANCEL_URL,
  base_url: process.env.BKASH_BASE_URL,
  username: process.env.BKASH_USERNAME,
  password: process.env.BKASH_PASSWORD,
  app_key: process.env.BKASH_APP_KEY,
  app_secret: process.env.BKASH_APP_SECRET,
  callback_url: process.env.BKASH_CALLBACK_URL,
  refund_callback_url: process.env.BKASH_REFUND_CALLBACK_URL,
}));
