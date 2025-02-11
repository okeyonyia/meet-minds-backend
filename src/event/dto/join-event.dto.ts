import { IsString } from 'class-validator';

export class JoinEventDto {
  @IsString()
  eventId: string;

  @IsString()
  profileId: string;

  // More fields related to payment and smile integration
}
