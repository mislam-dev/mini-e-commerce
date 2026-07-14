import { Injectable } from '@nestjs/common';
import { PaymentStrategy } from './interfaces/payment-strategy/payment-strategy.interface';
import { BkashStrategy } from './providers/bkash/bkash.strategy';
import { SslcomerzStrategy } from './providers/sslcomerz/sslcomerz.strategy';
import { StripePaymentStrategy } from './providers/stripe/stripe.strategy';

type StrategyType = 'sslcommerz' | 'stripe' | 'bkash';

@Injectable()
export class PaymentFactory {
  constructor(
    private readonly sslcommerzStrategy: SslcomerzStrategy,
    private readonly stripeStrategy: StripePaymentStrategy,
    private readonly bkashStrategy: BkashStrategy,
  ) {}
  getStrategy(type: StrategyType): PaymentStrategy {
    switch (type) {
      case 'sslcommerz':
        return this.sslcommerzStrategy;
      case 'stripe':
        return this.stripeStrategy;
      case 'bkash':
        return this.bkashStrategy;
      default:
        throw new Error('Invalid strategy type');
    }
  }
}
