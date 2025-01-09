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
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async createUser(
    createUserDto: CreateUserDto,
  ): Promise<{ message: string; data: UserDocument }> {
    try {
      const createdUser = new this.userModel(createUserDto);
      const savedUser = await createdUser.save();

      return { message: 'User created successfully.', data: savedUser };
    } catch (error) {
      if (error.code === 11000) {
        throw new BadRequestException(
          'User with this email or UID already exists.',
        );
      }
      throw new InternalServerErrorException('Failed to create user.');
    }
  }

  async findAllUsers(): Promise<{ message: string; data: UserDocument[] }> {
    try {
      const users = await this.userModel.find().populate('profile').exec();

      if (users.length === 0) {
        throw new NotFoundException('No users found.');
      }

      return { message: 'Users retrieved successfully.', data: users };
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch users.');
    }
  }

  async findOneUser(
    id: string,
  ): Promise<{ message: string; data: UserDocument }> {
    try {
      const foundUser = await this.userModel
        .findById(id)
        .populate('profile')
        .exec();

      if (!foundUser) {
        throw new NotFoundException(`User with ID ${id} not found.`);
      }

      return { message: 'User retrieved successfully.', data: foundUser };
    } catch (error) {
      if (error.name === 'CastError') {
        throw new BadRequestException(`Invalid User ID: ${id}`);
      }
      throw new InternalServerErrorException('Failed to fetch user.');
    }
  }

  async updateUser(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<{ message: string; data: UserDocument }> {
    try {
      const updatedUser = await this.userModel
        .findByIdAndUpdate(id, updateUserDto, { new: true })
        .populate('profile')
        .exec();

      if (!updatedUser) {
        throw new NotFoundException(`User with ID ${id} not found.`);
      }

      return { message: 'User updated successfully.', data: updatedUser };
    } catch (error) {
      if (error.name === 'CastError') {
        throw new BadRequestException(`Invalid User ID: ${id}`);
      }
      throw new InternalServerErrorException('Failed to update user.');
    }
  }

  async deleteUserById(
    id: string,
  ): Promise<{ message: string; data: UserDocument }> {
    try {
      const deletedUser = await this.userModel.findByIdAndDelete(id).exec();

      if (!deletedUser) {
        throw new NotFoundException(`User with ID ${id} not found.`);
      }

      return { message: 'User deleted successfully.', data: deletedUser };
    } catch (error) {
      if (error.name === 'CastError') {
        throw new BadRequestException(`Invalid User ID: ${id}`);
      }
      throw new InternalServerErrorException('Failed to delete user.');
    }
  }
}
