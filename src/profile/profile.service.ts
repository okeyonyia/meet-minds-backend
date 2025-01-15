import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Profile, ProfileDocument } from './schema/profile.schema';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { User, UserDocument } from 'src/user/schema/user.schema';

@Injectable()
export class ProfileService {
  constructor(
    @InjectModel(Profile.name) private profileModel: Model<ProfileDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async createProfile(
    createProfileDto: CreateProfileDto,
  ): Promise<{ message: string; data: ProfileDocument }> {
    try {
      const { user_id, ...profileData } = createProfileDto;

      const user = await this.userModel.findById({ uid: user_id });
      if (!user) {
        throw new NotFoundException(`User with UID ${user_id} not found.`);
      }

      const createdProfile = new this.profileModel(profileData);
      const savedProfile = await createdProfile.save();

      user.profile = savedProfile._id;
      await user.save();

      return { message: 'Profile created successfully.', data: savedProfile };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to create profile.');
    }
  }

  async findAllProfiles(): Promise<{
    message: string;
    data: ProfileDocument[];
  }> {
    try {
      const profiles = await this.profileModel.find().exec();

      if (profiles.length === 0) {
        throw new NotFoundException('No profiles found.');
      }

      return { message: 'Profiles retrieved successfully.', data: profiles };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch profiles.');
    }
  }

  async findProfileById(
    id: string,
  ): Promise<{ message: string; data: ProfileDocument }> {
    try {
      const profile = await this.profileModel.findById(id).exec();

      if (!profile) {
        throw new NotFoundException(`Profile with ID ${id} not found.`);
      }

      return { message: 'Profile retrieved successfully.', data: profile };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else if (error.name === 'CastError') {
        throw new BadRequestException(`Invalid Profile ID: ${id}`);
      }
      throw new InternalServerErrorException('Failed to fetch profile.');
    }
  }

  async updateProfile(
    id: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<{ message: string; data: ProfileDocument }> {
    try {
      const updatedProfile = await this.profileModel
        .findByIdAndUpdate(id, updateProfileDto, { new: true })
        .exec();

      if (!updatedProfile) {
        throw new NotFoundException(`Profile with ID ${id} not found.`);
      }

      return { message: 'Profile updated successfully.', data: updatedProfile };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else if (error.name === 'CastError') {
        throw new BadRequestException(`Invalid Profile ID: ${id}`);
      }
      throw new InternalServerErrorException('Failed to update profile.');
    }
  }

  async deleteProfileById(
    id: string,
  ): Promise<{ message: string; data: ProfileDocument }> {
    try {
      const deletedProfile = await this.profileModel
        .findByIdAndDelete(id)
        .exec();

      if (!deletedProfile) {
        throw new NotFoundException(`Profile with ID ${id} not found.`);
      }

      return { message: 'Profile deleted successfully.', data: deletedProfile };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else if (error.name === 'CastError') {
        throw new BadRequestException(`Invalid Profile ID: ${id}`);
      }
      throw new InternalServerErrorException('Failed to delete profile.');
    }
  }
}
