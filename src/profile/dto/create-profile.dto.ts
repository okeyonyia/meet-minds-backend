import {
  IsString,
  IsArray,
  IsEnum,
  IsDate,
  ArrayMinSize,
  IsPhoneNumber,
} from 'class-validator';
import { Types } from 'mongoose';

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  NON_BINARY = 'nonbinary',
}

export class CreateProfileDto {
  @IsString()
  user_id: Types.ObjectId;

  @IsString()
  full_name: string;

  @IsPhoneNumber('NG', {
    message: 'phone_number must be a valid Nigerian phone number',
  })
  phone_number: string;

  @IsDate()
  date_of_birth: Date;

  @IsString()
  bio: string;

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
}
