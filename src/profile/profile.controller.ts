import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ProfileService } from './profile.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateProfileStatusDto } from './dto/update-profile-status.dto';
// import { ApprovedByAdminStatus } from './schema/profile.schema';

@ApiTags('profiles')
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @ApiOperation({
    summary: 'Create user profile',
    description:
      'Create a new user profile with personal information and preferences',
  })
  @ApiResponse({ status: 201, description: 'Profile created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiBearerAuth()
  @Post()
  async createProfile(@Body() createProfileDto: CreateProfileDto) {
    const response = await this.profileService.createProfile(createProfileDto);
    return {
      statusCode: HttpStatus.CREATED,
      message: response.message,
      data: response.data,
    };
  }

  @ApiOperation({
    summary: 'Get all profiles',
    description: 'Retrieve all user profiles in the system',
  })
  @ApiResponse({ status: 200, description: 'Profiles retrieved successfully' })
  @Get()
  async findAllProfiles() {
    const response = await this.profileService.findAllProfiles();
    return {
      statusCode: HttpStatus.OK,
      message: response.message,
      data: response.data,
    };
  }

  @ApiOperation({
    summary: 'Get profile by ID',
    description: 'Retrieve a specific user profile by their ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Profile ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  @Get(':id')
  async findProfileById(@Param('id') id: string) {
    const response = await this.profileService.findProfileById(id);
    return {
      statusCode: HttpStatus.OK,
      message: response.message,
      data: response.data,
    };
  }

  @ApiOperation({
    summary: 'Update profile approval status',
    description: 'Update the admin approval status of a user profile',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile status updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  @ApiBearerAuth()
  @Patch('update-status')
  async updateProfileStatus(@Body() dto: UpdateProfileStatusDto) {
    const response = await this.profileService.updateProfileStatus(dto);

    return {
      statusCode: HttpStatus.OK,
      message: response.message,
      data: response.data,
    };
  }

  @ApiOperation({
    summary: 'Update profile information',
    description: 'Update user profile details and preferences',
  })
  @ApiParam({
    name: 'id',
    description: 'Profile ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  @ApiBearerAuth()
  @Patch(':id')
  async updateProfile(
    @Param('id') id: string,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    const response = await this.profileService.updateProfile(
      id,
      updateProfileDto,
    );
    return {
      statusCode: HttpStatus.OK,
      message: response.message,
      data: response.data,
    };
  }

  @ApiOperation({
    summary: 'Delete user account',
    description: 'Permanently delete a user account and profile',
  })
  @ApiParam({
    name: 'id',
    description: 'Profile ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({ status: 200, description: 'Account deleted successfully' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  @ApiBearerAuth()
  @Delete(':id')
  async deleteAccount(@Param('id') id: string) {
    const response = await this.profileService.deleteAccount(id);
    return {
      statusCode: HttpStatus.OK,
      message: response.message,
    };
  }

  @ApiOperation({
    summary: 'Check if users can chat',
    description: 'Verify if two users have shared events and can communicate',
  })
  @ApiParam({
    name: 'profileId1',
    description: 'First profile ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiParam({
    name: 'profileId2',
    description: 'Second profile ID',
    example: '507f1f77bcf86cd799439012',
  })
  @ApiResponse({
    status: 200,
    description: 'Chat eligibility checked successfully',
  })
  @Get(':profileId1/shared-with/:profileId2')
  async canChat(
    @Param('profileId1') profileId1: string,
    @Param('profileId2') profileId2: string,
  ) {
    const canChat = await this.profileService.haveSharedEvents(
      profileId1,
      profileId2,
    );
    return {
      statusCode: HttpStatus.OK,
      canChat,
    };
  }
}
