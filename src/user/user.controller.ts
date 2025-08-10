import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
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
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserService } from './user.service';
import { ApprovedByAdminStatus } from 'src/profile/schema/profile.schema';

@ApiTags('users')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({
    summary: 'Create new user',
    description: 'Create a new user account in the system',
  })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @Post()
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.userService.createUser(createUserDto);
  }

  @ApiOperation({
    summary: 'Get all users',
    description: 'Retrieve all users with optional approval status filter',
  })
  @ApiQuery({
    name: 'is_approved',
    required: false,
    description: 'Filter by admin approval status',
    enum: ApprovedByAdminStatus,
  })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  @Get()
  async findAllUsers(@Query('is_approved') isApproved?: ApprovedByAdminStatus) {
    return this.userService.findAllUsers(isApproved);
  }

  @ApiOperation({
    summary: 'Find user by ID or UID',
    description: 'Get a specific user by their ID or UID',
  })
  @ApiParam({
    name: 'key',
    description: 'Search key type',
    enum: ['id', 'uid'],
    example: 'id',
  })
  @ApiParam({
    name: 'value',
    description: 'Search value',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({ status: 200, description: 'User found successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 400, description: 'Invalid search key' })
  @Get(':key/:value')
  async findOneUser(
    @Param('key') key: 'id' | 'uid',
    @Param('value') value: string,
  ) {
    if (key !== 'id' && key !== 'uid') {
      throw new BadRequestException('Invalid key. Use "id" or "uid".');
    }
    return this.userService.findOneUserByKey(key, value);
  }

  @ApiOperation({
    summary: 'Update user profile',
    description: 'Update user information and profile details',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiBearerAuth()
  @Patch(':id')
  async updateProfile(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.updateUser(id, updateUserDto);
  }

  @ApiOperation({
    summary: 'Delete user account',
    description: 'Permanently delete a user account from the system',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiBearerAuth()
  @Delete(':id')
  async deleteUserById(@Param('id') id: string) {
    return this.userService.deleteUserById(id);
  }
}
