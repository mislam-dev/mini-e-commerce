import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginationDto } from 'src/common/pagination/pagination.dto';
import { UserService } from 'src/core/user/user.service';
import { OrderService } from 'src/modules/orders/order/order.service';
import { Repository } from 'typeorm';
import { PaymentFactory } from '../payment.factory';
import { CreatePaymentApiDto } from './dto/create-payment-api.dto';
import { SslcommerzCallbackDto } from './dto/sslcommerz-callback.dto';
import { UpdatePaymentApiDto } from './dto/update-payment-api.dto';
import { Payment, PaymentStatus } from './entities/payment-api.entity';

@Injectable()
export class PaymentApiService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    private readonly paymentFactory: PaymentFactory,
    private readonly orderService: OrderService,
    private readonly userService: UserService,
  ) {}

  async create(createPaymentApiDto: CreatePaymentApiDto) {
    const { provider, orderId } = createPaymentApiDto;
    const order = await this.orderService.findOne(orderId);
    if (!order) {
      throw new NotFoundException(`Order with ID "${orderId}" not found`);
    }

    const user = await this.userService.findOne(order.userId);
    if (!user) {
      throw new NotFoundException(`User with ID "${order.userId}" not found`);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const strategy = this.paymentFactory.getStrategy(provider as any);
    const p = await strategy.init({
      total_amount: order.totalAmount,
      currency: 'BDT',
      cus_name: user.fullName,
      cus_email: user.email,
      cus_add1: 'NA',
      cus_phone: 'NA',
    });

    const payment = this.paymentRepository.create({
      provider,
      orderId,
      status: PaymentStatus.PENDING,
      transactionId: p.tran_id,
    });

    const paymentSaved = await this.paymentRepository.save(payment);

    return {
      url: p.url,
      tran_id: p.tran_id,
      payment: paymentSaved,
    };
  }

  async findAll(paginationDto: PaginationDto, orderId?: string) {
    const { limit = 10, offset = 0 } = paginationDto;
    const [results, total] = await this.paymentRepository.findAndCount({
      where: {
        orderId: orderId ? orderId : undefined,
      },
      take: limit,
      skip: offset,
      order: {
        createdAt: 'DESC',
      },
    });
    return { limit, offset, total, results };
  }

  async findOne(id: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({ where: { id } });
    if (!payment) {
      throw new NotFoundException(`Payment with ID "${id}" not found`);
    }
    return payment;
  }
  async findOneByTranId(tranId: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { transactionId: tranId },
    });
    if (!payment) {
      throw new NotFoundException(`Payment with ID "${tranId}" not found`);
    }
    return payment;
  }

  async update(
    id: string,
    updatePaymentApiDto: UpdatePaymentApiDto,
  ): Promise<Payment> {
    const payment = await this.findOne(id);
    Object.assign(payment, updatePaymentApiDto);
    return this.paymentRepository.save(payment);
  }

  async remove(id: string): Promise<void> {
    const result = await this.paymentRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Payment with ID "${id}" not found`);
    }
  }

  async handleCallback(
    provider: string,
    body:
      | SslcommerzCallbackDto
      | { rawBody: Buffer<ArrayBufferLike> | undefined; signature: string },
  ): Promise<{ url: string; tran_id: string }> {
    const strategy = this.paymentFactory.getStrategy(provider as any);
    return strategy.handleCallback(body, this);
  }
}
