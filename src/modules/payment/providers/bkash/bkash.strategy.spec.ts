import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { OrderStatus } from '../../../orders/order/entities/order.entity';
import { PaymentStatus } from '../../payment-api/entities/payment-api.entity';
import { PaymentApiService } from '../../payment-api/payment-api.service';
import { BkashService } from './bkash.service';
import { BkashStrategy } from './bkash.strategy';
jest.mock('nanoid', () => ({
  customAlphabet: () => () => 'ORDER_1234',
}));

describe('BkashStrategy', () => {
  let strategy: BkashStrategy;
  let bkashService: BkashService;
  let paymentApiService: PaymentApiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BkashStrategy,
        {
          provide: BkashService,
          useValue: {
            createPayment: jest.fn(),
            queryPayment: jest.fn(),
            executePayment: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key) => {
              if (key === 'paymentFrontend.successUrl') return 'http://success';
              if (key === 'paymentFrontend.failUrl') return 'http://fail';
              if (key === 'paymentFrontend.cancelUrl') return 'http://cancel';
              return null;
            }),
          },
        },
      ],
    }).compile();

    strategy = module.get<BkashStrategy>(BkashStrategy);
    bkashService = module.get<BkashService>(BkashService);

    paymentApiService = {
      markPaymentSuccess: jest.fn(),
      markPaymentFailed: jest.fn(),
    } as unknown as PaymentApiService;
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('init', () => {
    it('should initialize payment and return url', async () => {
      jest.spyOn(bkashService, 'createPayment').mockResolvedValue({
        bkashURL: 'http://bkash',
        paymentID: 'PID123',
      } as any);
      const result = await strategy.init({
        total_amount: 100,
        currency: 'BDT',
      } as any);
      expect(result.url).toBe('http://bkash');
      expect(result.tran_id).toBe('PID123');
    });

    it('should throw InternalServerErrorException on error', async () => {
      jest
        .spyOn(bkashService, 'createPayment')
        .mockRejectedValue(new Error('error'));
      await expect(strategy.init({ total_amount: 100 } as any)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('checkout', () => {
    it('should throw error', async () => {
      await expect(strategy.checkout(100)).rejects.toThrow(
        'Direct checkout not supported for bKash. Use init() instead.',
      );
    });
  });

  describe('validate', () => {
    it('should return true if completed', async () => {
      jest
        .spyOn(bkashService, 'queryPayment')
        .mockResolvedValue({ transactionStatus: 'Completed' } as any);
      expect(await strategy.validate({ paymentID: '123' })).toBe(true);
    });

    it('should return false if not completed or error', async () => {
      jest
        .spyOn(bkashService, 'queryPayment')
        .mockResolvedValue({ transactionStatus: 'Pending' } as any);
      expect(await strategy.validate({ paymentID: '123' })).toBe(false);

      jest.spyOn(bkashService, 'queryPayment').mockRejectedValue(new Error());
      expect(await strategy.validate({ paymentID: '123' })).toBe(false);
    });

    it('should return false if no paymentID', async () => {
      expect(await strategy.validate({} as any)).toBe(false);
    });
  });

  describe('handleCallback', () => {
    it('should process success status, execute payment, and return success url', async () => {
      const executeResponse = {
        statusCode: '0000',
        statusMessage: 'Successful',
      };
      jest
        .spyOn(bkashService, 'executePayment')
        .mockResolvedValue(executeResponse as any);

      const result = await strategy.handleCallback(
        { paymentID: 'TRX123', status: 'success' },
        paymentApiService,
      );

      expect(bkashService.executePayment).toHaveBeenCalledWith('TRX123');
      expect(paymentApiService.markPaymentSuccess).toHaveBeenCalledWith(
        'TRX123',
        executeResponse,
        expect.any(String)
      );
      expect(result).toEqual({
        url: 'http://success?tran_id=TRX123&status=success',
        tran_id: 'TRX123',
      });
    });

    it('should process failure status and mark payment failed', async () => {
      const result = await strategy.handleCallback(
        { paymentID: 'TRX123', status: 'failure' },
        paymentApiService,
      );

      expect(paymentApiService.markPaymentFailed).toHaveBeenCalledWith(
        'TRX123',
        null,
        expect.any(String)
      );
      expect(result).toEqual({
        url: 'http://fail?tran_id=TRX123&status=failure',
        tran_id: 'TRX123',
      });
    });

    it('should process cancel status', async () => {
      const result = await strategy.handleCallback(
        { paymentID: 'TRX123', status: 'cancel' },
        paymentApiService,
      );

      expect(paymentApiService.markPaymentFailed).toHaveBeenCalledWith(
        'TRX123',
        null,
        expect.any(String)
      );
      expect(result.url).toBe('http://cancel?tran_id=TRX123&status=cancel');
    });

    it('should handle executePayment failure in success handler and mark failed', async () => {
      jest.spyOn(bkashService, 'executePayment').mockRejectedValue(new Error('fail'));

      const result = await strategy.handleCallback(
        { paymentID: 'TRX123', status: 'success' },
        paymentApiService,
      );
      
      expect(paymentApiService.markPaymentFailed).toHaveBeenCalledWith(
        'TRX123',
        null,
        expect.stringContaining('fail')
      );
      expect(result.url).toBe('http://fail?tran_id=TRX123&status=failure');
    });

    it('should throw InternalServerErrorException on invalid status', async () => {
      await expect(
        strategy.handleCallback(
          { paymentID: 'TRX123', status: 'invalid' },
          paymentApiService,
        ),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });
});
