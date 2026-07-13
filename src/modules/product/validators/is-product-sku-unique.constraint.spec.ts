import { Test, TestingModule } from '@nestjs/testing';
import { IsProductSkuUniqueConstraint } from './is-product-sku-unique.constraint';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Product } from '../entities/product.entity';
import { Repository } from 'typeorm';

describe('IsProductSkuUniqueConstraint', () => {
  let constraint: IsProductSkuUniqueConstraint;
  let repository: Repository<Product>;

  const mockRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IsProductSkuUniqueConstraint,
        { provide: getRepositoryToken(Product), useValue: mockRepository },
      ],
    }).compile();

    constraint = module.get<IsProductSkuUniqueConstraint>(IsProductSkuUniqueConstraint);
    repository = module.get<Repository<Product>>(getRepositoryToken(Product));
    jest.clearAllMocks();
  });

  it('should return true if sku is empty', async () => {
    expect(await constraint.validate('')).toBe(true);
  });

  it('should return false if product with sku already exists', async () => {
    mockRepository.findOne.mockResolvedValue({ id: 'existing-id' });
    expect(await constraint.validate('EXISTING-SKU')).toBe(false);
  });

  it('should return true if product with sku does not exist', async () => {
    mockRepository.findOne.mockResolvedValue(null);
    expect(await constraint.validate('NEW-SKU')).toBe(true);
  });

  it('should have a default message', () => {
    expect(constraint.defaultMessage({} as any)).toBe('Product with this code already exists');
  });
});
