import { registerAs } from '@nestjs/config';

export const sslConfig = registerAs('sslcomerz', () => ({
  store_id: process.env.SSLCOMERZ_STORE_ID,
  store_password: process.env.SSLCOMERZ_STORE_PASSWORD,
  store_type: process.env.SSLCOMERZ_STORE_TYPE,
  is_live: process.env.SSLCOMERZ_IS_LIVE === 'true', // Convert string to boolean
  success_url: process.env.SSLCOMERZ_SUCCESS_URL,
  failure_url: process.env.SSLCOMERZ_FAILURE_URL,
  cancel_url: process.env.SSLCOMERZ_CANCEL_URL,
  ipn_url: process.env.SSLCOMERZ_IPN_URL,
}));
