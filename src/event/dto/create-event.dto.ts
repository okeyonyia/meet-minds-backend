import { IsString, IsDate, IsNumber, IsBoolean } from 'class-validator';

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

  @IsString()
  location: string;

  @IsString()
  cover_picture: string;

  @IsString()
  ticket: string;

  @IsNumber()
  no_of_attendees: number;

  @IsBoolean()
  is_public: boolean;
}
