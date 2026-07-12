import { Test, TestingModule } from '@nestjs/testing';
jest.mock('nanoid', () => ({
  customAlphabet: () => () => 'ORDER_1234',
}));
import { PaymentFactory } from './payment.factory';
import { BkashStrategy } from './providers/bkash/bkash.strategy';
import { SslcomerzStrategy } from './providers/sslcomerz/sslcomerz.strategy';
import { StripePaymentStrategy } from './providers/stripe/stripe.strategy';

describe('PaymentFactory', () => {
  let factory: PaymentFactory;
  let bkashStrategy: BkashStrategy;
  let sslcomerzStrategy: SslcomerzStrategy;
  let stripeStrategy: StripePaymentStrategy;

  beforeEach(async () => {
    bkashStrategy = {} as BkashStrategy;
    sslcomerzStrategy = {} as SslcomerzStrategy;
    stripeStrategy = {} as StripePaymentStrategy;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentFactory,
        { provide: BkashStrategy, useValue: bkashStrategy },
        { provide: SslcomerzStrategy, useValue: sslcomerzStrategy },
        { provide: StripePaymentStrategy, useValue: stripeStrategy },
      ],
    }).compile();

    factory = module.get<PaymentFactory>(PaymentFactory);
  });

  it('should be defined', () => {
    expect(factory).toBeDefined();
  });

  describe('getStrategy', () => {
    it('should return BkashStrategy when type is bkash', () => {
      const strategy = factory.getStrategy('bkash');
      expect(strategy).toBe(bkashStrategy);
    });

    it('should return SslcomerzStrategy when type is sslcommerz', () => {
      const strategy = factory.getStrategy('sslcommerz');
      expect(strategy).toBe(sslcomerzStrategy);
    });

    it('should return StripePaymentStrategy when type is stripe', () => {
      const strategy = factory.getStrategy('stripe');
      expect(strategy).toBe(stripeStrategy);
    });

    it('should throw an error for invalid strategy type', () => {
      expect(() => factory.getStrategy('invalid' as any)).toThrow('Invalid strategy type');
    });
  });
});
