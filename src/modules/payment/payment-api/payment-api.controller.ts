import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { PaginationDto } from 'src/common/pagination/pagination.dto';
import { Public } from 'src/core/auth/decorators/public.decorator';
import { SetRoles } from 'src/core/auth/decorators/set-roles.decorator';
import { UserRole } from 'src/core/user/entities/user.entity';
import { CreatePaymentApiDto } from './dto/create-payment-api.dto';
import { SslcommerzCallbackDto } from './dto/sslcommerz-callback.dto';
import { UpdatePaymentApiDto } from './dto/update-payment-api.dto';
import { PaymentApiService } from './payment-api.service';

@Controller('payment')
export class PaymentApiController {
  constructor(private readonly paymentApiService: PaymentApiService) {}

  @Post('initiate')
  create(@Body() createPaymentApiDto: CreatePaymentApiDto) {
    return this.paymentApiService.create(createPaymentApiDto);
  }

  @Get()
  async findAll(
    @Query() paginationDto: PaginationDto,
    @Query('orderId') orderId?: string,
  ) {
    const { results, total } = await this.paymentApiService.findAll(
      paginationDto,
      orderId,
    );
    return {
      results,
      total,
      limit: paginationDto.limit || 10,
      offset: paginationDto.offset || 0,
    };
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePaymentApiDto: UpdatePaymentApiDto,
  ) {
    return this.paymentApiService.update(id, updatePaymentApiDto);
  }

  @SetRoles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.paymentApiService.remove(id);
  }

  @Public()
  @Post('callback/sslcommerz/success')
  async sslSuccess(@Req() req: Request, @Res() res: Response) {
    const body = req.body as SslcommerzCallbackDto;
    const { url } = await this.paymentApiService.handleCallback(
      'sslcommerz',
      body,
    );
    res.redirect(url);
  }
  @Public()
  @Post('callback/sslcommerz/failure')
  async sslFail(@Req() req: Request, @Res() res: Response) {
    const body = req.body as SslcommerzCallbackDto;
    const { url } = await this.paymentApiService.handleCallback(
      'sslcommerz',
      body,
    );
    res.redirect(url);
  }
}
