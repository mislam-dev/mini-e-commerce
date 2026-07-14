import { Test, TestingModule } from '@nestjs/testing';
import { StripePaymentStrategy } from './stripe.strategy';
import { ConfigService } from '@nestjs/config';
import { STRIPE_INSTANCE } from './stripe.constant';
import { BadRequestException } from '@nestjs/common';

describe('StripePaymentStrategy', () => {
  let strategy: StripePaymentStrategy;
  
  const mockStripe = {
    paymentIntents: {
      create: jest.fn().mockResolvedValue({ client_secret: 'secret123' }),
    },
    checkout: {
      sessions: {
        create: jest.fn().mockResolvedValue({ url: 'http://stripe', id: 'session123' }),
        retrieve: jest.fn().mockResolvedValue({ payment_status: 'paid' }),
      },
    },
    webhooks: {
      constructEvent: jest.fn(),
    },
  };

  const mockConfigService = {
    getOrThrow: jest.fn((key: string) => {
      if (key === 'paymentFrontend.successUrl') return 'http://success';
      if (key === 'paymentFrontend.failUrl') return 'http://fail';
      if (key === 'stripe.webhook_secret') return 'whsec_secret';
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StripePaymentStrategy,
        { provide: STRIPE_INSTANCE, useValue: mockStripe },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    strategy = module.get<StripePaymentStrategy>(StripePaymentStrategy);
    jest.clearAllMocks();
  });

  describe('checkout', () => {
    it('should return client secret', async () => {
      const result = await strategy.checkout(100);
      expect(mockStripe.paymentIntents.create).toHaveBeenCalled();
      expect(result).toBe('secret123');
    });
  });

  describe('init', () => {
    it('should create a checkout session', async () => {
      const result = await strategy.init({
        total_amount: 100,
        currency: 'usd',
        cus_name: 'Test',
        cus_email: 'test@test.com',
      } as any);

      expect(mockStripe.checkout.sessions.create).toHaveBeenCalled();
      expect(result).toEqual({ url: 'http://stripe', tran_id: 'session123' });
    });
  });

  describe('validate', () => {
    it('should validate session', async () => {
      const result = await strategy.validate({ session_id: 'session123' });
      expect(mockStripe.checkout.sessions.retrieve).toHaveBeenCalledWith('session123');
      expect(result).toBe(true);
    });

    it('should return false if no session_id', async () => {
      const result = await strategy.validate({});
      expect(result).toBe(false);
    });
  });

  describe('handleCallback', () => {
    it('should process webhook and return empty url', async () => {
      mockStripe.webhooks.constructEvent.mockReturnValue({
        type: 'checkout.session.completed',
        data: { object: { id: 'session123' } },
      });

      const mockPaymentService = {
        markPaymentSuccess: jest.fn().mockResolvedValue({ id: 'payment-id' }),
      };

      const result = await strategy.handleCallback(
        { rawBody: Buffer.from('body'), signature: 'sig' },
        mockPaymentService as any
      );

      expect(mockStripe.webhooks.constructEvent).toHaveBeenCalled();
      expect(mockPaymentService.markPaymentSuccess).toHaveBeenCalledWith('session123', { id: 'session123' }, expect.any(String));
      expect(result).toEqual({ url: '', tran_id: '' });
    });

    it('should throw if missing signature', async () => {
      await expect(
        strategy.handleCallback({ rawBody: Buffer.from(''), signature: '' }, {} as any)
      ).rejects.toThrow(BadRequestException);
    });
  });
});
