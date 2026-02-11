type InitDataRequest = {
  total_amount: number;
  currency: string;
  cus_phone: string;
  cus_name?: string;
  cus_email?: string;
  cus_add1?: string;
};

export interface PaymentStrategy {
  checkout(amount: number): Promise<string>;
  init(data: InitDataRequest): Promise<{ url: string; tran_id: string }>;
  validate(data: unknown): unknown;
  handleCallback(
    data: unknown,
    paymentService: unknown,
  ): Promise<{ url: string; tran_id: string }>;
}
