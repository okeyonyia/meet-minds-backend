import { Type } from 'class-transformer';
import {
  IsArray,
  ValidateNested,
  ArrayMaxSize,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreateRestaurantDto } from './create-restaurant.dto';

export class BulkCreateRestaurantDto {
  @ApiProperty({
    description:
      'Array of restaurants to create (maximum 100 restaurants at once)',
    type: [CreateRestaurantDto],
    minItems: 1,
    maxItems: 100,
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one restaurant is required' })
  @ArrayMaxSize(100, {
    message: 'Maximum 100 restaurants can be created at once',
  })
  @ValidateNested({ each: true })
  @Type(() => CreateRestaurantDto)
  restaurants: CreateRestaurantDto[];
}
