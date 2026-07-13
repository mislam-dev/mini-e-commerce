import { Test, TestingModule } from '@nestjs/testing';
import { PaymentApiController } from './payment-api.controller';
import { PaymentApiService } from './payment-api.service';
import { PaymentStatus } from './entities/payment-api.entity';
import { BadRequestException } from '@nestjs/common';

describe('PaymentApiController', () => {
  let controller: PaymentApiController;
  let service: PaymentApiService;

  const mockPayment = { id: 'payment-id', status: PaymentStatus.PENDING };
  
  const mockService = {
    create: jest.fn().mockResolvedValue({ url: 'http://pay', tran_id: '123', payment: mockPayment }),
    findAll: jest.fn().mockResolvedValue({ results: [mockPayment], total: 1 }),
    update: jest.fn().mockResolvedValue({ ...mockPayment, status: PaymentStatus.SUCCESSFUL }),
    remove: jest.fn().mockResolvedValue(undefined),
    handleCallback: jest.fn().mockResolvedValue({ url: 'http://redirect', tran_id: '123' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentApiController],
      providers: [{ provide: PaymentApiService, useValue: mockService }],
    }).compile();

    controller = module.get<PaymentApiController>(PaymentApiController);
    service = module.get<PaymentApiService>(PaymentApiService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create payment', async () => {
      const dto = { provider: 'bkash', orderId: 'order-id' } as any;
      const result = await controller.create(dto);
      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result.url).toBe('http://pay');
    });
  });

  describe('findAll', () => {
    it('should find all payments', async () => {
      const result = await controller.findAll({ limit: 10, offset: 0 }, 'order-id');
      expect(service.findAll).toHaveBeenCalledWith({ limit: 10, offset: 0 }, 'order-id');
      expect(result.results).toHaveLength(1);
    });
  });

  describe('update', () => {
    it('should update payment', async () => {
      const dto = { status: PaymentStatus.SUCCESSFUL };
      const result = await controller.update('payment-id', dto);
      expect(service.update).toHaveBeenCalledWith('payment-id', dto);
      expect(result.status).toBe(PaymentStatus.SUCCESSFUL);
    });
  });

  describe('remove', () => {
    it('should remove payment', async () => {
      await controller.remove('payment-id');
      expect(service.remove).toHaveBeenCalledWith('payment-id');
    });
  });

  describe('sslSuccess', () => {
    it('should handle ssl success', async () => {
      const req = { body: { tran_id: '123' } } as any;
      const res = { redirect: jest.fn() } as any;
      await controller.sslSuccess(req, res);
      expect(service.handleCallback).toHaveBeenCalledWith('sslcommerz', req.body);
      expect(res.redirect).toHaveBeenCalledWith('http://redirect');
    });
  });

  describe('stripeWebhook', () => {
    it('should handle stripe webhook', async () => {
      const req = { rawBody: Buffer.from('test') } as any;
      const result = await controller.stripeWebhook('sig', req);
      expect(service.handleCallback).toHaveBeenCalledWith('stripe', { rawBody: req.rawBody, signature: 'sig' });
      expect(result).toEqual({ received: true });
    });

    it('should throw if missing signature', async () => {
      const req = { rawBody: Buffer.from('test') } as any;
      await expect(controller.stripeWebhook('', req)).rejects.toThrow(BadRequestException);
    });
  });

  describe('bkashCallback', () => {
    it('should handle bkash get callback', async () => {
      const query = { paymentID: '123' } as any;
      const res = { redirect: jest.fn() } as any;
      await controller.bkashCallbackGet(query, res);
      expect(service.handleCallback).toHaveBeenCalledWith('bkash', query);
      expect(res.redirect).toHaveBeenCalledWith('http://redirect');
    });

    it('should handle bkash post callback', async () => {
      const body = { paymentID: '123' } as any;
      const res = { redirect: jest.fn() } as any;
      await controller.bkashCallbackPost(body, res);
      expect(service.handleCallback).toHaveBeenCalledWith('bkash', body);
      expect(res.redirect).toHaveBeenCalledWith('http://redirect');
    });
  });
});
