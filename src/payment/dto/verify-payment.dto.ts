import { IsString, IsNotEmpty } from 'class-validator';

export class VerifyPaymentDTO {
  @IsString()
  @IsNotEmpty()
  reference: string;
}
