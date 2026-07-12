import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoryService } from './category.service';
import { Category } from './entities/category.entity';

describe('CategoryService', () => {
  let service: CategoryService;
  let categoryRepository: Repository<Category>;
  let cacheManager: any;

  beforeEach(async () => {
    cacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryService,
        {
          provide: getRepositoryToken(Category),
          useValue: {
            find: jest.fn(),
            findOneBy: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: CACHE_MANAGER,
          useValue: cacheManager,
        },
      ],
    }).compile();

    service = module.get<CategoryService>(CategoryService);
    categoryRepository = module.get<Repository<Category>>(
      getRepositoryToken(Category),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll (DFS tree building)', () => {
    it('should build a nested tree structure correctly', async () => {
      const mockCategories: Category[] = [
        { id: '1', name: 'Electronics', parentId: null } as Category,
        { id: '2', name: 'Mobile Phones', parentId: '1' } as Category,
        { id: '3', name: 'Smartphones', parentId: '2' } as Category,
        { id: '4', name: 'Laptops', parentId: '1' } as Category,
        { id: '5', name: 'Clothing', parentId: null } as Category,
      ];

      jest.spyOn(categoryRepository, 'find').mockResolvedValue(mockCategories);
      // Ensure cache misses first
      cacheManager.get.mockResolvedValue(null);

      const result = await service.findAll();

      expect(cacheManager.get).toHaveBeenCalledWith('CATEGORY_TREE');
      expect(categoryRepository.find).toHaveBeenCalled();

      expect(result.length).toBe(2); // Electronics and Clothing

      const electronics = result.find((c) => c.name === 'Electronics');
      expect(electronics).toBeDefined();
      expect(electronics.children.length).toBe(2); // Mobile Phones, Laptops

      const mobilePhones = electronics.children.find(
        (c) => c.name === 'Mobile Phones',
      );
      expect(mobilePhones).toBeDefined();
      expect(mobilePhones.children.length).toBe(1); // Smartphones
      expect(mobilePhones.children[0].name).toBe('Smartphones');

      const clothing = result.find((c) => c.name === 'Clothing');
      expect(clothing.children.length).toBe(0);

      expect(cacheManager.set).toHaveBeenCalledWith(
        'CATEGORY_TREE',
        result,
        60 * 60 * 1000,
      );
    });

    it('should return cached tree if available', async () => {
      const cachedTree = [{ id: '1', name: 'Cached', children: [] }];
      cacheManager.get.mockResolvedValue(cachedTree);

      const result = await service.findAll();

      expect(cacheManager.get).toHaveBeenCalledWith('CATEGORY_TREE');
      expect(categoryRepository.find).not.toHaveBeenCalled();
      expect(result).toEqual(cachedTree);
    });
  });

  describe('create', () => {
    it('should invalidate cache when a new category is created', async () => {
      const createDto = { name: 'New Category' };
      const savedCategory = { id: '10', ...createDto };

      jest
        .spyOn(categoryRepository, 'create')
        .mockReturnValue(savedCategory as any);
      jest
        .spyOn(categoryRepository, 'save')
        .mockResolvedValue(savedCategory as any);

      const result = await service.create(createDto as any);

      expect(cacheManager.del).toHaveBeenCalledWith('CATEGORY_TREE');
      expect(categoryRepository.save).toHaveBeenCalledWith(savedCategory);
      expect(result).toEqual(savedCategory);
    });
  });
});
