import { Test, TestingModule } from '@nestjs/testing';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';

describe('CartController', () => {
  let controller: CartController;
  let service: CartService;

  const mockCartItem = { id: 'cart-id', userId: 'user-id', productId: 'product-id', quantity: 2 };
  
  const mockCartService = {
    create: jest.fn().mockResolvedValue(mockCartItem),
    findAll: jest.fn().mockResolvedValue([mockCartItem]),
    remove: jest.fn().mockResolvedValue({ message: 'Item removed from cart' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CartController],
      providers: [{ provide: CartService, useValue: mockCartService }],
    }).compile();

    controller = module.get<CartController>(CartController);
    service = module.get<CartService>(CartService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a cart item', async () => {
      const dto = { productId: 'product-id', quantity: 2 };
      const req = { sub: 'user-id' } as any;
      const result = await controller.create(req, dto);
      expect(service.create).toHaveBeenCalledWith('user-id', dto);
      expect(result).toEqual(mockCartItem);
    });
  });

  describe('findAll', () => {
    it('should get all cart items', async () => {
      const req = { sub: 'user-id' } as any;
      const result = await controller.findAll(req);
      expect(service.findAll).toHaveBeenCalledWith('user-id');
      expect(result).toEqual([mockCartItem]);
    });
  });

  describe('remove', () => {
    it('should remove a cart item', async () => {
      const req = { sub: 'user-id' } as any;
      const result = await controller.remove(req, 'product-id');
      expect(service.remove).toHaveBeenCalledWith('user-id', 'product-id');
      expect(result).toEqual({ message: 'Item removed from cart' });
    });
  });
});
