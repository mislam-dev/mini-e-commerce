export interface BkashOptions {
  baseUrl: string;
  username: string;
  password: string;
  appKey: string;
  appSecret: string;
  callbackUrl: string;
  refundCallbackUrl?: string;
}

export interface BkashGrantTokenResponse {
  statusCode: string;
  statusMessage: string;
  id_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
}

export interface BkashCreatePaymentRequest {
  mode: string;
  payerReference: string;
  callbackURL: string;
  amount: string;
  currency: string;
  intent: string;
  merchantInvoiceNumber: string;
}

export interface BkashCreatePaymentResponse {
  statusCode: string;
  statusMessage: string;
  paymentID: string;
  bkashURL: string;
  callbackURL: string;
  successCallbackURL: string;
  failureCallbackURL: string;
  cancelledCallbackURL: string;
  amount: string;
  intent: string;
  currency: string;
  paymentCreateTime: string;
  transactionStatus: string;
  merchantInvoiceNumber: string;
}

export interface BkashExecutePaymentResponse {
  statusCode: string;
  statusMessage: string;
  paymentID: string;
  payerReference: string;
  customerMsisdn: string;
  trxID: string;
  amount: string;
  merchantInvoiceNumber: string;
  intent: string;
  currency: string;
  transactionStatus: string;
  paymentExecuteTime: string;
}

export interface BkashQueryPaymentResponse {
  statusCode: string;
  statusMessage: string;
  paymentID: string;
  mode: string;
  paymentCreateTime: string;
  paymentExecuteTime: string;
  amount: string;
  currency: string;
  intent: string;
  merchantInvoiceNumber: string;
  trxID: string;
  transactionStatus: string; // "Initiated", "Completed", etc.
  verificationStatus: string;
}

export interface BkashRefundPaymentRequest {
  paymentID: string;
  amount: string;
  trxID: string;
  sku: string;
  reason: string;
}

export interface BkashRefundPaymentResponse {
  statusCode: string;
  statusMessage: string;
  originalTrxID: string;
  refundTrxID: string;
  transactionStatus: string;
  amount: string;
  currency: string;
  charge: string;
  completedTime: string;
}
