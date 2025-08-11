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
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { EventService } from './event.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { JoinEventDto } from './dto/join-event.dto';
import { CreateEventReviewDto } from './dto/create-event-review.dto';
import { SuggestEventDto } from './dto/suggest-event.dto';

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

  @Post('suggest-event')
  async suggestEvent(@Body() body: SuggestEventDto) {
    const response = await this.eventService.findBestMatchingEvent(body);

    return {
      statusCode: response.statusCode,
      message: response.message,
      data: response.data,
    };
  }

  @Patch('review')
  async addReview(@Body() createEventReviewDto: CreateEventReviewDto) {
    const response = await this.eventService.addReview(createEventReviewDto);
    return {
      statusCode: HttpStatus.CREATED,
      message: response.message,
    };
  }

  @Get()
  async findAllEvents(
    @Query() filters: { [key: string]: any },
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Res() res: Response, // manually handling the serialization, since nestjs wasnt sending totalCount along with the response. DON'T remove this
  ) {
    const pageNumber = parseInt(page, 10) || 1;
    const limitNumber = parseInt(limit, 10) || 10;

    const response = await this.eventService.findAllEvents(
      filters,
      pageNumber,
      limitNumber,
    );

    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      message: response.message,
      data: response.data,
      totalCount: response.totalCount,
    });
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

  @Get('/reviews/:id')
  @Get()
  async getReviews(@Param('id') id: string, @Query('top') top?: number) {
    const response = await this.eventService.getReviews(
      id,
      top ? Number(top) : undefined,
    );
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
