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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { EventService } from './event.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { JoinEventDto } from './dto/join-event.dto';
import { CreateEventReviewDto } from './dto/create-event-review.dto';
import { SuggestEventDto } from './dto/suggest-event.dto';

@ApiTags('events')
@Controller('event')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @ApiOperation({
    summary: 'Create new event',
    description: 'Create a new group dining event that users can join',
  })
  @ApiResponse({ status: 201, description: 'Event created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiBearerAuth()
  @Post()
  async createEvent(@Body() createEventDto: CreateEventDto) {
    const response = await this.eventService.createEvent(createEventDto);
    return {
      statusCode: HttpStatus.CREATED,
      message: response.message,
      data: response.data,
    };
  }

  @ApiOperation({
    summary: 'Get event suggestions',
    description: 'Find the best matching events based on user preferences',
  })
  @ApiResponse({
    status: 200,
    description: 'Event suggestions retrieved successfully',
  })
  @Post('suggest-event')
  async suggestEvent(@Body() body: SuggestEventDto) {
    const response = await this.eventService.findBestMatchingEvent(body);

    return {
      statusCode: response.statusCode,
      message: response.message,
      data: response.data,
    };
  }

  @ApiOperation({
    summary: 'Add event review',
    description: 'Add a review and rating for a completed event',
  })
  @ApiResponse({ status: 201, description: 'Review added successfully' })
  @ApiResponse({ status: 400, description: 'Invalid review data' })
  @ApiBearerAuth()
  @Patch('review')
  async addReview(@Body() createEventReviewDto: CreateEventReviewDto) {
    const response = await this.eventService.addReview(createEventReviewDto);
    return {
      statusCode: HttpStatus.CREATED,
      message: response.message,
    };
  }

  @ApiOperation({
    summary: 'Get all events with filtering',
    description: 'Retrieve all events with optional filtering and pagination',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page',
    example: 10,
  })
  @ApiQuery({
    name: 'time_slot',
    required: false,
    description: 'Filter by time of day',
    enum: ['morning', 'afternoon', 'night'],
    example: 'morning',
  })
  @ApiQuery({
    name: 'text',
    required: false,
    description: 'Search text in title and description',
    example: 'networking',
  })
  @ApiQuery({
    name: 'date',
    required: false,
    description: 'Filter by date (YYYY-MM-DD, YYYY-MM, or YYYY)',
    example: '2025-01-15',
  })
  @ApiQuery({
    name: 'capacity',
    required: false,
    description: 'Minimum number of attendee slots',
    example: 4,
  })
  @ApiResponse({ status: 200, description: 'Events retrieved successfully' })
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

  @ApiOperation({
    summary: 'Get events by user ID',
    description: 'Get events where user is hosting or attending',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiQuery({
    name: 'hosting',
    required: false,
    description: 'Filter hosting events',
    type: 'boolean',
  })
  @ApiQuery({
    name: 'attending',
    required: false,
    description: 'Filter attending events',
    type: 'boolean',
  })
  @ApiResponse({
    status: 200,
    description: 'User events retrieved successfully',
  })
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

  @ApiOperation({
    summary: 'Get event by ID',
    description: 'Retrieve a specific event with all its details',
  })
  @ApiParam({
    name: 'id',
    description: 'Event ID',
    example: '507f1f77bcf86cd799439014',
  })
  @ApiResponse({ status: 200, description: 'Event retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @Get(':id')
  async findEventById(@Param('id') id: string) {
    const response = await this.eventService.findEventById(id);
    return {
      statusCode: HttpStatus.OK,
      message: response.message,
      data: response.data,
    };
  }

  @ApiOperation({
    summary: 'Get event reviews',
    description: 'Get reviews for a specific event',
  })
  @ApiParam({
    name: 'id',
    description: 'Event ID',
    example: '507f1f77bcf86cd799439014',
  })
  @ApiQuery({
    name: 'top',
    required: false,
    description: 'Limit number of reviews',
    type: 'number',
  })
  @ApiResponse({ status: 200, description: 'Reviews retrieved successfully' })
  @Get('/reviews/:id')
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

  @ApiOperation({
    summary: 'Get event attendees',
    description: 'Get all attendees for a specific event',
  })
  @ApiParam({
    name: 'id',
    description: 'Event ID',
    example: '507f1f77bcf86cd799439014',
  })
  @ApiResponse({ status: 200, description: 'Attendees retrieved successfully' })
  @Get('/attendees/:id')
  async findAllAttendeesByEventId(@Param('id') id: string) {
    const response = await this.eventService.findAllAttendeesByEventId(id);
    return {
      statusCode: HttpStatus.OK,
      message: response.message,
      data: response.data,
    };
  }

  @ApiOperation({
    summary: 'Join event',
    description: 'Join an existing event as an attendee',
  })
  @ApiResponse({ status: 200, description: 'Successfully joined event' })
  @ApiResponse({
    status: 400,
    description: 'Cannot join event (full, expired, etc.)',
  })
  @ApiBearerAuth()
  @Patch('join')
  async joinEvent(@Body() joinEventDto: JoinEventDto) {
    const response = await this.eventService.joinEvent(joinEventDto);
    return {
      statusCode: HttpStatus.OK,
      message: response.message,
      data: response.data,
    };
  }

  @ApiOperation({
    summary: 'Leave event',
    description: 'Leave an event that user previously joined',
  })
  @ApiParam({
    name: 'eventId',
    description: 'Event ID',
    example: '507f1f77bcf86cd799439014',
  })
  @ApiParam({
    name: 'userId',
    description: 'User ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({ status: 200, description: 'Successfully left event' })
  @ApiBearerAuth()
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

  @ApiOperation({
    summary: 'Update event',
    description: 'Update event details and information',
  })
  @ApiParam({
    name: 'id',
    description: 'Event ID',
    example: '507f1f77bcf86cd799439014',
  })
  @ApiResponse({ status: 200, description: 'Event updated successfully' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiBearerAuth()
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

  @ApiOperation({
    summary: 'Delete event',
    description: 'Delete an event (only by event creator)',
  })
  @ApiParam({
    name: 'id',
    description: 'Event ID',
    example: '507f1f77bcf86cd799439014',
  })
  @ApiResponse({ status: 200, description: 'Event deleted successfully' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiBearerAuth()
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
