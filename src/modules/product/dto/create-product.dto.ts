import { IsInt, IsNumber, IsString, Min } from 'class-validator';

import { IsProductCodeUnique } from '../decorators/is-product-code-unique.decorator';

export class CreateProductDto {
  @IsProductCodeUnique()
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsInt()
  @Min(0)
  stockQuantity: number;
}
