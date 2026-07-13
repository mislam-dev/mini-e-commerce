import { Test, TestingModule } from '@nestjs/testing';
import { IsCategoryExistsConstraint } from './is-category-exists.constraint';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Category } from '../entities/category.entity';

describe('IsCategoryExistsConstraint', () => {
  let constraint: IsCategoryExistsConstraint;
  let categoryRepository: any;

  beforeEach(async () => {
    categoryRepository = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IsCategoryExistsConstraint,
        {
          provide: getRepositoryToken(Category),
          useValue: categoryRepository,
        },
      ],
    }).compile();

    constraint = module.get<IsCategoryExistsConstraint>(IsCategoryExistsConstraint);
  });

  it('should be defined', () => {
    expect(constraint).toBeDefined();
  });

  describe('validate', () => {
    it('should return true if no categoryId provided', async () => {
      expect(await constraint.validate('')).toBe(true);
    });

    it('should return true if category exists', async () => {
      categoryRepository.findOne.mockResolvedValue({ id: '1' });
      expect(await constraint.validate('1')).toBe(true);
    });

    it('should return false if category does not exist', async () => {
      categoryRepository.findOne.mockResolvedValue(null);
      expect(await constraint.validate('1')).toBe(false);
    });
  });

  describe('defaultMessage', () => {
    it('should return error message', () => {
      expect(constraint.defaultMessage()).toBe('Category with this id does not exist');
    });
  });
});
