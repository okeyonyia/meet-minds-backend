import { Body, Controller, HttpStatus, Param, Post } from '@nestjs/common';
import { CreateEventParticipationDto } from './dto/create-event-participation.dto';
import { EventParticipationService } from './event-participation.service';

@Controller('event-participation')
export class EventParticipationController {
  constructor(
    private readonly eventParticipationService: EventParticipationService,
  ) {}

  @Post('create')
  async createParticipation(
    @Body() createEventParticipationDto: CreateEventParticipationDto,
  ) {
    const response = await this.eventParticipationService.createParticipation(
      createEventParticipationDto,
    );
    return {
      statusCode: HttpStatus.OK,
      message: response.message,
      data: response.data,
    };
  }

  @Post('event/:eventId')
  async getAllParticipationByEventId(@Param('eventId') eventId: string) {
    const response =
      await this.eventParticipationService.getAllParticipationByEventId(
        eventId,
      );
    return {
      statusCode: HttpStatus.OK,
      message: response.message,
      data: response.data,
    };
  }
}
