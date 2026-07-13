import { Test, TestingModule } from '@nestjs/testing';
import { SslcomerzStrategy } from './sslcomerz.strategy';
import { ConfigService } from '@nestjs/config';
import {
  SSLCOMMERZ_CANCEL_URL,
  SSLCOMMERZ_FAIL_URL,
  SSLCOMMERZ_INSTANCE,
  SSLCOMMERZ_IPN_URL,
  SSLCOMMERZ_SUCCESS_URL,
} from './sllcomerz.constant';
import { InternalServerErrorException } from '@nestjs/common';

describe('SslcomerzStrategy', () => {
  let strategy: SslcomerzStrategy;

  const mockSslcommerz = {
    init: jest.fn().mockResolvedValue({ status: 'SUCCESS', GatewayPageURL: 'http://ssl-gateway' }),
    validate: jest.fn().mockResolvedValue({ status: 'VALID' }),
  };

  const mockConfigService = {
    get: jest.fn((key) => {
      if (key === 'paymentFrontend.successUrl') return 'http://success';
      if (key === 'paymentFrontend.failUrl') return 'http://fail';
      if (key === 'paymentFrontend.cancelUrl') return 'http://cancel';
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SslcomerzStrategy,
        { provide: SSLCOMMERZ_INSTANCE, useValue: mockSslcommerz },
        { provide: SSLCOMMERZ_SUCCESS_URL, useValue: 'url' },
        { provide: SSLCOMMERZ_FAIL_URL, useValue: 'url' },
        { provide: SSLCOMMERZ_CANCEL_URL, useValue: 'url' },
        { provide: SSLCOMMERZ_IPN_URL, useValue: 'url' },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    strategy = module.get<SslcomerzStrategy>(SslcomerzStrategy);
  });

  describe('init', () => {
    it('should init transaction', async () => {
      const result = await strategy.init({} as any);
      expect(mockSslcommerz.init).toHaveBeenCalled();
      expect(result.url).toBe('http://ssl-gateway');
      expect(result.tran_id).toBeDefined();
    });

    it('should throw if init fails', async () => {
      mockSslcommerz.init.mockResolvedValueOnce({ status: 'FAILED', failedreason: 'Error' });
      await expect(strategy.init({} as any)).rejects.toThrow('Error');
    });
  });

  describe('validate', () => {
    it('should validate transaction', async () => {
      const result = await strategy.validate({ val_id: '123' });
      expect(mockSslcommerz.validate).toHaveBeenCalledWith({ val_id: '123' });
      expect(result).toEqual({ status: 'VALID' });
    });
  });

  describe('handleCallback', () => {
    it('should handle VALID status', async () => {
      const mockPaymentService = {
        findOneByTranId: jest.fn().mockResolvedValue({ id: 'payment-id' }),
        update: jest.fn(),
      };
      const result = await strategy.handleCallback({ status: 'VALID', tran_id: '123' } as any, mockPaymentService as any);
      expect(mockPaymentService.update).toHaveBeenCalled();
      expect(result.url).toContain('http://success');
    });

    it('should handle FAILED status', async () => {
      const mockPaymentService = {
        findOneByTranId: jest.fn().mockResolvedValue({ id: 'payment-id' }),
      };
      const result = await strategy.handleCallback({ status: 'FAILED', tran_id: '123' } as any, mockPaymentService as any);
      expect(result.url).toContain('http://fail');
    });

    it('should handle CANCELLED status', async () => {
      const mockPaymentService = {
        findOneByTranId: jest.fn().mockResolvedValue({ id: 'payment-id' }),
      };
      const result = await strategy.handleCallback({ status: 'CANCELLED', tran_id: '123' } as any, mockPaymentService as any);
      expect(result.url).toContain('http://cancel');
    });

    it('should handle UNATTEMPTED status', async () => {
      const mockPaymentService = {
        findOneByTranId: jest.fn().mockResolvedValue({ id: 'payment-id' }),
        update: jest.fn(),
      };
      const result = await strategy.handleCallback({ status: 'UNATTEMPTED', tran_id: '123' } as any, mockPaymentService as any);
      expect(mockPaymentService.update).toHaveBeenCalled();
      expect(result.url).toContain('http://fail');
    });

    it('should throw if status is invalid', async () => {
      await expect(
        strategy.handleCallback({ status: 'UNKNOWN' } as any, {} as any)
      ).rejects.toThrow(InternalServerErrorException);
    });
  });
});
