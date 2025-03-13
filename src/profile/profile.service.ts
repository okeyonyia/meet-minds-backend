import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Profile, ProfileDocument } from './schema/profile.schema';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { User, UserDocument } from 'src/user/schema/user.schema';
import { UpdateProfileStatusDto } from './dto/update-profile-status.dto';
import { Event } from 'src/event/schema/event.schema';
import { UserService } from 'src/user/user.service';
import { EventService } from 'src/event/event.service';
import { EventParticipationService } from 'src/event-participation/event-participation.service';

@Injectable()
export class ProfileService {
  constructor(
    @InjectModel(Profile.name) private profileModel: Model<ProfileDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,

    private readonly userService: UserService,
    private readonly eventService: EventService,
    private readonly eventParticipationService: EventParticipationService,
  ) {}

  async createProfile(
    createProfileDto: CreateProfileDto,
  ): Promise<{ message: string; data: ProfileDocument }> {
    try {
      const { user_id, ...profileData } = createProfileDto;

      const user = await this.userModel.findOne({ uid: user_id });
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

  async updateProfileStatus(
    dto: UpdateProfileStatusDto,
  ): Promise<{ message: string; data: ProfileDocument }> {
    try {
      const { email, date_of_birth, status } = dto;

      const user = await this.userModel.findOne({ email }).exec();
      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (
        !('profile' in user) ||
        user.profile === undefined ||
        user.profile === null
      ) {
        throw new BadRequestException(
          'Profile of this user has not been created yet. Where did you get his DOB huh!?',
        );
      }

      const profile = await this.profileModel
        .findOne({
          _id: new Types.ObjectId(user.profile),
          date_of_birth,
        })
        .exec();

      if (!profile) {
        throw new NotFoundException(
          'Profile not found or date of birth mismatch',
        );
      }

      profile.is_approved = status;
      await profile.save();

      return { message: 'Profile Status updated successfully.', data: profile };
    } catch (error) {
      if (error instanceof NotFoundException || BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update profile.');
    }
  }

  /**
   * Deletes the user's account, including profile, hosted events, and attendance links.
   * Performs pre-deletion checks:
   *   - If any hosted event is live (ongoing), deletion is blocked.
   *   - If any hosted event is upcoming (or live) and has sold tickets, deletion is blocked.
   */
  async deleteAccount(userId: string): Promise<{
    message: string;
  }> {
    try {
      const user = await this.userService.findOneUserByKey('uid', userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // return { message: 'Account Deleted Successfully' };

      const profile = await this.findProfileById(String(user.data.profile._id));
      if (!profile) {
        throw new NotFoundException('Profile not found');
      }

      // Retrieve events hosted by the user
      const hostedEvents = await this.eventService.findAllEventsById(
        String(profile.data._id),
        true,
        false,
      );

      const now = new Date();
      // Check each hosted event for live/ongoing status or sold tickets
      for (const event of hostedEvents.data) {
        if (this.isEventLive(event, now)) {
          throw new HttpException(
            'Cannot delete account: You have a live event ongoing.',
            HttpStatus.BAD_REQUEST,
          );
        }
        if (this.isEventUpcoming(event, now)) {
          const ticketsSold = event.no_of_attendees - event.attendees.length;

          if (ticketsSold > 0) {
            console.log(event);
            throw new HttpException(
              'Cannot delete account: An upcoming event has sold tickets.',
              HttpStatus.BAD_REQUEST,
            );
          }
        }
      }

      // Retrieve events attended by the user
      const attendedEvents = await this.eventService.findAllEventsById(
        String(profile.data._id),
        false,
        true,
      );

      // Check each attended event for live status
      for (const event of attendedEvents.data) {
        if (this.isEventLive(event, now)) {
          throw new HttpException(
            'Cannot delete account: you are attending an event already, Please let it complete first. ',
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      // =======================  When everything is good to delete the account. =======================
      // GOTO every attended events and remove the link of this user from their event
      await this.eventParticipationService.deleteAllParticipationsByProfileId(
        String(profile.data._id),
      );

      // GOTO every hosted event and inside that goto every attendees and remove the link of that event from their attended event.
      await this.eventService.removeHostedEventReferences(
        String(profile.data._id),
      );

      await this.profileModel.deleteOne({ _id: profile.data._id }).exec();

      await this.userModel.deleteOne({ _id: user.data._id }).exec();

      return { message: 'Account Deleted Successfully' };
    } catch (error) {
      if (error instanceof NotFoundException || HttpException) {
        throw error;
      }
      console.log(error);
      throw new InternalServerErrorException('Failed to update profile.');
    }
  }

  /**
   * Determines if an event is live (ongoing) based on current time.
   */
  private isEventLive(event: Event, now: Date): boolean {
    return event.start_date <= now && event.end_date >= now;
  }

  /**
   * Determines if an event is upcoming.
   */
  private isEventUpcoming(event: Event, now: Date): boolean {
    return event.start_date > now;
  }
}
