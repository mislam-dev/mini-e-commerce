import { IsNotEmpty, IsString } from 'class-validator';

export class BkashCallbackDto {
  @IsNotEmpty()
  @IsString()
  paymentID: string;

  @IsNotEmpty()
  @IsString()
  status: string;
}
