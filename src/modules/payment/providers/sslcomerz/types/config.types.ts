export type SslcommerzConfig = {
  store_id: string;
  store_password: string;
  store_type: string;
  is_live: boolean;
  success_url?: string;
  failure_url?: string;
  cancel_url?: string;
  ipn_url?: string;
};
