import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductService } from '../product/product.service';
import { CreateCartDto } from './dto/create-cart.dto';
import { Cart } from './entities/cart.entity';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
    private readonly productService: ProductService,
  ) {}

  async create(userId: string, createCartDto: CreateCartDto) {
    const { productId, quantity } = createCartDto;

    // Check product
    const product = await this.productService.findOne(productId);
    if (product.stockQuantity < quantity) {
      throw new BadRequestException('Insufficient stock');
    }

    // Check if item already exists in cart
    const existingCartItem = await this.cartRepository.findOne({
      where: { userId, productId },
    });

    if (existingCartItem) {
      // Update quantity
      const newQuantity = existingCartItem.quantity + quantity;
      if (product.stockQuantity < newQuantity) {
        throw new BadRequestException(
          'Insufficient stock for updated quantity',
        );
      }
      existingCartItem.quantity = newQuantity;
      return this.cartRepository.save(existingCartItem);
    }

    // Create new item
    const cartItem = this.cartRepository.create({
      userId,
      productId,
      quantity,
    });

    return this.cartRepository.save(cartItem);
  }

  async findAll(userId: string) {
    return this.cartRepository.find({
      where: { userId },
      relations: ['product'],
      order: { createdAt: 'DESC' },
    });
  }

  async remove(userId: string, productId: string) {
    const result = await this.cartRepository.delete({
      userId,
      productId,
    });

    if (result.affected === 0) {
      throw new NotFoundException('Item not found in cart');
    }
    return { message: 'Item removed from cart' };
  }
  async findOne(userId: string, productId: string) {
    const result = await this.cartRepository.findOne({
      where: { userId, productId },
      relations: ['product'],
    });
    if (!result) {
      throw new NotFoundException('Item not found in cart');
    }
    return result;
  }
}
