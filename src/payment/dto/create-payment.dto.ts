import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreatePaymentDTO {
  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  userID: string;

  @IsNumber()
  @IsNotEmpty()
  amount: number;
}
