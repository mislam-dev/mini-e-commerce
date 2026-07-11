import { IsNotEmpty, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { IsCategoryExists } from '../decorators/is-category-exists.decorator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  name: string;

  @IsOptional()
  @IsUUID()
  @IsCategoryExists()
  parentId?: string;
}
