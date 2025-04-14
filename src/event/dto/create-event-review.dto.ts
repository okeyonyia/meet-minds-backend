import { IsInt, IsOptional, IsString, Min, Max } from 'class-validator';

export class CreateEventReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  review?: string;

  @IsString()
  event_id: string;

  @IsString()
  profile_id: string;
}
