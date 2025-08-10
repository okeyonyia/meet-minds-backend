import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ResponseType } from '../enums/personal-dinning.enum';

export class RespondToPersonalDiningDto {
  @ApiProperty({
    description: 'Guest user ID responding to the invitation',
    example: '507f1f77bcf86cd799439012',
  })
  @IsString()
  guest_id: string;

  @ApiProperty({
    description: 'Response to the personal dining invitation',
    enum: ResponseType,
    example: ResponseType.ACCEPT,
  })
  @IsEnum(ResponseType)
  response: ResponseType;

  @ApiPropertyOptional({
    description: 'Optional message when accepting or declining',
    example: 'Looking forward to meeting you!',
  })
  @IsString()
  @IsOptional()
  message?: string;
}

export class ReviewPersonalDiningDto {
  @ApiProperty({
    description: 'ID of user leaving the review (host or guest)',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  reviewer_id: string;

  @ApiProperty({
    description: 'Personal dining ID being reviewed',
    example: '507f1f77bcf86cd799439014',
  })
  @IsString()
  personal_dining_id: string;

  @ApiProperty({
    description: 'Rating for the personal dining experience (1-5)',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({
    description: 'Optional review comment',
    example: 'Had a wonderful time and great conversation!',
  })
  @IsString()
  @IsOptional()
  comment?: string;
}

export class CompletePersonalDiningDto {
  @ApiProperty({
    description: 'Personal dining ID being completed',
    example: '507f1f77bcf86cd799439014',
  })
  @IsString()
  personal_dining_id: string;

  @ApiProperty({
    description: 'Total bill amount in local currency (e.g., Naira)',
    example: 35000.0,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  total_bill_amount: number;

  @ApiPropertyOptional({
    description: 'Payment reference from payment processor',
    example: 'PAY_1234567890ABCDEF',
  })
  @IsString()
  @IsOptional()
  payment_reference?: string;
}

export { ResponseType };
