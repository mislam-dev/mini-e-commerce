import { InternalServerErrorException, NotFoundException } from '@nestjs/common';
jest.mock('nanoid', () => ({
  customAlphabet: () => () => 'ORDER_1234',
}));
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { OrderStatus } from '../../../orders/order/entities/order.entity';
import { PaymentStatus } from '../../payment-api/entities/payment-api.entity';
import { PaymentApiService } from '../../payment-api/payment-api.service';
import { BkashService } from './bkash.service';
import { BkashStrategy } from './bkash.strategy';

describe('BkashStrategy', () => {
  let strategy: BkashStrategy;
  let bkashService: BkashService;
  let configService: ConfigService;
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
    configService = module.get<ConfigService>(ConfigService);

    paymentApiService = {
      findOneByTranId: jest.fn(),
      update: jest.fn(),
      updateOrderStatus: jest.fn(),
    } as unknown as PaymentApiService;
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('handleCallback', () => {
    it('should process success status, update raw_response, and return success url', async () => {
      const mockPayment = { id: 'payment1', orderId: 'order1', status: PaymentStatus.PENDING };
      jest.spyOn(paymentApiService, 'findOneByTranId').mockResolvedValue(mockPayment as any);
      const executeResponse = { statusCode: '0000', statusMessage: 'Successful' };
      jest.spyOn(bkashService, 'executePayment').mockResolvedValue(executeResponse as any);
      jest.spyOn(paymentApiService, 'update').mockResolvedValue(mockPayment as any);

      const result = await strategy.handleCallback(
        { paymentID: 'TRX123', status: 'success' },
        paymentApiService,
      );

      expect(paymentApiService.findOneByTranId).toHaveBeenCalledWith('TRX123');
      expect(bkashService.executePayment).toHaveBeenCalledWith('TRX123');
      expect(paymentApiService.update).toHaveBeenCalledWith('payment1', expect.objectContaining({
        status: PaymentStatus.SUCCESSFUL,
        rawResponse: executeResponse,
      }));
      expect(result).toEqual({ url: 'http://success?tran_id=TRX123&status=success', tran_id: 'TRX123' });
    });

    it('should process failure status and update order status to CANCELLED', async () => {
      const mockPayment = { id: 'payment1', orderId: 'order1', status: PaymentStatus.PENDING };
      jest.spyOn(paymentApiService, 'findOneByTranId').mockResolvedValue(mockPayment as any);
      jest.spyOn(paymentApiService, 'updateOrderStatus').mockResolvedValue(true as any);

      const result = await strategy.handleCallback(
        { paymentID: 'TRX123', status: 'failure' },
        paymentApiService,
      );

      expect(paymentApiService.update).toHaveBeenCalledWith('payment1', expect.objectContaining({
        status: PaymentStatus.FAILED,
      }));
      expect(paymentApiService.updateOrderStatus).toHaveBeenCalledWith('order1', OrderStatus.CANCELLED);
      expect(result).toEqual({ url: 'http://fail?tran_id=TRX123&status=failure', tran_id: 'TRX123' });
    });

    it('should throw InternalServerErrorException on invalid status', async () => {
      await expect(
        strategy.handleCallback({ paymentID: 'TRX123', status: 'invalid' }, paymentApiService)
      ).rejects.toThrow(InternalServerErrorException);
    });
  });
});
