import { Test, TestingModule } from '@nestjs/testing';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';

describe('CategoryController', () => {
  let controller: CategoryController;
  let service: CategoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoryController],
      providers: [
        {
          provide: CategoryService,
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<CategoryController>(CategoryController);
    service = module.get<CategoryService>(CategoryService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a category', async () => {
      const dto = { name: 'Test' };
      const mockResult = { id: '1', ...dto };
      jest.spyOn(service, 'create').mockResolvedValue(mockResult as any);
      expect(await controller.create(dto as any)).toEqual(mockResult);
    });
  });

  describe('findAll', () => {
    it('should return all categories', async () => {
      const mockResult = [{ id: '1', name: 'Test' }];
      jest.spyOn(service, 'findAll').mockResolvedValue(mockResult as any);
      expect(await controller.findAll()).toEqual(mockResult);
    });
  });

  describe('findOne', () => {
    it('should return one category', async () => {
      const mockResult = { id: '1', name: 'Test' };
      jest.spyOn(service, 'findOne').mockResolvedValue(mockResult as any);
      expect(await controller.findOne('1')).toEqual(mockResult);
    });
  });

  describe('update', () => {
    it('should update a category', async () => {
      const dto = { name: 'Updated' };
      const mockResult = { id: '1', ...dto };
      jest.spyOn(service, 'update').mockResolvedValue(mockResult as any);
      expect(await controller.update('1', dto as any)).toEqual(mockResult);
    });
  });

  describe('remove', () => {
    it('should remove a category', async () => {
      jest.spyOn(service, 'remove').mockResolvedValue(undefined);
      expect(await controller.remove('1')).toBeUndefined();
    });
  });
});
