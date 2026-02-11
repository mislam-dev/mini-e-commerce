import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PaginationDto } from 'src/common/pagination/pagination.dto';
import { Public } from 'src/core/auth/decorators/public.decorator';
import { SetRoles } from '../../core/auth/decorators/set-roles.decorator';
import { JwtGuard } from '../../core/auth/guards/jwt.guard';
import { } from '../../core/auth/guards/roles.guard';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateStockDto } from './dto/update-stock.dto';
import { ProductService } from './product.service';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @UseGuards(JwtGuard)
  @SetRoles('admin')
  create(@Body() createProductDto: CreateProductDto) {
    return this.productService.create(createProductDto);
  }

  @Public()
  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.productService.findAll(paginationDto);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.productService.findOne(id);
  }

  @Put(':id')
  @SetRoles('admin')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productService.update(id, updateProductDto);
  }

  @Delete(':id')
  @HttpCode(204)
  @UseGuards(JwtGuard)
  @SetRoles('admin')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.productService.remove(id);
  }

  @Patch(':id/stock')
  @UseGuards(JwtGuard)
  @SetRoles('admin')
  updateStock(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStockDto: UpdateStockDto,
  ) {
    return this.productService.updateStock(id, updateStockDto);
  }
}
