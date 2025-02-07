import { IsString, IsEnum } from 'class-validator';
import { EventJoinStatus } from '../schema/event-participation.schema';

export class CreateEventParticipationDto {
  @IsString()
  profile: string;

  @IsString()
  event: string;

  // @IsEnum(EventJoinStatus)
  // status: EventJoinStatus;

  // @IsString()
  // payment: string;
}
