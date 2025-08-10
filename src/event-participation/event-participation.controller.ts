import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CreateEventParticipationDto } from './dto/create-event-participation.dto';
import { EventParticipationService } from './event-participation.service';

@ApiTags('event-participation')
@Controller('event-participation')
export class EventParticipationController {
  constructor(
    private readonly eventParticipationService: EventParticipationService,
  ) {}

  @ApiOperation({
    summary: 'Create event participation',
    description: 'Create a new participation record for an event',
  })
  @ApiResponse({
    status: 200,
    description: 'Participation created successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid participation data' })
  @ApiBearerAuth()
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

  @ApiOperation({
    summary: 'Get participations by event',
    description: 'Get all participation records for a specific event',
  })
  @ApiParam({
    name: 'eventId',
    description: 'Event ID',
    example: '507f1f77bcf86cd799439014',
  })
  @ApiResponse({
    status: 200,
    description: 'Participations retrieved successfully',
  })
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

  @ApiOperation({
    summary: 'Get all participants',
    description: 'Retrieve all participation records in the system',
  })
  @ApiResponse({
    status: 200,
    description: 'Participants retrieved successfully',
  })
  @Get()
  async getAllParticipants() {
    const response = await this.eventParticipationService.getAllParticipants();
    return {
      statusCode: HttpStatus.OK,
      message: response.message,
      data: response.data,
    };
  }

  @ApiOperation({
    summary: 'Get participant by ID',
    description: 'Get a specific participation record by ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Participation ID',
    example: '507f1f77bcf86cd799439015',
  })
  @ApiResponse({
    status: 200,
    description: 'Participant retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Participant not found' })
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

  @ApiOperation({
    summary: 'Delete participant',
    description: 'Remove a participation record from the system',
  })
  @ApiParam({
    name: 'id',
    description: 'Participation ID',
    example: '507f1f77bcf86cd799439015',
  })
  @ApiResponse({ status: 200, description: 'Participant deleted successfully' })
  @ApiResponse({ status: 404, description: 'Participant not found' })
  @ApiBearerAuth()
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
