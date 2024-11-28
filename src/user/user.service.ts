import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { User, UserDocument } from './schema/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModal: Model<UserDocument>) {}

  async createUser(
    createUserDto: CreateUserDto,
  ): Promise<{ message: string; data: UserDocument }> {
    try {
      const createdUser = await this.userModal.create(createUserDto);

      const savedUser = await createdUser.save();
      return { message: 'User created successfully.', data: savedUser };
    } catch (error) {
      if (error.code === 11000) {
        throw new BadRequestException('User with this email already exists.');
      }
      throw new InternalServerErrorException('Failed to create User.');
    }
  }

  async findAllUsers(): Promise<{ message: string; data: UserDocument[] }> {
    try {
      const users = await this.userModal.find().exec();

      if (users.length == 0) {
        throw new NotFoundException('No users found.');
      }

      return { message: 'Users found Successfully.', data: users };
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch profiles.');
    }
  }

  async findOneUser(
    id: string,
  ): Promise<{ message: string; data: UserDocument }> {
    try {
      const foundedProfile = await this.userModal.findById(id).exec();

      if (!foundedProfile) {
        throw new NotFoundException(`User with ID ${id} not found.`);
      }

      return { message: 'User found Successfully.', data: foundedProfile };
    } catch (error) {
      throw new InternalServerErrorException('Failed to find user.');
    }
  }

  async updateUser(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<{ message: string; data: UserDocument }> {
    try {
      const updatedUser = await this.userModal
        .findByIdAndUpdate(id, updateUserDto, { new: true })
        .exec();

      if (!updatedUser) {
        throw new NotFoundException(`User with ID ${id} not found.`);
      }

      return { message: 'User updated Successfully.', data: updatedUser };
    } catch (error) {
      if (error.name === 'CastError') {
        throw new BadRequestException(`Invalid User ID: ${id}`);
      }
      throw new InternalServerErrorException('Failed to update User.');
    }
  }

  async deleteUserById(
    id: string,
  ): Promise<{ message: string; data: UserDocument }> {
    try {
      const deletedUser = await this.userModal.findByIdAndDelete(id).exec();

      if (!deletedUser) {
        throw new NotFoundException(`User with ID ${id} not found.`);
      }

      return { message: 'User deleted successfully', data: deletedUser };
    } catch (error) {
      if (error.name === 'CastError') {
        throw new BadRequestException(`Invalid profile ID: ${id}`);
      }
      throw new InternalServerErrorException('Failed to delete User.');
    }
  }
}
