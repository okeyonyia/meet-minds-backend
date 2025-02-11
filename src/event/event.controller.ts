import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { EventService } from './event.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { JoinEventDto } from './dto/join-event.dto';

@Controller('event')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Post()
  async createEvent(@Body() createEventDto: CreateEventDto) {
    const response = await this.eventService.createEvent(createEventDto);
    return {
      statusCode: HttpStatus.CREATED,
      message: response.message,
      data: response.data,
    };
  }

  @Get()
  async findAllEvents(@Query() filters: { [key: string]: any }) {
    const response = await this.eventService.findAllEvents(filters);
    return {
      statusCode: HttpStatus.OK,
      message: response.message,
      data: response.data,
    };
  }

  @Get('/id/:id')
  async findAllEventsById(
    @Param('id') id: string,
    @Query('hosting') hosting?: boolean,
    @Query('attending') attending?: boolean,
  ) {
    const isHosting = hosting === true;
    const isAttending = attending === true;

    const response = await this.eventService.findAllEventsById(
      id,
      isHosting,
      isAttending,
    );

    return {
      statusCode: HttpStatus.OK,
      message: response.message,
      data: response.data,
    };
  }

  @Get(':id')
  async findEventById(@Param('id') id: string) {
    const response = await this.eventService.findEventById(id);
    return {
      statusCode: HttpStatus.OK,
      message: response.message,
      data: response.data,
    };
  }

  @Get('/attendees/:id')
  async findAllAttendeesByEventId(@Param('id') id: string) {
    const response = await this.eventService.findAllAttendeesByEventId(id);
    return {
      statusCode: HttpStatus.OK,
      message: response.message,
      data: response.data,
    };
  }

  @Patch('join')
  async joinEvent(@Body() joinEventDto: JoinEventDto) {
    const response = await this.eventService.joinEvent(joinEventDto);
    return {
      statusCode: HttpStatus.OK,
      message: response.message,
      data: response.data,
    };
  }

  @Patch('unjoin/:eventId/:userId')
  async unjoinEvent(
    @Param('eventId') eventId: string,
    @Param('userId') userId: string,
  ) {
    const response = await this.eventService.unjoinEvent(userId, eventId);
    return {
      statusCode: HttpStatus.OK,
      message: response.message,
      data: response.data,
    };
  }

  @Patch(':id')
  async updateEvent(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
  ) {
    const response = await this.eventService.updateEvent(id, updateEventDto);
    return {
      statusCode: HttpStatus.OK,
      message: response.message,
      data: response.data,
    };
  }

  @Delete(':id')
  async deleteEvent(@Param('id') id: string) {
    const response = await this.eventService.deleteEvent(id);
    return {
      statusCode: HttpStatus.OK,
      message: response.message,
      data: response.data,
    };
  }
}
