import { Type } from 'class-transformer';
import {
  IsString,
  IsArray,
  IsEnum,
  IsDate,
  ArrayMinSize,
  IsPhoneNumber,
  ValidateNested,
  IsOptional,
  IsNumber,
} from 'class-validator';

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  NON_BINARY = 'nonbinary',
}

export class LocationDto {
  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsOptional()
  @IsString()
  address?: string;
}

export class CreateProfileDto {
  @IsString()
  user_id: string;

  @IsString()
  full_name: string;

  @IsPhoneNumber('NG', {
    message: 'phone_number must be a valid Nigerian phone number',
  })
  phone_number: string;

  @IsString()
  date_of_birth: string;

  @IsString()
  bio: string;

  @IsString()
  instagram_id: string;

  @IsString()
  profession: string;

  @IsEnum(Gender)
  gender: Gender;

  @IsArray()
  user_goal: string[];

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  interests: string[];

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  profile_pictures?: string[];

  @ValidateNested()
  @Type(() => LocationDto)
  @IsOptional()
  location?: LocationDto;
}
