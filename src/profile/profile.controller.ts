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
import { ProfileService } from './profile.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateProfileStatusDto } from './dto/update-profile-status.dto';
import { Public } from '../auth/decorators/public.decorator';
// import { ApprovedByAdminStatus } from './schema/profile.schema';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Public()
  @Post()
  async createProfile(@Body() createProfileDto: CreateProfileDto) {
    const response = await this.profileService.createProfile(createProfileDto);
    return {
      statusCode: HttpStatus.CREATED,
      message: response.message,
      data: response.data,
    };
  }

  @Get()
  async findAllProfiles() {
    const response = await this.profileService.findAllProfiles();
    return {
      statusCode: HttpStatus.OK,
      message: response.message,
      data: response.data,
    };
  }

  @Get(':id')
  async findProfileById(@Param('id') id: string) {
    const response = await this.profileService.findProfileById(id);
    return {
      statusCode: HttpStatus.OK,
      message: response.message,
      data: response.data,
    };
  }

  @Patch('update-status')
  async updateProfileStatus(@Body() dto: UpdateProfileStatusDto) {
    const response = await this.profileService.updateProfileStatus(dto);

    return {
      statusCode: HttpStatus.OK,
      message: response.message,
      data: response.data,
    };
  }

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

  @Delete(':id')
  async deleteAccount(@Param('id') id: string) {
    const response = await this.profileService.deleteAccount(id);
    return {
      statusCode: HttpStatus.OK,
      message: response.message,
    };
  }

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
