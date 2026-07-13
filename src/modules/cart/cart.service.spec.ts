import { Test, TestingModule } from '@nestjs/testing';
import { CartService } from './cart.service';
import { ProductService } from '../product/product.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Cart } from './entities/cart.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';

describe('CartService', () => {
  let service: CartService;
  let repository: Repository<Cart>;
  let productService: ProductService;

  const mockCartItem = { id: 'cart-id', userId: 'user-id', productId: 'product-id', quantity: 2 };
  const mockProduct = { id: 'product-id', stockQuantity: 10 };

  const mockCartRepository = {
    create: jest.fn().mockReturnValue(mockCartItem),
    save: jest.fn().mockResolvedValue(mockCartItem),
    findOne: jest.fn(),
    find: jest.fn().mockResolvedValue([mockCartItem]),
    delete: jest.fn(),
  };

  const mockProductService = {
    findOne: jest.fn().mockResolvedValue(mockProduct),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        { provide: getRepositoryToken(Cart), useValue: mockCartRepository },
        { provide: ProductService, useValue: mockProductService },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
    repository = module.get<Repository<Cart>>(getRepositoryToken(Cart));
    productService = module.get<ProductService>(ProductService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new cart item', async () => {
      mockProductService.findOne.mockResolvedValue({ id: 'product-id', stockQuantity: 10 });
      mockCartRepository.findOne.mockResolvedValue(null);

      const result = await service.create('user-id', { productId: 'product-id', quantity: 2 });
      expect(mockCartRepository.create).toHaveBeenCalledWith({ userId: 'user-id', productId: 'product-id', quantity: 2 });
      expect(mockCartRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockCartItem);
    });

    it('should throw exception if insufficient stock', async () => {
      mockProductService.findOne.mockResolvedValue({ id: 'product-id', stockQuantity: 1 });
      await expect(service.create('user-id', { productId: 'product-id', quantity: 2 })).rejects.toThrow(BadRequestException);
    });

    it('should update quantity if item already in cart', async () => {
      mockProductService.findOne.mockResolvedValue({ id: 'product-id', stockQuantity: 10 });
      mockCartRepository.findOne.mockResolvedValue({ ...mockCartItem, quantity: 2 });
      mockCartRepository.save.mockResolvedValue({ ...mockCartItem, quantity: 4 });

      const result = await service.create('user-id', { productId: 'product-id', quantity: 2 });
      expect(result.quantity).toBe(4);
    });

    it('should throw exception if updating quantity exceeds stock', async () => {
      mockProductService.findOne.mockResolvedValue({ id: 'product-id', stockQuantity: 3 });
      mockCartRepository.findOne.mockResolvedValue({ ...mockCartItem, quantity: 2 });
      
      await expect(service.create('user-id', { productId: 'product-id', quantity: 2 })).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should find all cart items for a user', async () => {
      const result = await service.findAll('user-id');
      expect(mockCartRepository.find).toHaveBeenCalledWith({ where: { userId: 'user-id' }, relations: ['product'], order: { createdAt: 'DESC' } });
      expect(result).toEqual([mockCartItem]);
    });
  });

  describe('findOne', () => {
    it('should find one cart item', async () => {
      mockCartRepository.findOne.mockResolvedValue(mockCartItem);
      const result = await service.findOne('user-id', 'product-id');
      expect(result).toEqual(mockCartItem);
    });

    it('should throw if not found', async () => {
      mockCartRepository.findOne.mockResolvedValue(null);
      await expect(service.findOne('user-id', 'product-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a cart item', async () => {
      mockCartRepository.delete.mockResolvedValue({ affected: 1 });
      const result = await service.remove('user-id', 'product-id');
      expect(result).toEqual({ message: 'Item removed from cart' });
    });

    it('should throw if delete fails', async () => {
      mockCartRepository.delete.mockResolvedValue({ affected: 0 });
      await expect(service.remove('user-id', 'product-id')).rejects.toThrow(NotFoundException);
    });
  });
});
