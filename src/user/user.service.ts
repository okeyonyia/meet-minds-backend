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
import {
  ApprovedByAdminStatus,
  Profile,
  ProfileDocument,
} from 'src/profile/schema/profile.schema';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Profile.name)
    private profileModel: Model<ProfileDocument>,

    private readonly authService: AuthService,
  ) {}

  async createUser(
    createUserDto: CreateUserDto,
  ): Promise<{ message: string; data: UserDocument }> {
    try {
      const createdUser = new this.userModel(createUserDto);
      const savedUser = await createdUser.save();

      return { message: 'User created successfully.', data: savedUser };
    } catch (error) {
      if (createUserDto.uid) {
        try {
          await this.authService.deleteUserFromFirebase(createUserDto.uid);
        } catch (firebaseError) {
          if (firebaseError.code === 'auth/user-not-found') {
            return;
          } else {
            throw new InternalServerErrorException('Firebase deletion failed.');
          }
        }
      }

      if (error.code === 11000) {
        throw new BadRequestException(
          'User with this email or UID already exists.',
        );
      }
      throw new InternalServerErrorException('Failed to create user.');
    }
  }

  async findAllUsers(
    isApproved?: ApprovedByAdminStatus,
  ): Promise<{ message: string; data: UserDocument[] }> {
    try {
      // const populateQuery = {
      //   path: 'profile',
      //   match: isApproved ? { is_approved: isApproved } : {},
      // };

      // const users = await this.userModel.find().populate(populateQuery).exec();

      // const filteredUsers = isApproved
      //   ? users.filter((user) => user.profile !== null)
      //   : users.filter((user) => user.profile !== null);

      // if (filteredUsers.length === 0) {
      //   throw new NotFoundException('No users found.');
      // }

      // return { message: 'Users retrieved successfully.', data: filteredUsers };
      const query: any = {};

      if (isApproved) {
        query.profile = { $exists: true };
        query['profile.is_approved'] = isApproved;
      }

      const users = await this.userModel.find(query).populate('profile').exec();

      if (users.length === 0) {
        throw new NotFoundException('No users found.');
      }

      console.log('🔥 VERCEL_ENV:', process.env.VERCEL_ENV);
      return { message: 'Users retrieved successfully.', data: users };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch users.');
    }
  }

  async findOneUserByKey(
    key: 'id' | 'uid',
    value: string,
  ): Promise<{ message: string; data: UserDocument }> {
    try {
      const query = key === 'id' ? { _id: value } : { uid: value };
      const foundUser = await this.userModel
        .findOne(query)
        .populate('profile')
        .exec();

      if (!foundUser) {
        throw new NotFoundException(
          `User with ${key.toUpperCase()} ${value} not found.`,
        );
      }

      return { message: 'User retrieved successfully.', data: foundUser };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else if (error.name === 'CastError') {
        throw new BadRequestException(
          `Invalid User ${key.toUpperCase()}: ${value}`,
        );
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
      if (error instanceof NotFoundException) {
        throw error;
      } else if (error.name === 'CastError') {
        throw new BadRequestException(`Invalid User ID: ${id}`);
      }
      throw new InternalServerErrorException('Failed to update user.');
    }
  }

  async deleteUserById(
    id: string,
  ): Promise<{ message: string; data: UserDocument }> {
    try {
      const user = await this.userModel.findById(id).exec();

      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found.`);
      }

      if (user.profile) {
        const deletedProfile = await this.profileModel
          .findByIdAndDelete(user.profile)
          .exec();

        if (!deletedProfile) {
          console.warn(
            `Profile with ID ${user.profile} not found during user deletion.`,
          );
        }
      }

      const deletedUser = await this.userModel.findByIdAndDelete(id).exec();

      return {
        message: `User and associated profile deleted successfully.`,
        data: deletedUser,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else if (error.name === 'CastError') {
        throw new BadRequestException(`Invalid User ID: ${id}`);
      }
      throw new InternalServerErrorException('Failed to delete user.');
    }
  }
}
