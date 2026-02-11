import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginationDto } from 'src/common/pagination/pagination.dto';
import { Repository } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateStockDto } from './dto/update-stock.dto';
import { Product } from './entities/product.entity';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const product = this.productRepository.create(createProductDto);
    return this.productRepository.save(product);
  }

  async findAll(pagination: PaginationDto): Promise<{
    results: Product[];
    total: number;
    limit: number;
    offset: number;
  }> {
    const { limit = 10, offset = 0 } = pagination;
    const [results, total] = await this.productRepository.findAndCount({
      take: limit,
      skip: offset,
    });
    return { results, total, limit, offset };
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOneBy({ id });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const product = await this.findOne(id);
    Object.assign(product, updateProductDto);
    return this.productRepository.save(product);
  }

  async remove(id: string): Promise<void> {
    const result = await this.productRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
  }

  async updateStock(
    id: string,
    updateStockDto: UpdateStockDto,
  ): Promise<Product> {
    const product = await this.findOne(id);
    product.stockQuantity = updateStockDto.quantity;
    return this.productRepository.save(product);
  }
}
