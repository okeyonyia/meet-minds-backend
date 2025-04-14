import { IsDate, IsString } from 'class-validator';

export class SuggestEventDto {
  @IsString()
  profile_id: string;

  @IsDate()
  available_from: Date;

  @IsDate()
  available_to: Date;
}
