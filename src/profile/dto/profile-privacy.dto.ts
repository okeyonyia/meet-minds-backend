import { IsBoolean, IsOptional } from 'class-validator';

export class ProfilePrivacyDto {
  @IsBoolean()
  @IsOptional()
  show_age?: boolean;

  @IsBoolean()
  @IsOptional()
  get_invited?: boolean;

  @IsBoolean()
  @IsOptional()
  show_attended_events?: boolean;
}
