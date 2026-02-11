import { PartialType } from '@nestjs/swagger';
import { CreatePaymentApiDto } from './create-payment-api.dto';

export class UpdatePaymentApiDto extends PartialType(CreatePaymentApiDto) {}
