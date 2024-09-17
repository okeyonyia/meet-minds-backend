import { IsString, IsNotEmpty, IsNumber, IsArray, IsEnum, IsOptional, IsUrl } from 'class-validator';

enum DatingPreference {
    ROMANTIC = 'romantic',
    PROFESSIONAL = 'professional',
    BOTH = 'both'
}

export class CreateProfileDto {
    @IsString()
    @IsNotEmpty()
    first_name: string;

    @IsString()
    @IsNotEmpty()
    last_name: string;

    @IsNumber()
    @IsNotEmpty()
    age: number;

    @IsString()
    @IsNotEmpty()
    gender: string;

    @IsString()
    @IsOptional()
    profile_picture_url?: string;

    @IsString()
    @IsOptional()
    bio?: string;

    @IsUrl()
    @IsOptional()
    linkedin_url?: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    interests?: string[];

    @IsEnum(DatingPreference)
    @IsNotEmpty()
    dating_preference: DatingPreference;
}
