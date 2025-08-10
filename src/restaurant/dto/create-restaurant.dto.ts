import { Type } from 'class-transformer';
import {
  IsString,
  IsArray,
  IsNumber,
  IsBoolean,
  ValidateNested,
  IsOptional,
  IsEmail,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LocationDto } from 'src/profile/dto/create-profile.dto';

export class OpeningHoursDto {
  @ApiProperty({
    description: 'Opening time in HH:MM format',
    example: '09:00',
    pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
  })
  @IsString()
  open: string;

  @ApiProperty({
    description: 'Closing time in HH:MM format',
    example: '22:00',
    pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
  })
  @IsString()
  close: string;

  @ApiPropertyOptional({
    description: 'Whether the restaurant is closed on this day',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  closed?: boolean;
}

export class RestaurantHoursDto {
  @ApiProperty({ type: OpeningHoursDto, description: 'Monday opening hours' })
  @ValidateNested()
  @Type(() => OpeningHoursDto)
  monday: OpeningHoursDto;

  @ApiProperty({ type: OpeningHoursDto, description: 'Tuesday opening hours' })
  @ValidateNested()
  @Type(() => OpeningHoursDto)
  tuesday: OpeningHoursDto;

  @ApiProperty({
    type: OpeningHoursDto,
    description: 'Wednesday opening hours',
  })
  @ValidateNested()
  @Type(() => OpeningHoursDto)
  wednesday: OpeningHoursDto;

  @ApiProperty({ type: OpeningHoursDto, description: 'Thursday opening hours' })
  @ValidateNested()
  @Type(() => OpeningHoursDto)
  thursday: OpeningHoursDto;

  @ApiProperty({ type: OpeningHoursDto, description: 'Friday opening hours' })
  @ValidateNested()
  @Type(() => OpeningHoursDto)
  friday: OpeningHoursDto;

  @ApiProperty({ type: OpeningHoursDto, description: 'Saturday opening hours' })
  @ValidateNested()
  @Type(() => OpeningHoursDto)
  saturday: OpeningHoursDto;

  @ApiProperty({ type: OpeningHoursDto, description: 'Sunday opening hours' })
  @ValidateNested()
  @Type(() => OpeningHoursDto)
  sunday: OpeningHoursDto;
}

export class CreateRestaurantDto {
  @ApiProperty({
    description: 'Restaurant name',
    example: 'Bella Vista Italian Restaurant',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Restaurant description',
    example:
      'Authentic Italian cuisine with a romantic atmosphere perfect for dining experiences',
    minLength: 10,
    maxLength: 500,
  })
  @IsString()
  description: string;

  @ApiPropertyOptional({
    description: 'Array of restaurant image URLs',
    example: [
      'https://example.com/restaurant1.jpg',
      'https://example.com/restaurant2.jpg',
    ],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @ApiProperty({
    description: 'Restaurant location coordinates and address',
    type: LocationDto,
  })
  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;

  @ApiProperty({
    description: 'Array of cuisine types offered',
    example: ['Italian', 'Mediterranean', 'European'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  cuisine_types: string[];

  @ApiProperty({
    description: 'Price range from 1 (cheapest) to 5 (most expensive)',
    example: 3,
    minimum: 1,
    maximum: 5,
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  price_range: number;

  @ApiProperty({
    description: 'Restaurant phone number',
    example: '+234901234567',
  })
  @IsString()
  phone_number: string;

  @ApiPropertyOptional({
    description: 'Restaurant email address',
    example: 'info@bellavista.com',
    format: 'email',
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    description: 'Restaurant website URL',
    example: 'https://bellavista.com',
  })
  @IsString()
  @IsOptional()
  website?: string;

  @ApiProperty({
    description: 'Restaurant opening hours for all days of the week',
    type: RestaurantHoursDto,
  })
  @ValidateNested()
  @Type(() => RestaurantHoursDto)
  opening_hours: RestaurantHoursDto;

  @ApiPropertyOptional({
    description: 'Average rating of the restaurant (0-5)',
    example: 4.5,
    minimum: 0,
    maximum: 5,
  })
  @IsNumber()
  @Min(0)
  @Max(5)
  @IsOptional()
  average_rating?: number;

  @ApiPropertyOptional({
    description: 'Total number of reviews',
    example: 127,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  total_reviews?: number;

  @ApiPropertyOptional({
    description: 'Whether the restaurant is active',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @ApiPropertyOptional({
    description: 'Whether the restaurant accepts reservations',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  accepts_reservations?: boolean;

  @ApiPropertyOptional({
    description: 'Platform discount percentage (default: 10%)',
    example: 10,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  platform_discount_percentage?: number;

  @ApiPropertyOptional({
    description: 'Platform commission percentage (default: 5%)',
    example: 5,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  platform_commission_percentage?: number;

  @ApiPropertyOptional({
    description: 'Diner discount percentage (default: 5%)',
    example: 5,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  diner_discount_percentage?: number;

  @ApiPropertyOptional({
    description: 'Restaurant amenities',
    example: ['WiFi', 'Parking', 'Outdoor Seating', 'Live Music'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  amenities?: string[];

  @ApiPropertyOptional({
    description: 'Google Places ID for integration',
    example: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
  })
  @IsString()
  @IsOptional()
  google_place_id?: string;

  @ApiPropertyOptional({
    description: 'Whether the restaurant is a platform partner',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  is_partner?: boolean;
}
