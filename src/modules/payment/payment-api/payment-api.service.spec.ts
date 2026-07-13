import { Test, TestingModule } from '@nestjs/testing';
import { PaymentApiService } from './payment-api.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Payment, PaymentStatus } from './entities/payment-api.entity';
import { PaymentFactory } from '../payment.factory';
import { OrderService } from '../../orders/order/order.service';
import { UserService } from '../../../core/user/user.service';
import { NotFoundException } from '@nestjs/common';

describe('PaymentApiService', () => {
  let service: PaymentApiService;

  const mockPayment = { id: 'payment-id', status: PaymentStatus.PENDING, transactionId: 'tran-id' };
  
  const mockRepository = {
    create: jest.fn().mockReturnValue(mockPayment),
    save: jest.fn().mockResolvedValue(mockPayment),
    findAndCount: jest.fn().mockResolvedValue([[mockPayment], 1]),
    findOne: jest.fn().mockResolvedValue(mockPayment),
    delete: jest.fn().mockResolvedValue({ affected: 1 }),
  };

  const mockStrategy = {
    init: jest.fn().mockResolvedValue({ url: 'http://pay', tran_id: 'tran-id' }),
    handleCallback: jest.fn().mockResolvedValue({ url: 'http://redirect', tran_id: 'tran-id' }),
  };

  const mockFactory = {
    getStrategy: jest.fn().mockReturnValue(mockStrategy),
  };

  const mockOrderService = {
    findOne: jest.fn().mockResolvedValue({ id: 'order-id', userId: 'user-id', totalAmount: 100 }),
    updateStatus: jest.fn(),
  };

  const mockUserService = {
    findOne: jest.fn().mockResolvedValue({ id: 'user-id', fullName: 'Test User', email: 'test@test.com' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentApiService,
        { provide: getRepositoryToken(Payment), useValue: mockRepository },
        { provide: PaymentFactory, useValue: mockFactory },
        { provide: OrderService, useValue: mockOrderService },
        { provide: UserService, useValue: mockUserService },
      ],
    }).compile();

    service = module.get<PaymentApiService>(PaymentApiService);
  });

  describe('create', () => {
    it('should create a payment', async () => {
      const dto = { provider: 'bkash', orderId: 'order-id' };
      const result = await service.create(dto as any);
      expect(mockOrderService.findOne).toHaveBeenCalledWith('order-id');
      expect(mockUserService.findOne).toHaveBeenCalledWith('user-id');
      expect(mockStrategy.init).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result.url).toBe('http://pay');
    });

    it('should throw if order not found', async () => {
      mockOrderService.findOne.mockResolvedValueOnce(null);
      await expect(service.create({ provider: 'bkash', orderId: 'order-id' } as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should find all payments', async () => {
      const result = await service.findAll({ limit: 10, offset: 0 }, 'order-id');
      expect(mockRepository.findAndCount).toHaveBeenCalled();
      expect(result.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should find one payment', async () => {
      const result = await service.findOne('payment-id');
      expect(result).toEqual(mockPayment);
    });

    it('should throw if not found', async () => {
      mockRepository.findOne.mockResolvedValueOnce(null);
      await expect(service.findOne('payment-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOneByTranId', () => {
    it('should find payment by transaction id', async () => {
      const result = await service.findOneByTranId('tran-id');
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { transactionId: 'tran-id' } });
      expect(result).toEqual(mockPayment);
    });
  });

  describe('update', () => {
    it('should update a payment', async () => {
      const result = await service.update('payment-id', { status: PaymentStatus.SUCCESSFUL });
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockPayment);
    });
  });

  describe('remove', () => {
    it('should delete a payment', async () => {
      await service.remove('payment-id');
      expect(mockRepository.delete).toHaveBeenCalledWith('payment-id');
    });

    it('should throw if delete fails', async () => {
      mockRepository.delete.mockResolvedValueOnce({ affected: 0 });
      await expect(service.remove('payment-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('handleCallback', () => {
    it('should handle callback via strategy', async () => {
      const result = await service.handleCallback('bkash', {} as any);
      expect(mockStrategy.handleCallback).toHaveBeenCalled();
      expect(result.url).toBe('http://redirect');
    });
  });
});
