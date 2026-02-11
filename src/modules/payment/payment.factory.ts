import { Injectable } from '@nestjs/common';
import { PaymentStrategy } from './interfaces/payment-strategy/payment-strategy.interface';
import { SslcomerzStrategy } from './providers/sslcomerz/sslcomerz.strategy';
import { StripePaymentStrategy } from './providers/stripe/stripe.strategy';

type StrategyType = 'sslcommerz' | 'stripe';

@Injectable()
export class PaymentFactory {
  constructor(
    private readonly sslcommerzStrategy: SslcomerzStrategy,
    private readonly stripeStrategy: StripePaymentStrategy,
  ) {}
  getStrategy(type: StrategyType): PaymentStrategy {
    switch (type) {
      case 'sslcommerz':
        return this.sslcommerzStrategy;
      case 'stripe':
        return this.stripeStrategy;
      default:
        throw new Error('Invalid strategy type');
    }
  }
}
