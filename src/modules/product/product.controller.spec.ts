import { Test, TestingModule } from '@nestjs/testing';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { ProductStatus } from './entities/product.entity';

describe('ProductController', () => {
  let controller: ProductController;
  let service: ProductService;

  const mockProduct = { id: 'product-id', name: 'Test Product', sku: 'TEST-SKU' };

  const mockProductService = {
    create: jest.fn().mockResolvedValue(mockProduct),
    findAll: jest.fn().mockResolvedValue({ results: [mockProduct], total: 1 }),
    findOne: jest.fn().mockResolvedValue(mockProduct),
    update: jest.fn().mockResolvedValue({ ...mockProduct, name: 'Updated' }),
    remove: jest.fn().mockResolvedValue(undefined),
    updateStock: jest.fn().mockResolvedValue({ ...mockProduct, stockQuantity: 50 }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductController],
      providers: [{ provide: ProductService, useValue: mockProductService }],
    }).compile();

    controller = module.get<ProductController>(ProductController);
    service = module.get<ProductService>(ProductService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a product', async () => {
      const dto = { name: 'Test', sku: 'TEST', description: 'desc', price: 100, stockQuantity: 10, status: ProductStatus.ACTIVE };
      const result = await controller.create(dto);
      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockProduct);
    });
  });

  describe('findAll', () => {
    it('should get all products', async () => {
      const result = await controller.findAll({ limit: 10, offset: 0 });
      expect(service.findAll).toHaveBeenCalledWith({ limit: 10, offset: 0 });
      expect(result.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should get a single product', async () => {
      const result = await controller.findOne('product-id');
      expect(service.findOne).toHaveBeenCalledWith('product-id');
      expect(result).toEqual(mockProduct);
    });
  });

  describe('update', () => {
    it('should update a product', async () => {
      const dto = { name: 'Updated' };
      const result = await controller.update('product-id', dto);
      expect(service.update).toHaveBeenCalledWith('product-id', dto);
      expect(result.name).toBe('Updated');
    });
  });

  describe('remove', () => {
    it('should remove a product', async () => {
      await controller.remove('product-id');
      expect(service.remove).toHaveBeenCalledWith('product-id');
    });
  });

  describe('updateStock', () => {
    it('should update stock of a product', async () => {
      const result = await controller.updateStock('product-id', { quantity: 50 });
      expect(service.updateStock).toHaveBeenCalledWith('product-id', { quantity: 50 });
      expect(result.stockQuantity).toBe(50);
    });
  });
});
