import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
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

  @Get('event/:eventId')
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

  @Get()
  async getAllParticipants() {
    const response = await this.eventParticipationService.getAllParticipants();
    return {
      statusCode: HttpStatus.OK,
      message: response.message,
      data: response.data,
    };
  }

  @Get('/:id')
  async getParticipantById(@Param('id') id: string) {
    const response =
      await this.eventParticipationService.getParticipantById(id);
    return {
      statusCode: HttpStatus.OK,
      message: response.message,
      data: response.data,
    };
  }

  @Delete('/:id')
  async deleteParticipantById(@Param('id') id: string) {
    const response =
      await this.eventParticipationService.deleteParticipantById(id);
    return {
      statusCode: HttpStatus.OK,
      message: response.message,
      data: response.data,
    };
  }
}
