import { IsEnum, IsUUID } from 'class-validator';
import { PaymentType } from '@prisma/client';

export class CreatePaymentIntentDto {
  @IsUUID()
  booking_id: string;

  @IsEnum(PaymentType)
  payment_type: PaymentType;
}
