import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/pagination/pagination.dto';
import { SetRoles } from '../../../core/auth/decorators/set-roles.decorator';
import type { UserPayload } from '../../../core/auth/decorators/user.decorator';
import { User as CurrentUser } from '../../../core/auth/decorators/user.decorator';
import { User, UserRole } from '../../../core/user/entities/user.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderService } from './order.service';

@ApiTags('Order')
@ApiBearerAuth()
@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @SetRoles(UserRole.CUSTOMER)
  create(
    @CurrentUser() user: UserPayload,
    @Body() createOrderDto: CreateOrderDto,
  ) {
    return this.orderService.create(user.sub, createOrderDto);
  }

  @Get()
  @SetRoles(UserRole.ADMIN)
  findAll(@Query() pagination: PaginationDto) {
    return this.orderService.findAll(pagination);
  }

  @Get('my')
  @SetRoles(UserRole.CUSTOMER)
  findMyOrders(
    @CurrentUser() user: UserPayload,
    @Query() pagination: PaginationDto,
  ) {
    return this.orderService.findMyOrders({ id: user.sub } as User, pagination);
  }

  @Get(':id')
  @SetRoles(UserRole.ADMIN, UserRole.CUSTOMER)
  async findOne(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    const order = await this.orderService.findOne(id);

    // assuming admin can access any, Customer only their own
    if (order.user && order.user.id !== user.sub) {
      if (
        (user['role'] as UserRole) !== UserRole.ADMIN &&
        order.user.id !== user.sub
      ) {
        throw new ForbiddenException('You are not allowed to view this order');
      }
    }

    return order;
  }

  @Patch(':id/status')
  @SetRoles(UserRole.ADMIN)
  updateStatus(
    @Param('id') id: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
  ) {
    return this.orderService.updateStatus(id, updateOrderStatusDto.status);
  }
}
