import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import type { UserPayload } from '../../core/auth/decorators/user.decorator';
import { User as CurrentUser } from '../../core/auth/decorators/user.decorator';
import { CartService } from './cart.service';
import { CreateCartDto } from './dto/create-cart.dto';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post()
  create(
    @CurrentUser() user: UserPayload,
    @Body() createCartDto: CreateCartDto,
  ) {
    return this.cartService.create(user.sub, createCartDto);
  }

  @Get()
  findAll(@CurrentUser() user: UserPayload) {
    return this.cartService.findAll(user.sub);
  }

  @Delete(':productId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser() user: UserPayload,
    @Param('productId') productId: string,
  ) {
    return this.cartService.remove(user.sub, productId);
  }
}
