import { IsEnum, IsNumber, IsString, Min } from 'class-validator';

import { IsProductSkuUnique } from '../decorators/is-product-sku-unique.decorator';
import { ProductStatus } from '../entities/product.entity';

export class CreateProductDto {
  @IsProductSkuUnique()
  @IsString()
  sku: string;

  @IsEnum(ProductStatus)
  status: ProductStatus;

  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @Min(0)
  stockQuantity: number;
}
