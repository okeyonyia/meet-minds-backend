import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Profile, ProfileDocument } from './schema/profile.schema';

@Injectable()
export class ProfileService {
    constructor(@InjectModel(Profile.name) private profileModel: Model<ProfileDocument>) { }

    // Create a new profile
    async createProfile(createProfileDto: CreateProfileDto): Promise<ProfileDocument> {
        try {
            const profile = new this.profileModel(createProfileDto);
            return await profile.save();
        } catch (error) {
            if (error.code === 11000) {
                // Handle duplicate entry error (MongoDB's unique index violation)
                throw new BadRequestException('Profile with this email already exists.');
            }
            // Handle other validation or server errors
            throw new InternalServerErrorException('Failed to create profile.');
        }
    }

    // Get all profiles
    async findAllProfiles(): Promise<Profile[]> {
        try {
            return await this.profileModel.find().exec();
        } catch (error) {
            throw new InternalServerErrorException('Failed to fetch profiles.');
        }
    }

    // Get a profile by ID
    async findOneProfile(id: string): Promise<Profile> {
        try {
            const profile = await this.profileModel.findById(id).exec();
            if (!profile) {
                throw new NotFoundException(`Profile with ID ${id} not found.`);
            }
            return profile;
        } catch (error) {
            if (error.name === 'CastError') {
                // Handle invalid MongoDB ObjectId error
                throw new BadRequestException(`Invalid profile ID: ${id}`);
            }
            throw new InternalServerErrorException('Failed to fetch profile.');
        }
    }

    // Update a profile
    async updateProfile(id: string, updateProfileDto: UpdateProfileDto): Promise<Profile> {
        try {
            const updatedProfile = await this.profileModel.findByIdAndUpdate(id, updateProfileDto, { new: true }).exec();
            if (!updatedProfile) {
                throw new NotFoundException(`Profile with ID ${id} not found.`);
            }
            return updatedProfile;
        } catch (error) {
            if (error.name === 'CastError') {
                throw new BadRequestException(`Invalid profile ID: ${id}`);
            }
            throw new InternalServerErrorException('Failed to update profile.');
        }
    }

    // Delete a profile
    async deleteProfileById(id: string): Promise<void> {
        try {
            const result = await this.profileModel.findByIdAndDelete(id).exec();
            if (!result) {
                throw new NotFoundException(`Profile with ID ${id} not found.`);
            }
        } catch (error) {
            if (error.name === 'CastError') {
                throw new BadRequestException(`Invalid profile ID: ${id}`);
            }
            throw new InternalServerErrorException('Failed to delete profile.');
        }
    }
}
