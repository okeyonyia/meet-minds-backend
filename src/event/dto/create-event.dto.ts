import { Type } from 'class-transformer';
import {
  IsString,
  IsDate,
  IsNumber,
  IsBoolean,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { LocationDto } from 'src/profile/dto/create-profile.dto';

export class CreateEventDto {
  @IsString()
  host_id: string;

  @IsString()
  event_type: string;

  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsDate()
  start_date: Date;

  @IsDate()
  end_date: Date;

  @ValidateNested()
  @Type(() => LocationDto)
  @IsOptional()
  location?: LocationDto;

  @IsString()
  cover_picture: string;

  @IsNumber()
  ticket_price: number;

  @IsNumber()
  no_of_attendees: number;

  @IsBoolean()
  is_public: boolean;
}
