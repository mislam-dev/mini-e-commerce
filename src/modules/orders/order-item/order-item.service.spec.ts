import { Test, TestingModule } from '@nestjs/testing';
import { OrderItemService } from './order-item.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OrderItem } from './entities/order-item.entity';

describe('OrderItemService', () => {
  let service: OrderItemService;

  const mockOrderItem = { id: 'item-id', quantity: 2, price: 100, subtotal: 200 };

  const mockRepository = {
    create: jest.fn().mockReturnValue(mockOrderItem),
    save: jest.fn().mockResolvedValue(mockOrderItem),
    find: jest.fn().mockResolvedValue([mockOrderItem]),
    findOneBy: jest.fn().mockResolvedValue(mockOrderItem),
    delete: jest.fn().mockResolvedValue({ affected: 1 }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderItemService,
        { provide: getRepositoryToken(OrderItem), useValue: mockRepository },
      ],
    }).compile();

    service = module.get<OrderItemService>(OrderItemService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an order item', async () => {
      const dto = { order: {} as any, product: {} as any, quantity: 2, price: 100, subtotal: 200 };
      const result = await service.create(dto);
      expect(mockRepository.create).toHaveBeenCalledWith(dto);
      expect(mockRepository.save).toHaveBeenCalledWith(mockOrderItem);
      expect(result).toEqual(mockOrderItem);
    });
  });

  describe('findAll', () => {
    it('should find all order items', async () => {
      const result = await service.findAll();
      expect(mockRepository.find).toHaveBeenCalled();
      expect(result).toEqual([mockOrderItem]);
    });
  });

  describe('findOne', () => {
    it('should find one order item', async () => {
      const result = await service.findOne('item-id');
      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: 'item-id' });
      expect(result).toEqual(mockOrderItem);
    });
  });

  describe('remove', () => {
    it('should remove an order item', async () => {
      const result = await service.remove('item-id');
      expect(mockRepository.delete).toHaveBeenCalledWith('item-id');
      expect(result.affected).toBe(1);
    });
  });
});
