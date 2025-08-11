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
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserService } from './user.service';
import { ApprovedByAdminStatus } from 'src/profile/schema/profile.schema';
import { Public } from '../auth/decorators/public.decorator';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Public()
  @Post()
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.userService.createUser(createUserDto);
  }

  @Get()
  async findAllUsers(@Query('is_approved') isApproved?: ApprovedByAdminStatus) {
    return this.userService.findAllUsers(isApproved);
  }

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

  @Patch(':id')
  async updateProfile(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.updateUser(id, updateUserDto);
  }

  @Delete(':id')
  async deleteUserById(@Param('id') id: string) {
    return this.userService.deleteUserById(id);
  }
}
