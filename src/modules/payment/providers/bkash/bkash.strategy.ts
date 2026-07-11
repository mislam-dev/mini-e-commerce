import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { customAlphabet } from 'nanoid';
import {
  InitDataRequest,
  PaymentStrategy,
} from '../../interfaces/payment-strategy/payment-strategy.interface';
import { PaymentStatus } from '../../payment-api/entities/payment-api.entity';
import { PaymentApiService } from '../../payment-api/payment-api.service';
import { BkashService } from './bkash.service';

@Injectable()
export class BkashStrategy implements PaymentStrategy {
  private readonly logger = new Logger(BkashStrategy.name);

  constructor(
    private readonly bkashService: BkashService,
    private readonly configService: ConfigService,
  ) {}

  private generateTranId(): string {
    const nanoid = customAlphabet('1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ', 15);
    return `ORDER_${nanoid()}`;
  }

  async init(data: InitDataRequest): Promise<{ url: string; tran_id: string }> {
    try {
      const tran_id = this.generateTranId();
      
      const paymentResponse = await this.bkashService.createPayment({
        payerReference: tran_id,
        amount: data.total_amount.toString(),
        currency: data.currency || 'BDT',
        intent: 'sale',
        merchantInvoiceNumber: tran_id,
      });

      return {
        url: paymentResponse.bkashURL,
        tran_id: paymentResponse.paymentID, // For bKash, paymentID is the crucial tracking reference
      };
    } catch (error) {
      this.logger.error(`Failed to init bKash payment: ${error.message}`);
      throw new InternalServerErrorException('Failed to initialize bKash payment');
    }
  }

  async checkout(amount: number): Promise<string> {
    // Delegate to init if a direct checkout call is made, though it typically requires full InitDataRequest
    throw new Error('Direct checkout not supported for bKash. Use init() instead.');
  }

  async validate(data: { paymentID: string }): Promise<boolean> {
    if (!data || !data.paymentID) {
      return false;
    }
    try {
      const response = await this.bkashService.queryPayment(data.paymentID);
      return response.transactionStatus === 'Completed';
    } catch (error) {
      return false;
    }
  }

  async handleCallback(
    data: { paymentID: string; status: string },
    paymentService: PaymentApiService,
  ): Promise<{ url: string; tran_id: string }> {
    const { paymentID, status } = data;
    this.logger.log(`Handling bKash callback for Payment ID: ${paymentID} with status: ${status}`);

    const handlers: Record<string, Function> = {
      success: this.handleBkashSuccess,
      failure: this.handleBkashFailure,
      cancel: this.handleBkashCancel,
    };

    const handler = handlers[status?.toLowerCase()];

    if (!handler) {
      throw new InternalServerErrorException(`Invalid bKash payment status: ${status}`);
    }

    const url = await handler.call(this, paymentID, paymentService);

    return {
      url,
      tran_id: paymentID,
    };
  }

  private async handleBkashSuccess(
    paymentID: string,
    paymentService: PaymentApiService,
  ): Promise<string> {
    const payment = await paymentService.findOneByTranId(paymentID);
    if (!payment) {
      throw new NotFoundException(`Payment with ID "${paymentID}" not found`);
    }

    try {
      // Execute the payment
      const executeResponse = await this.bkashService.executePayment(paymentID);

      payment.status = PaymentStatus.SUCCESSFUL;
      payment.extra = JSON.stringify(executeResponse);
      payment.notes = 'Payment successful via bKash';
      await paymentService.update(payment.id, payment);

      return (
        this.configService.get('paymentFrontend.successUrl') +
        `?tran_id=${paymentID}&status=success`
      );
    } catch (error) {
      this.logger.error(`Failed to execute bKash payment: ${error.message}`);
      // If execute fails, it's generally a failure
      payment.status = PaymentStatus.FAILED;
      payment.notes = `Execution failed: ${error.message}`;
      await paymentService.update(payment.id, payment);

      return (
        this.configService.get('paymentFrontend.failUrl') +
        `?tran_id=${paymentID}&status=failure`
      );
    }
  }

  private async handleBkashFailure(
    paymentID: string,
    paymentService: PaymentApiService,
  ): Promise<string> {
    const payment = await paymentService.findOneByTranId(paymentID);
    if (!payment) {
      throw new NotFoundException(`Payment with ID "${paymentID}" not found`);
    }

    payment.status = PaymentStatus.FAILED;
    payment.notes = 'Payment failed via bKash';
    await paymentService.update(payment.id, payment);

    return (
      this.configService.get('paymentFrontend.failUrl') +
      `?tran_id=${paymentID}&status=failure`
    );
  }

  private async handleBkashCancel(
    paymentID: string,
    paymentService: PaymentApiService,
  ): Promise<string> {
    const payment = await paymentService.findOneByTranId(paymentID);
    if (!payment) {
      throw new NotFoundException(`Payment with ID "${paymentID}" not found`);
    }

    payment.status = PaymentStatus.FAILED; // Or CANCELLED if your enum supports it, matching existing SSLCommerz pattern
    payment.notes = 'Payment cancelled via bKash';
    await paymentService.update(payment.id, payment);

    return (
      this.configService.get('paymentFrontend.cancelUrl') +
      `?tran_id=${paymentID}&status=cancel`
    );
  }
}
