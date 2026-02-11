export type InitData = {
  total_amount: number;
  currency: string;
  tran_id: string; // use unique tran_id for each api call
  success_url?: string;
  fail_url?: string;
  cancel_url?: string;
  ipn_url?: string;
  shipping_method?: string;
  product_name?: string;
  product_category?: string;
  product_profile?: string;
  cus_name?: string;
  cus_email?: string;
  cus_add1?: string;
  cus_add2?: string;
  cus_city?: string;
  cus_state?: string;
  cus_postcode?: string;
  cus_country?: string;
  cus_phone?: string;
  cus_fax?: string;
  ship_name?: string;
  ship_add1?: string;
  ship_add2?: string;
  ship_city?: string;
  ship_state?: string;
  ship_postcode?: string | number;
  ship_country?: string;
};

export type InitDataRequest = {
  total_amount: number;
  amount: number;
  currency: string;
  cus_phone: string;
  cus_name?: string;
  cus_email?: string;
  cus_add1?: string;
};
