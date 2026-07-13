import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { UserStatus } from '../../../core/user/entities/user.entity';
import { UserService } from '../../../core/user/user.service';
import { CartService } from '../../cart/cart.service';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderService } from './order.service';

describe('OrderService', () => {
  let service: OrderService;
  let dataSource: DataSource;
  let cartService: CartService;
  let userService: UserService;
  let orderRepository: Repository<Order>;
  let cacheManager: any;
  let queryRunnerMock: any;

  beforeEach(async () => {
    queryRunnerMock = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        save: jest
          .fn()
          .mockImplementation((entity, obj) => Promise.resolve(obj)),
        remove: jest.fn().mockResolvedValue(true),
        increment: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        {
          provide: getRepositoryToken(Order),
          useValue: {
            findAndCount: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            createQueryRunner: jest.fn().mockReturnValue(queryRunnerMock),
          },
        },
        {
          provide: CartService,
          useValue: {
            findAll: jest.fn(),
          },
        },
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            ttl: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(undefined), // Mock returning undefined to hit the || 5 fallback
          },
        },
        {
          provide: UserService,
          useValue: {
            findOne: jest.fn(),
            updateStatus: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
    dataSource = module.get<DataSource>(DataSource);
    cartService = module.get<CartService>(CartService);
    userService = module.get<UserService>(UserService);
    orderRepository = module.get<Repository<Order>>(getRepositoryToken(Order));
    cacheManager = module.get<any>(CACHE_MANAGER);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should correctly calculate the order total and reduce stock', async () => {
      jest
        .spyOn(userService, 'findOne')
        .mockResolvedValue({ status: UserStatus.ACTIVE } as any);
      // getCancelOrderCount is private, handled by mock cache

      const cartItems = [
        {
          id: 'cart-1',
          quantity: 2,
          product: {
            id: 'prod-1',
            name: 'Product A',
            price: 100,
            stockQuantity: 5,
          },
        },
        {
          id: 'cart-2',
          quantity: 1,
          product: {
            id: 'prod-2',
            name: 'Product B',
            price: 50,
            stockQuantity: 2,
          },
        },
      ];

      jest.spyOn(cartService, 'findAll').mockResolvedValue(cartItems as any);

      const result = await service.create('user-1', {} as any);

      expect(cartService.findAll).toHaveBeenCalledWith('user-1');
      // 2 * 100 + 1 * 50 = 250
      expect(result.totalAmount).toEqual(250);
      expect(result.status).toEqual(OrderStatus.PENDING);

      // Check stock reduction
      expect(queryRunnerMock.manager.save).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ id: 'prod-1', stockQuantity: 3 }),
      );
      expect(queryRunnerMock.manager.save).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ id: 'prod-2', stockQuantity: 1 }),
      );

      expect(queryRunnerMock.commitTransaction).toHaveBeenCalled();
      expect(queryRunnerMock.release).toHaveBeenCalled();
    });

    it('should throw an error if stock is insufficient', async () => {
      jest
        .spyOn(userService, 'findOne')
        .mockResolvedValue({ status: UserStatus.ACTIVE } as any);

      const cartItems = [
        {
          id: 'cart-1',
          quantity: 10,
          product: {
            id: 'prod-1',
            name: 'Product A',
            price: 100,
            stockQuantity: 5,
          }, // Only 5 in stock, asking 10
        },
      ];

      jest.spyOn(cartService, 'findAll').mockResolvedValue(cartItems as any);

      await expect(service.create('user-1', {} as any)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create('user-1', {} as any)).rejects.toThrow(
        'Insufficient stock for product Product A',
      );

      expect(queryRunnerMock.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunnerMock.release).toHaveBeenCalled();
    });

    it('should throw error if user is restricted', async () => {
      jest
        .spyOn(userService, 'findOne')
        .mockResolvedValue({ status: UserStatus.ORDER_RESTRICTED } as any);
      await expect(service.create('user-1', {} as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw error if cancel count limit is reached', async () => {
      jest
        .spyOn(userService, 'findOne')
        .mockResolvedValue({ status: UserStatus.ACTIVE } as any);
      jest.spyOn(cacheManager, 'get').mockResolvedValue(5);

      await expect(service.create('user-1', {} as any)).rejects.toThrow(
        BadRequestException,
      );
      expect(userService.updateStatus).toHaveBeenCalledWith(
        'user-1',
        UserStatus.ORDER_RESTRICTED,
      );
    });

    it('should throw error if cart is empty', async () => {
      jest
        .spyOn(userService, 'findOne')
        .mockResolvedValue({ status: UserStatus.ACTIVE } as any);
      jest.spyOn(cartService, 'findAll').mockResolvedValue([]);
      await expect(service.create('user-1', {} as any)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('should find all orders', async () => {
      const mockResult = [{ id: 'order-1' }];
      const findAndCountSpy = jest
        .spyOn(orderRepository, 'findAndCount')
        .mockResolvedValue([mockResult as any, 1]);
      const result = await service.findAll({ limit: 10, offset: 0 });
      expect(findAndCountSpy).toHaveBeenCalled();
      expect(result.total).toBe(1);
    });

    it('should find all orders with default pagination', async () => {
      const mockResult = [{ id: 'order-1' }];
      const findAndCountSpy = jest
        .spyOn(orderRepository, 'findAndCount')
        .mockResolvedValue([mockResult as any, 1]);
      const result = await service.findAll({} as any);
      expect(findAndCountSpy).toHaveBeenCalled();
      expect(result.limit).toBe(10);
      expect(result.offset).toBe(0);
    });
  });

  describe('findMyOrders', () => {
    it('should find user orders', async () => {
      const mockResult = [{ id: 'order-1' }];
      const findAndCountSpy = jest
        .spyOn(orderRepository, 'findAndCount')
        .mockResolvedValue([mockResult as any, 1]);
      const result = await service.findMyOrders({ id: 'user-1' } as any, {
        limit: 10,
        offset: 0,
      });
      expect(findAndCountSpy).toHaveBeenCalled();
      expect(result.total).toBe(1);
    });

    it('should find user orders with default pagination', async () => {
      const mockResult = [{ id: 'order-1' }];
      const findAndCountSpy = jest
        .spyOn(orderRepository, 'findAndCount')
        .mockResolvedValue([mockResult as any, 1]);
      const result = await service.findMyOrders({ id: 'user-1' } as any, {} as any);
      expect(findAndCountSpy).toHaveBeenCalled();
      expect(result.limit).toBe(10);
      expect(result.offset).toBe(0);
    });
  });

  describe('findOne', () => {
    it('should find one order', async () => {
      const mockResult = { id: 'order-1' };
      const findOneSpy = jest
        .spyOn(orderRepository, 'findOne')
        .mockResolvedValue(mockResult as any);
      const result = await service.findOne('order-1');
      expect(findOneSpy).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });

    it('should throw if order not found', async () => {
      jest.spyOn(orderRepository, 'findOne').mockResolvedValue(null as any);
      try {
        await service.findOne('order-1');
      } catch (e) {
        expect(e).toBeInstanceOf(NotFoundException);
      }
    });
  });

  describe('cancel', () => {
    it('should cancel an order and restock items', async () => {
      const order = {
        id: 'order-1',
        userId: 'user-1',
        status: OrderStatus.PENDING,
        items: [{ productId: 'prod-1', quantity: 2 }],
      };
      jest.spyOn(orderRepository, 'findOne').mockResolvedValue(order as any);

      const result = await service.cancel('order-1', {
        sub: 'user-1',
        role: 'customer',
      } as any);

      expect(queryRunnerMock.manager.increment).toHaveBeenCalled();
      expect(queryRunnerMock.manager.update).toHaveBeenCalled();
      expect(queryRunnerMock.commitTransaction).toHaveBeenCalled();
      expect(result.status).toBe(OrderStatus.CANCELLED);
    });

    it('should increment cancel count if already in cache', async () => {
      const order = {
        id: 'order-1',
        userId: 'user-1',
        status: OrderStatus.PENDING,
        items: [{ productId: 'prod-1', quantity: 2 }],
      };
      jest.spyOn(orderRepository, 'findOne').mockResolvedValue(order as any);
      jest.spyOn(cacheManager, 'get').mockResolvedValue(2);
      jest.spyOn(cacheManager, 'ttl').mockResolvedValue(1000);

      await service.cancel('order-1', {
        sub: 'user-1',
        role: 'customer',
      } as any);

      expect(cacheManager.set).toHaveBeenCalledWith(
        'cancel-order-count:user-1',
        3,
        1000,
      );
    });

    it('should throw error if order is already cancelled', async () => {
      const order = {
        id: 'order-1',
        userId: 'user-1',
        status: OrderStatus.CANCELLED,
      };
      jest.spyOn(orderRepository, 'findOne').mockResolvedValue(order as any);

      await expect(
        service.cancel('order-1', { sub: 'user-1', role: 'customer' } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error if order is not pending', async () => {
      const order = {
        id: 'order-1',
        userId: 'user-1',
        status: OrderStatus.SHIPPED,
      };
      jest.spyOn(orderRepository, 'findOne').mockResolvedValue(order as any);

      await expect(
        service.cancel('order-1', { sub: 'user-1', role: 'customer' } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should rollback transaction on error', async () => {
      const order = {
        id: 'order-1',
        userId: 'user-1',
        status: OrderStatus.PENDING,
        items: [{ productId: 'prod-1', quantity: 2 }],
      };
      jest.spyOn(orderRepository, 'findOne').mockResolvedValue(order as any);
      queryRunnerMock.manager.update.mockRejectedValue(new Error('DB Error'));

      await expect(
        service.cancel('order-1', { sub: 'user-1', role: 'customer' } as any),
      ).rejects.toThrow('DB Error');

      expect(queryRunnerMock.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunnerMock.release).toHaveBeenCalled();
    });

    it('should throw Forbidden if user is not owner and not admin', async () => {
      const order = {
        id: 'order-1',
        userId: 'user-2',
        status: OrderStatus.PENDING,
      };
      jest.spyOn(orderRepository, 'findOne').mockResolvedValue(order as any);
      try {
        await service.cancel('order-1', {
          sub: 'user-1',
          role: 'customer',
        } as any);
      } catch (e) {
        expect(e).toBeInstanceOf(ForbiddenException);
      }
    });
  });

  describe('updateStatus', () => {
    it('should update status', async () => {
      const order = { id: 'order-1', status: OrderStatus.PENDING };
      jest.spyOn(orderRepository, 'findOne').mockResolvedValue(order as any);
      jest
        .spyOn(orderRepository, 'save')
        .mockResolvedValue({ ...order, status: OrderStatus.SHIPPED } as any);
      const result = await service.updateStatus('order-1', OrderStatus.SHIPPED);
      expect(result.status).toBe(OrderStatus.SHIPPED);
    });
  });

  describe('update', () => {
    it('should update an order', async () => {
      const order = { id: 'order-1', status: OrderStatus.PENDING };
      jest.spyOn(orderRepository, 'findOne').mockResolvedValue(order as any);
      jest
        .spyOn(orderRepository, 'save')
        .mockResolvedValue({ ...order, totalAmount: 500 } as any);

      const result = await service.update('order-1', {} as any);
      expect(orderRepository.save).toHaveBeenCalledWith(order);
      expect(result.totalAmount).toBe(500);
    });
  });

  describe('remove', () => {
    it('should delete order', async () => {
      jest
        .spyOn(orderRepository, 'delete')
        .mockResolvedValue({ affected: 1 } as any);
      await service.remove('order-1');
    });

    it('should throw if delete fails', async () => {
      jest
        .spyOn(orderRepository, 'delete')
        .mockResolvedValue({ affected: 0 } as any);
      try {
        await service.remove('order-1');
      } catch (e) {
        expect(e).toBeInstanceOf(NotFoundException);
      }
    });
  });
});
