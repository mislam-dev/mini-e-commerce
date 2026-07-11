import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { type Cache } from 'cache-manager';
import { PaginationDto } from 'src/common/pagination/pagination.dto';
import { Repository } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateStockDto } from './dto/update-stock.dto';
import { Product } from './entities/product.entity';

const PRODUCT_KEY = 'products';
const PRODUCT_TTL = 60 * 60 * 1000; // 1 hour

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const product = this.productRepository.create(createProductDto);
    await this.cacheManager.del(PRODUCT_KEY);
    return this.productRepository.save(product);
  }

  async findAll(pagination: PaginationDto): Promise<{
    results: Product[];
    total: number;
    limit: number;
    offset: number;
  }> {
    const cache: any = await this.cacheManager.get(PRODUCT_KEY);
    if (cache) {
      return cache;
    }
    const { limit = 10, offset = 0 } = pagination;
    const [results, total] = await this.productRepository.findAndCount({
      take: limit,
      skip: offset,
    });
    const data = { results, total, limit, offset };
    await this.cacheManager.set(PRODUCT_KEY, data, PRODUCT_TTL);
    return data;
  }

  async findOne(id: string): Promise<Product> {
    const cache = await this.cacheManager.get(this.singleProductKey(id));
    if (cache) {
      return cache as Product;
    }
    const product = await this.productRepository.findOneBy({ id });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    await this.cacheManager.set(
      this.singleProductKey(id),
      product,
      PRODUCT_TTL,
    );
    return product;
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const product = await this.findOne(id);
    Object.assign(product, updateProductDto);
    const d = await this.productRepository.save(product);

    await this.cacheManager.del(this.singleProductKey(id));
    await this.cacheManager.del(PRODUCT_KEY);

    return d;
  }

  async remove(id: string): Promise<void> {
    const result = await this.productRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    await this.cacheManager.del(this.singleProductKey(id));
    await this.cacheManager.del(PRODUCT_KEY);
  }

  async updateStock(
    id: string,
    updateStockDto: UpdateStockDto,
  ): Promise<Product> {
    const product = await this.findOne(id);
    product.stockQuantity = updateStockDto.quantity;
    const data = this.productRepository.save(product);

    await this.cacheManager.del(this.singleProductKey(id));
    await this.cacheManager.del(PRODUCT_KEY);

    return data;
  }
  private singleProductKey(id: string) {
    return `products:${id}`;
  }
}
