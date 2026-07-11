import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { type Cache } from 'cache-manager';
import { Repository } from 'typeorm';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './entities/category.entity';

const CACHE_KEY = 'CATEGORY_TREE';
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const category = this.categoryRepository.create(createCategoryDto);
    await this.cacheManager.del(CACHE_KEY);
    return await this.categoryRepository.save(category);
  }

  async findAll() {
    const cachedCategories = await this.cacheManager.get<any[]>(CACHE_KEY);

    if (cachedCategories) {
      return cachedCategories;
    }

    const categories = await this.categoryRepository.find();
    const tree = this.buildTree(categories);
    await this.cacheManager.set(CACHE_KEY, tree, CACHE_TTL);

    return tree;
  }

  private buildTree(
    categories: Category[],
    parentId: string | null = null,
  ): any[] {
    return categories
      .filter((category) => category.parentId === parentId)
      .map((category) => ({
        ...category,
        children: this.buildTree(categories, category.id),
      }));
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoryRepository.findOneBy({ id });
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return category;
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    const category = await this.findOne(id);
    Object.assign(category, updateCategoryDto);
    await this.cacheManager.del(CACHE_KEY);
    return await this.categoryRepository.save(category);
  }

  async remove(id: string): Promise<void> {
    const result = await this.categoryRepository.delete(id);
    await this.cacheManager.del(CACHE_KEY);
    if (result.affected === 0) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
  }
}
