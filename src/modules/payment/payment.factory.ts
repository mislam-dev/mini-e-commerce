import { Injectable } from '@nestjs/common';
import { PaymentStrategy } from './interfaces/payment-strategy/payment-strategy.interface';
import { SslcomerzStrategy } from './providers/sslcomerz/sslcomerz.strategy';

type StrategyType = 'sslcommerz';

@Injectable()
export class PaymentFactory {
  constructor(private readonly sslcommerzStrategy: SslcomerzStrategy) {}
  getStrategy(type: StrategyType): PaymentStrategy {
    switch (type) {
      case 'sslcommerz':
        return this.sslcommerzStrategy;
      default:
        throw new Error('Invalid strategy type');
    }
  }
}
