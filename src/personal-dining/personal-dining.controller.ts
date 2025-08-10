import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PersonalDiningService } from './personal-dining.service';
import { CreatePersonalDiningDto } from './dto/create-personal-dining.dto';
import {
  RespondToPersonalDiningDto,
  ReviewPersonalDiningDto,
  CompletePersonalDiningDto,
} from './dto/respond-personal-dining.dto';
import {
  JoinRequestPersonalDiningDto,
  RespondToJoinRequestDto,
} from './dto/join-request-personal-dining.dto';
import { DiningStatus } from './enums/personal-dinning.enum';
import { TimeSlot } from '../common/enums/time-slot.enum';

@ApiTags('personal-dining')
@Controller('personal-dining')
export class PersonalDiningController {
  constructor(private readonly personalDiningService: PersonalDiningService) {}

  @ApiOperation({
    summary: 'Create a new personal dining experience',
    description:
      'Creates a one-on-one dining experience with restaurant, date/time, and invitation settings. Personal dining is always private.',
  })
  @ApiResponse({
    status: 201,
    description: 'Personal dining experience created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data or restaurant unavailable',
  })
  @ApiBearerAuth()
  @Post()
  async createPersonalDining(
    @Body() createPersonalDiningDto: CreatePersonalDiningDto,
  ) {
    const response = await this.personalDiningService.createPersonalDining(
      createPersonalDiningDto,
    );
    return {
      statusCode: HttpStatus.CREATED,
      message: response.message,
      data: response.data,
    };
  }

  @ApiOperation({
    summary: 'Get user personal dining experiences',
    description:
      'Retrieves all personal dining experiences for a specific user with optional filtering',
  })
  @ApiParam({
    name: 'userId',
    description: 'User ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by experience status',
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
  })
  @ApiQuery({
    name: 'asHost',
    required: false,
    description: 'Include experiences where user is host',
    type: 'boolean',
    example: 'true',
  })
  @ApiQuery({
    name: 'asGuest',
    required: false,
    description: 'Include experiences where user is guest',
    type: 'boolean',
    example: 'true',
  })
  @ApiResponse({
    status: 200,
    description: 'User personal dining experiences retrieved successfully',
  })
  @Get('user/:userId')
  async findUserPersonalDining(
    @Param('userId') userId: string,
    @Query('status') status?: DiningStatus,
    @Query('asHost') asHost?: string,
    @Query('asGuest') asGuest?: string,
  ) {
    const response = await this.personalDiningService.findPersonalDiningByUser(
      userId,
      status,
      asHost === 'true',
      asGuest === 'true',
    );

    return {
      statusCode: HttpStatus.OK,
      message: response.message,
      data: response.data,
    };
  }

  @ApiOperation({
    summary: 'Get personal dining experience by ID',
    description:
      'Retrieves a single personal dining experience with all its details including restaurant and user information',
  })
  @ApiParam({
    name: 'id',
    description: 'Personal dining experience ID',
    example: '507f1f77bcf86cd799439014',
  })
  @ApiResponse({
    status: 200,
    description: 'Personal dining experience retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Personal dining experience not found',
  })
  @Get(':id')
  async getPersonalDiningById(@Param('id') id: string) {
    const response = await this.personalDiningService.getPersonalDiningById(id);
    return {
      statusCode: HttpStatus.OK,
      message: response.message,
      data: response.data,
    };
  }

  @ApiOperation({
    summary: 'Respond to personal dining invitation',
    description:
      'Allows a user to accept or decline a personal dining invitation',
  })
  @ApiParam({
    name: 'id',
    description: 'Personal dining experience ID',
    example: '507f1f77bcf86cd799439014',
  })
  @ApiResponse({
    status: 200,
    description: 'Response recorded successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid response or experience not available for response',
  })
  @ApiBearerAuth()
  @Patch(':id/respond')
  async respondToPersonalDining(
    @Param('id') id: string,
    @Body() respondDto: RespondToPersonalDiningDto,
  ) {
    const response = await this.personalDiningService.respondToPersonalDining(
      id,
      respondDto,
    );
    return {
      statusCode: HttpStatus.OK,
      message: response.message,
      data: response.data,
    };
  }

  @ApiOperation({
    summary: 'Cancel personal dining experience',
    description:
      'Cancels a pending or confirmed personal dining experience with optional refund processing',
  })
  @ApiParam({
    name: 'id',
    description: 'Personal dining experience ID',
    example: '507f1f77bcf86cd799439014',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        user_id: {
          type: 'string',
          description: 'ID of user cancelling the experience',
          example: '507f1f77bcf86cd799439011',
        },
        reason: {
          type: 'string',
          description: 'Reason for cancellation',
          example: 'Schedule conflict',
        },
      },
      required: ['user_id'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Personal dining experience cancelled successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Experience cannot be cancelled or invalid cancellation data',
  })
  @ApiBearerAuth()
  @Patch(':id/cancel')
  async cancelPersonalDining(
    @Param('id') id: string,
    @Body() cancelData: { user_id: string; reason?: string },
  ) {
    const response = await this.personalDiningService.cancelPersonalDining(
      id,
      cancelData.user_id,
      cancelData.reason,
    );

    return {
      statusCode: HttpStatus.OK,
      message: response.message,
    };
  }

  @ApiOperation({
    summary: 'Complete personal dining experience',
    description:
      'Marks a personal dining experience as completed and handles payment processing with commission calculations',
  })
  @ApiResponse({
    status: 200,
    description: 'Personal dining experience completed successfully',
  })
  @ApiResponse({
    status: 400,
    description:
      'Invalid completion data or experience not ready for completion',
  })
  @ApiBearerAuth()
  @Patch('complete')
  async completePersonalDining(@Body() completeDto: CompletePersonalDiningDto) {
    const response =
      await this.personalDiningService.completePersonalDining(completeDto);
    return {
      statusCode: HttpStatus.OK,
      message: response.message,
      data: response.data,
    };
  }

  @ApiOperation({
    summary: 'Add review for personal dining experience',
    description:
      'Allows host or guest to review their personal dining experience and rate the restaurant',
  })
  @ApiResponse({ status: 201, description: 'Review added successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid review data or user already reviewed',
  })
  @ApiBearerAuth()
  @Post('review')
  async addReview(@Body() reviewDto: ReviewPersonalDiningDto) {
    const response = await this.personalDiningService.addReview(reviewDto);
    return {
      statusCode: HttpStatus.CREATED,
      message: response.message,
    };
  }

  // PUBLIC PERSONAL DINING ENDPOINTS

  @ApiOperation({
    summary: 'Get public personal dining experiences',
    description:
      'Retrieves public personal dining experiences that are available for join requests with optional filtering by location and time slot',
  })
  @ApiQuery({
    name: 'latitude',
    required: false,
    description: 'User latitude for location-based filtering',
    example: 6.5244,
  })
  @ApiQuery({
    name: 'longitude',
    required: false,
    description: 'User longitude for location-based filtering',
    example: 3.3792,
  })
  @ApiQuery({
    name: 'radius',
    required: false,
    description: 'Search radius in kilometers',
    example: 25,
  })
  @ApiQuery({
    name: 'time_slot',
    required: false,
    description: 'Filter by time slot',
    enum: ['morning', 'afternoon', 'night'],
    example: 'evening',
  })
  @ApiResponse({
    status: 200,
    description: 'Public personal dining experiences retrieved successfully',
  })
  @Get('public')
  async getPublicPersonalDining(
    @Query('latitude') latitude?: number,
    @Query('longitude') longitude?: number,
    @Query('radius') radius?: number,
    @Query('time_slot') timeSlot?: TimeSlot,
  ) {
    const response = await this.personalDiningService.getPublicPersonalDining(
      latitude,
      longitude,
      radius,
      timeSlot,
    );
    return {
      statusCode: HttpStatus.OK,
      message: response.message,
      data: response.data,
    };
  }

  @ApiOperation({
    summary: 'Request to join a public personal dining experience',
    description:
      'Submit a request to join a public personal dining experience. The host can then accept or decline the request.',
  })
  @ApiParam({
    name: 'id',
    description: 'Personal dining experience ID',
    example: '507f1f77bcf86cd799439014',
  })
  @ApiResponse({
    status: 201,
    description: 'Join request submitted successfully',
  })
  @ApiResponse({
    status: 400,
    description:
      'Cannot request to join (already requested, experience full, time conflict, etc.)',
  })
  @ApiBearerAuth()
  @Post(':id/request-join')
  async requestToJoin(
    @Param('id') id: string,
    @Body() joinRequestDto: JoinRequestPersonalDiningDto,
  ) {
    const response = await this.personalDiningService.requestToJoin(
      id,
      joinRequestDto,
    );
    return {
      statusCode: HttpStatus.CREATED,
      message: response.message,
    };
  }

  @ApiOperation({
    summary: 'Respond to join request',
    description:
      'Host can accept or decline join requests for their public personal dining experience',
  })
  @ApiParam({
    name: 'id',
    description: 'Personal dining experience ID',
    example: '507f1f77bcf86cd799439014',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        host_id: {
          type: 'string',
          description: 'ID of the host responding to the request',
          example: '507f1f77bcf86cd799439011',
        },
        request_id: {
          type: 'string',
          description: 'ID of the user who made the join request',
          example: '507f1f77bcf86cd799439012',
        },
        response: {
          type: 'string',
          enum: ['accept', 'decline'],
          description: 'Host response to the join request',
          example: 'accept',
        },
        response_message: {
          type: 'string',
          description: 'Optional message from host',
          example: 'Looking forward to dining with you!',
        },
      },
      required: ['host_id', 'request_id', 'response'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Join request response recorded successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid response or time conflict when accepting',
  })
  @ApiBearerAuth()
  @Patch(':id/respond-join-request')
  async respondToJoinRequest(
    @Param('id') id: string,
    @Body() responseDto: RespondToJoinRequestDto & { host_id: string },
  ) {
    const { host_id, ...restDto } = responseDto;
    const response = await this.personalDiningService.respondToJoinRequest(
      id,
      host_id,
      restDto,
    );
    return {
      statusCode: HttpStatus.OK,
      message: response.message,
      data: response.data,
    };
  }

  @ApiOperation({
    summary: 'Get join requests for host',
    description:
      'Retrieve all pending join requests for personal dining experiences hosted by the user',
  })
  @ApiParam({
    name: 'hostId',
    description: 'Host user ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Join requests retrieved successfully',
  })
  @ApiBearerAuth()
  @Get('join-requests/:hostId')
  async getJoinRequestsForHost(@Param('hostId') hostId: string) {
    const response =
      await this.personalDiningService.getJoinRequestsForHost(hostId);
    return {
      statusCode: HttpStatus.OK,
      message: response.message,
      data: response.data,
    };
  }
}
