import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsDate,
  IsEnum,
  IsArray,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InvitationType } from '../schema/personal-dining.schema';

export class CreatePersonalDiningDto {
  @ApiProperty({
    description:
      'Host profile ID (person creating the personal dining experience)',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  host_id: string;

  @ApiPropertyOptional({
    description:
      'Guest profile ID for direct invitations (leave empty for open invitations)',
    example: '507f1f77bcf86cd799439012',
  })
  @IsString()
  @IsOptional()
  guest_id?: string;

  @ApiProperty({
    description: 'Restaurant ID where the personal dining will take place',
    example: '507f1f77bcf86cd799439013',
  })
  @IsString()
  restaurant_id: string;

  @ApiProperty({
    description: 'Title of the personal dining experience',
    example: 'Romantic Italian Dinner for Two',
    minLength: 5,
    maxLength: 100,
  })
  @IsString()
  title: string;

  @ApiProperty({
    description:
      'Description of what to expect from this personal dining experience',
    example:
      'Looking for someone to share a lovely Italian dinner with great conversation',
    minLength: 10,
    maxLength: 500,
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Date of the personal dining experience',
    example: '2025-01-15T00:00:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  @IsDate()
  @Type(() => Date)
  dining_date: Date;

  @ApiProperty({
    description: 'Time of dining in HH:MM format (24-hour)',
    example: '19:30',
    pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
  })
  @IsString()
  dining_time: string;

  @ApiProperty({
    description:
      'Estimated duration of the personal dining experience in minutes',
    example: 120,
    minimum: 30,
    maximum: 300,
  })
  @IsNumber()
  @Min(30)
  @Max(300)
  estimated_duration: number;

  @ApiPropertyOptional({
    description:
      'Any special requests (dietary restrictions, celebrations, etc.)',
    example: 'Vegetarian menu preferred, window seat if possible',
  })
  @IsString()
  @IsOptional()
  special_requests?: string;

  @ApiPropertyOptional({
    description: 'Type of invitation',
    enum: InvitationType,
    example: InvitationType.OPEN,
  })
  @IsEnum(InvitationType)
  @IsOptional()
  invitation_type?: InvitationType;

  @ApiPropertyOptional({
    description: 'Personal message for the invitation',
    example: 'Would love to meet someone new over great food!',
  })
  @IsString()
  @IsOptional()
  invitation_message?: string;

  @ApiProperty({
    description: 'Estimated cost per person in local currency (e.g., Naira)',
    example: 15000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  estimated_cost_per_person: number;

  @ApiPropertyOptional({
    description: 'Whether the host will pay for the entire bill',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  host_pays_all?: boolean;

  @ApiPropertyOptional({
    description: 'Tags to categorize the personal dining experience',
    example: ['romantic', 'business', 'casual', 'first-date'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Whether this experience should be visible on the map',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  is_visible_on_map?: boolean;

  @ApiPropertyOptional({
    description:
      'Whether this is a public dining experience (visible to others for join requests)',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  is_public?: boolean;
}
