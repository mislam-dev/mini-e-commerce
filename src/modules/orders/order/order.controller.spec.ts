import { Test, TestingModule } from '@nestjs/testing';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { OrderStatus } from './entities/order.entity';
import { ForbiddenException } from '@nestjs/common';

describe('OrderController', () => {
  let controller: OrderController;
  let service: OrderService;

  const mockOrder = { id: 'order-id', user: { id: 'user-id' }, status: OrderStatus.PENDING };
  
  const mockOrderService = {
    create: jest.fn().mockResolvedValue(mockOrder),
    findAll: jest.fn().mockResolvedValue({ results: [mockOrder], total: 1 }),
    findMyOrders: jest.fn().mockResolvedValue({ results: [mockOrder], total: 1 }),
    findOne: jest.fn().mockResolvedValue(mockOrder),
    cancel: jest.fn().mockResolvedValue(undefined),
    updateStatus: jest.fn().mockResolvedValue({ ...mockOrder, status: OrderStatus.SHIPPED }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderController],
      providers: [{ provide: OrderService, useValue: mockOrderService }],
    }).compile();

    controller = module.get<OrderController>(OrderController);
    service = module.get<OrderService>(OrderService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create an order', async () => {
      const dto = {};
      const req = { sub: 'user-id' } as any;
      const result = await controller.create(req, dto);
      expect(service.create).toHaveBeenCalledWith('user-id', dto);
      expect(result).toEqual(mockOrder);
    });
  });

  describe('findAll', () => {
    it('should find all orders', async () => {
      const result = await controller.findAll({ limit: 10, offset: 0 });
      expect(service.findAll).toHaveBeenCalledWith({ limit: 10, offset: 0 });
      expect(result.total).toBe(1);
    });
  });

  describe('findMyOrders', () => {
    it('should find my orders', async () => {
      const req = { sub: 'user-id' } as any;
      const result = await controller.findMyOrders(req, { limit: 10, offset: 0 });
      expect(service.findMyOrders).toHaveBeenCalledWith({ id: 'user-id' }, { limit: 10, offset: 0 });
      expect(result.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should find one order if admin', async () => {
      const req = { sub: 'admin-id', role: 'admin' } as any;
      const result = await controller.findOne('order-id', req);
      expect(service.findOne).toHaveBeenCalledWith('order-id');
      expect(result).toEqual(mockOrder);
    });

    it('should find one order if owner', async () => {
      const req = { sub: 'user-id', role: 'customer' } as any;
      const result = await controller.findOne('order-id', req);
      expect(service.findOne).toHaveBeenCalledWith('order-id');
      expect(result).toEqual(mockOrder);
    });

    it('should throw ForbiddenException if not owner and not admin', async () => {
      const req = { sub: 'other-user', role: 'customer' } as any;
      await expect(controller.findOne('order-id', req)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('cancel', () => {
    it('should cancel an order', async () => {
      const req = { sub: 'user-id' } as any;
      const result = await controller.cancel('order-id', req);
      expect(service.cancel).toHaveBeenCalledWith('order-id', req);
      expect(result).toEqual({ message: 'Order cancelled successfully!' });
    });
  });

  describe('updateStatus', () => {
    it('should update order status', async () => {
      const result = await controller.updateStatus('order-id', { status: OrderStatus.SHIPPED });
      expect(service.updateStatus).toHaveBeenCalledWith('order-id', OrderStatus.SHIPPED);
      expect(result.status).toBe(OrderStatus.SHIPPED);
    });
  });
});
