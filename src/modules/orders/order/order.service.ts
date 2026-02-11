import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CartService } from 'src/modules/cart/cart.service';
import { DataSource, Repository } from 'typeorm';
import { PaginationDto } from '../../../common/pagination/pagination.dto';
import { User } from '../../../core/user/entities/user.entity';
import { Cart } from '../../cart/entities/cart.entity';
import { Product } from '../../product/entities/product.entity';
import { OrderItem } from '../order-item/entities/order-item.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Order, OrderStatus } from './entities/order.entity';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly dataSource: DataSource,
    private readonly cartService: CartService,
  ) {}

  async create(userId: string, createOrderDto: CreateOrderDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const cartItems = await this.cartService.findAll(userId);

      if (!cartItems.length) {
        throw new BadRequestException('Cart is empty');
      }

      let totalAmount = 0;
      const orderItems: OrderItem[] = [];

      for (const item of cartItems) {
        if (item.product.stockQuantity < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for product ${item.product.name}`,
          );
        }

        totalAmount += item.product.price * item.quantity;

        // Decrease Stock
        item.product.stockQuantity -= item.quantity;
        await queryRunner.manager.save(Product, item.product);

        // Create Order Item
        const orderItem = new OrderItem();
        orderItem.product = item.product;
        orderItem.quantity = item.quantity;
        orderItem.priceAtPurchase = item.product.price;
        orderItems.push(orderItem);
      }

      const order = new Order();
      order.userId = userId;
      order.totalAmount = totalAmount;
      order.status = OrderStatus.PENDING;
      order.items = orderItems;

      const savedOrder = await queryRunner.manager.save(Order, order);

      await queryRunner.manager.remove(Cart, cartItems);
      await queryRunner.commitTransaction();

      return savedOrder;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(pagination: PaginationDto) {
    const { limit = 10, offset = 0 } = pagination;
    const [results, total] = await this.orderRepository.findAndCount({
      relations: ['items', 'items.product'],
      take: limit,
      skip: offset,
      order: { createdAt: 'DESC' },
    });
    return { results, total, limit, offset };
  }

  async findMyOrders(user: User, pagination: PaginationDto) {
    const { limit = 10, offset = 0 } = pagination;
    const [results, total] = await this.orderRepository.findAndCount({
      where: { userId: user.id },
      relations: ['items', 'items.product'],
      take: limit,
      skip: offset,
      order: { createdAt: 'DESC' },
    });
    return { results, total, limit, offset };
  }

  async findOne(id: string) {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['items', 'items.product'],
    });
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
    return order;
  }

  async updateStatus(id: string, status: OrderStatus) {
    const order = await this.findOne(id);
    order.status = status;
    return this.orderRepository.save(order);
  }

  // kept for compatibility if needed, but likely unused given specific requirements
  async update(id: string, updateOrderDto: UpdateOrderDto) {
    const order = await this.findOne(id);
    // Apply updates if any relevant fields in dto
    return this.orderRepository.save(order);
  }

  async remove(id: string) {
    const result = await this.orderRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
    return result;
  }
}
