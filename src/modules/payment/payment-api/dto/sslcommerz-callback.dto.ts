export class SslcommerzCallbackDto {
  tran_id: string;
  val_id: string;
  amount: string;
  card_type: string;
  store_amount: string;
  card_no: string;
  bank_tran_id: string;
  status: 'VALID' | 'FAILED' | 'CANCELLED' | 'UNATTEMPTED';
  tran_date: string;
  error: string;
  currency: string;
  card_issuer: string;
  card_brand: string;
  card_sub_brand: string;
  card_issuer_country: string;
  card_issuer_country_code: string;
  store_id: string;
  verify_sign: string;
  verify_key: string;
  verify_sign_sha2: string;
  currency_type: string;
  currency_amount: string;
  currency_rate: string;
  base_fair: string;
  value_a: string; // Custom field 1
  value_b: string; // Custom field 2
  value_c: string; // Custom field 3
  value_d: string; // Custom field 4
  subscription_id: string;
  risk_level: string;
  risk_title: string;
}
