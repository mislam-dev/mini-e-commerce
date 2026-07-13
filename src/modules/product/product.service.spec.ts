import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { Product, ProductStatus } from './entities/product.entity';
import { ProductService } from './product.service';

describe('ProductService', () => {
  let service: ProductService;
  let cacheManager: any;

  const mockProduct = {
    id: 'product-id',
    name: 'Test Product',
    sku: 'TEST-SKU',
    description: 'Test description',
    price: 100,
    stockQuantity: 10,
    status: ProductStatus.ACTIVE,
    category: {
      id: 'category-id',
      name: 'Category',
    },
  };

  const mockRepository = {
    create: jest.fn().mockReturnValue(mockProduct),
    save: jest.fn().mockResolvedValue(mockProduct),
    findAndCount: jest.fn().mockResolvedValue([[mockProduct], 1]),
    findOneBy: jest.fn(),
    delete: jest.fn(),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        { provide: getRepositoryToken(Product), useValue: mockRepository },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
    cacheManager = module.get(CACHE_MANAGER);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a product and clear cache', async () => {
      const dto: CreateProductDto = {
        name: 'Test Product',
        sku: 'TEST-SKU',
        description: 'desc',
        price: 100,
        stockQuantity: 10,
        status: ProductStatus.ACTIVE,
        categoryId: 'category-id',
      };
      const result = await service.create(dto);
      expect(mockRepository.create).toHaveBeenCalledWith({
        ...dto,
        categoryId: 'category-id',
      });
      expect(mockCacheManager.del).toHaveBeenCalledWith('products');
      expect(mockRepository.save).toHaveBeenCalledWith(mockProduct);
      expect(result).toEqual(mockProduct);
    });
  });

  describe('findAll', () => {
    it('should return from cache if available', async () => {
      const cachedData = {
        results: [mockProduct],
        total: 1,
        limit: 10,
        offset: 0,
      };
      mockCacheManager.get.mockResolvedValue(cachedData);
      const result = await service.findAll({ limit: 10, offset: 0 });
      expect(result).toEqual(cachedData);
      expect(mockRepository.findAndCount).not.toHaveBeenCalled();
    });

    it('should query db and set cache if not in cache', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      const result = await service.findAll({ limit: 10, offset: 0 });
      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
      });
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'products',
        { results: [mockProduct], total: 1, limit: 10, offset: 0 },
        60 * 60 * 1000,
      );
      expect(result.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return from cache if available', async () => {
      mockCacheManager.get.mockResolvedValue(mockProduct);
      const result = await service.findOne('product-id');
      expect(result).toEqual(mockProduct);
      expect(mockRepository.findOneBy).not.toHaveBeenCalled();
    });

    it('should query db and set cache if not in cache', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockRepository.findOneBy.mockResolvedValue(mockProduct);
      const result = await service.findOne('product-id');
      expect(mockRepository.findOneBy).toHaveBeenCalledWith({
        id: 'product-id',
      });
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'products:product-id',
        mockProduct,
        60 * 60 * 1000,
      );
      expect(result).toEqual(mockProduct);
    });

    it('should throw exception if not found', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockRepository.findOneBy.mockResolvedValue(null);
      await expect(service.findOne('product-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a product and invalidate caches', async () => {
      jest
        .spyOn(service, 'findOne')
        .mockResolvedValue({ ...mockProduct } as any);
      mockRepository.save.mockResolvedValue({
        ...mockProduct,
        name: 'Updated',
      });

      const result = await service.update('product-id', { name: 'Updated' });
      expect(mockRepository.save).toHaveBeenCalled();
      expect(mockCacheManager.del).toHaveBeenCalledWith('products:product-id');
      expect(mockCacheManager.del).toHaveBeenCalledWith('products');
      expect(result.name).toBe('Updated');
    });
  });

  describe('remove', () => {
    it('should delete a product and invalidate caches', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 1 });
      await service.remove('product-id');
      expect(mockCacheManager.del).toHaveBeenCalledWith('products:product-id');
      expect(mockCacheManager.del).toHaveBeenCalledWith('products');
    });

    it('should throw exception if delete fails', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 0 });
      await expect(service.remove('product-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateStock', () => {
    it('should update stock and invalidate caches', async () => {
      jest
        .spyOn(service, 'findOne')
        .mockResolvedValue({ ...mockProduct } as any);
      mockRepository.save.mockResolvedValue({
        ...mockProduct,
        stockQuantity: 20,
      });

      const result = await service.updateStock('product-id', { quantity: 20 });
      expect(mockRepository.save).toHaveBeenCalled();
      expect(mockCacheManager.del).toHaveBeenCalledWith('products:product-id');
      expect(mockCacheManager.del).toHaveBeenCalledWith('products');
      expect(result.stockQuantity).toBe(20);
    });
  });
});
