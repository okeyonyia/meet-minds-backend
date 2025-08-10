import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  PersonalDining,
  PersonalDiningDocument,
  InvitationType,
} from './schema/personal-dining.schema';
import {
  Restaurant,
  RestaurantDocument,
} from '../restaurant/schema/restaurant.schema';
import { Profile, ProfileDocument } from '../profile/schema/profile.schema';
import { CreatePersonalDiningDto } from './dto/create-personal-dining.dto';
import {
  RespondToPersonalDiningDto,
  ResponseType,
  ReviewPersonalDiningDto,
  CompletePersonalDiningDto,
} from './dto/respond-personal-dining.dto';
import { RestaurantService } from '../restaurant/restaurant.service';
import { DiningStatus } from './enums/personal-dinning.enum';
import {
  JoinRequestPersonalDiningDto,
  RespondToJoinRequestDto,
} from './dto/join-request-personal-dining.dto';
import { JoinRequestStatus } from './schema/personal-dining.schema';
import { TimeSlot, createTimeSlotQuery } from '../common/enums/time-slot.enum';

@Injectable()
export class PersonalDiningService {
  constructor(
    @InjectModel(PersonalDining.name)
    private personalDiningModel: Model<PersonalDiningDocument>,
    @InjectModel(Restaurant.name)
    private restaurantModel: Model<RestaurantDocument>,
    @InjectModel(Profile.name)
    private profileModel: Model<ProfileDocument>,
    private readonly restaurantService: RestaurantService,
  ) {}

  async createPersonalDining(
    createPersonalDiningDto: CreatePersonalDiningDto,
  ): Promise<{ message: string; data: PersonalDining }> {
    try {
      const { host_id, guest_id, restaurant_id, dining_date, dining_time } =
        createPersonalDiningDto;

      // Validate host exists
      const host = await this.profileModel.findById(host_id);
      if (!host) {
        throw new NotFoundException('Host profile not found');
      }

      // Validate restaurant exists and is active
      const restaurant = await this.restaurantModel.findById(restaurant_id);
      if (!restaurant || !restaurant.is_active) {
        throw new NotFoundException('Restaurant not found or inactive');
      }

      // Validate guest exists if direct invitation
      if (guest_id) {
        const guest = await this.profileModel.findById(guest_id);
        if (!guest) {
          throw new NotFoundException('Guest profile not found');
        }

        if (host_id === guest_id) {
          throw new BadRequestException('Cannot invite yourself to dinner');
        }
      }

      // Validate logical consistency: public dining shouldn't have pre-assigned guests
      if (createPersonalDiningDto.is_public && guest_id) {
        throw new BadRequestException(
          'Public dining experiences cannot have pre-assigned guests. Either make it private (is_public: false) or remove guest_id to allow join requests.',
        );
      }

      // Check if dining date is in the future
      const diningDateTime = new Date(
        `${dining_date.toISOString().split('T')[0]}T${dining_time}:00`,
      );
      if (diningDateTime <= new Date()) {
        throw new BadRequestException('Dining date must be in the future');
      }

      // Check restaurant operating hours
      const dayOfWeek = diningDateTime
        .toLocaleDateString('en-US', { weekday: 'long' })
        .toLowerCase();
      const restaurantHours = restaurant.opening_hours[dayOfWeek];

      if (restaurantHours.closed) {
        throw new BadRequestException(`Restaurant is closed on ${dayOfWeek}s`);
      }

      // Check if time is within operating hours
      const diningTimeNumber = parseInt(dining_time.replace(':', ''));
      const openTime = parseInt(restaurantHours.open.replace(':', ''));
      const closeTime = parseInt(restaurantHours.close.replace(':', ''));

      if (diningTimeNumber < openTime || diningTimeNumber > closeTime) {
        throw new BadRequestException(
          `Restaurant is closed at ${dining_time}. Open hours: ${restaurantHours.open} - ${restaurantHours.close}`,
        );
      }

      // Determine invitation type and public visibility
      const invitationType = guest_id
        ? InvitationType.DIRECT
        : InvitationType.OPEN;

      // Public dining can be seen by others on map for join requests
      const isPublic = createPersonalDiningDto.is_public || false;

      const newPersonalDining = new this.personalDiningModel({
        ...createPersonalDiningDto,
        host_id: new Types.ObjectId(host_id),
        guest_id: guest_id ? new Types.ObjectId(guest_id) : undefined,
        restaurant_id: new Types.ObjectId(restaurant_id),
        status: DiningStatus.PENDING,
        invitation_type: invitationType,
        is_public: isPublic,
        // Map visibility is handled by schema middleware based on is_public flag
      });

      await newPersonalDining.save();

      // Personal dining is never added to restaurant's active list for map display
      // Only Events (group dining) should appear on the map when public

      const populatedExperience = await this.personalDiningModel
        .findById(newPersonalDining._id)
        .populate('host_id', 'full_name profile_pictures')
        .populate('guest_id', 'full_name profile_pictures')
        .populate(
          'restaurant_id',
          'name location images cuisine_types price_range',
        )
        .exec();

      return {
        message: 'Personal dining experience created successfully',
        data: populatedExperience,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.error('Error creating personal dining:', error);
      throw new InternalServerErrorException(
        'Failed to create personal dining experience',
      );
    }
  }

  async respondToPersonalDining(
    experienceId: string,
    respondDto: RespondToPersonalDiningDto,
  ): Promise<{ message: string; data: PersonalDining }> {
    try {
      const { guest_id, response } = respondDto;

      const experience = await this.personalDiningModel.findById(experienceId);
      if (!experience) {
        throw new NotFoundException('Personal dining experience not found');
      }

      // Validate guest
      if (
        experience.invitation_type === InvitationType.DIRECT &&
        experience.guest_id?.toString() !== guest_id
      ) {
        throw new ForbiddenException('You are not the invited guest');
      }

      if (experience.status !== DiningStatus.PENDING) {
        throw new BadRequestException('This invitation is no longer available');
      }

      // Check if expired
      if (experience.expires_at && new Date() > experience.expires_at) {
        experience.status = DiningStatus.CANCELLED;
        experience.cancellation_reason = 'Invitation expired';
        await experience.save();
        throw new BadRequestException('This invitation has expired');
      }

      if (response === ResponseType.ACCEPT) {
        // Check for time conflicts before accepting
        await this.checkForTimeConflict(guest_id, experience);

        experience.guest_id = new Types.ObjectId(guest_id);
        experience.status = DiningStatus.ACCEPTED;
        experience.accepted_at = new Date();
      } else {
        experience.status = DiningStatus.DECLINED;
        experience.cancellation_reason =
          respondDto.message || 'Guest declined invitation';

        // Personal dining is never in restaurant's active list, so no need to remove
      }

      await experience.save();

      const populatedExperience = await this.personalDiningModel
        .findById(experienceId)
        .populate('host_id', 'full_name profile_pictures')
        .populate('guest_id', 'full_name profile_pictures')
        .populate(
          'restaurant_id',
          'name location images cuisine_types price_range',
        )
        .exec();

      return {
        message: `Personal dining invitation ${response}ed successfully`,
        data: populatedExperience,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      console.error('Error responding to personal dining:', error);
      throw new InternalServerErrorException(
        'Failed to respond to personal dining invitation',
      );
    }
  }

  async findPersonalDiningByUser(
    userId: string,
    status?: DiningStatus,
    asHost: boolean = true,
    asGuest: boolean = true,
  ): Promise<{ message: string; data: PersonalDining[] }> {
    try {
      const query: any = {};

      if (status) {
        query.status = status;
      }

      if (asHost && asGuest) {
        query.$or = [{ host_id: userId }, { guest_id: userId }];
      } else if (asHost) {
        query.host_id = userId;
      } else if (asGuest) {
        query.guest_id = userId;
      }

      const experiences = await this.personalDiningModel
        .find(query)
        .populate('host_id', 'full_name profile_pictures')
        .populate('guest_id', 'full_name profile_pictures')
        .populate(
          'restaurant_id',
          'name location images cuisine_types price_range',
        )
        .sort({ createdAt: -1 })
        .exec();

      return {
        message: 'User personal dining experiences retrieved successfully',
        data: experiences,
      };
    } catch (error) {
      console.error('Error finding user personal dining:', error);
      throw new InternalServerErrorException(
        'Failed to find user personal dining experiences',
      );
    }
  }

  async getPersonalDiningById(
    id: string,
  ): Promise<{ message: string; data: PersonalDining }> {
    try {
      const experience = await this.personalDiningModel
        .findById(id)
        .populate('host_id', 'full_name profile_pictures')
        .populate('guest_id', 'full_name profile_pictures')
        .populate(
          'restaurant_id',
          'name location images cuisine_types price_range opening_hours contact_info',
        )
        .exec();

      if (!experience) {
        throw new NotFoundException('Personal dining experience not found');
      }

      return {
        message: 'Personal dining experience retrieved successfully',
        data: experience,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error getting personal dining by ID:', error);
      throw new InternalServerErrorException(
        'Failed to retrieve personal dining experience',
      );
    }
  }

  async cancelPersonalDining(
    experienceId: string,
    userId: string,
    reason?: string,
  ): Promise<{ message: string }> {
    try {
      const experience = await this.personalDiningModel.findById(experienceId);
      if (!experience) {
        throw new NotFoundException('Personal dining experience not found');
      }

      // Only host or guest can cancel
      if (
        experience.host_id.toString() !== userId &&
        experience.guest_id?.toString() !== userId
      ) {
        throw new ForbiddenException(
          'You are not authorized to cancel this experience',
        );
      }

      if (experience.status === DiningStatus.COMPLETED) {
        throw new BadRequestException('Cannot cancel a completed experience');
      }

      if (experience.status === DiningStatus.CANCELLED) {
        throw new BadRequestException('Experience is already cancelled');
      }

      experience.status = DiningStatus.CANCELLED;
      experience.cancelled_at = new Date();
      experience.cancellation_reason = reason || 'Cancelled by user';

      await experience.save();

      // Personal dining is never in restaurant's active list, so no need to remove

      return {
        message: 'Personal dining experience cancelled successfully',
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      console.error('Error cancelling personal dining:', error);
      throw new InternalServerErrorException(
        'Failed to cancel personal dining experience',
      );
    }
  }

  async completePersonalDining(
    completeDto: CompletePersonalDiningDto,
  ): Promise<{ message: string; data: PersonalDining }> {
    try {
      const { personal_dining_id, total_bill_amount } = completeDto;

      const experience =
        await this.personalDiningModel.findById(personal_dining_id);
      if (!experience) {
        throw new NotFoundException('Personal dining experience not found');
      }

      if (experience.status !== DiningStatus.ACCEPTED) {
        throw new BadRequestException(
          'Experience must be accepted before completion',
        );
      }

      // Calculate commission (5% of bill)
      const commission = total_bill_amount * 0.05;
      const discount = total_bill_amount * 0.05;

      experience.status = DiningStatus.COMPLETED;
      experience.completed_at = new Date();
      experience.total_bill_amount = total_bill_amount;
      experience.platform_commission = commission;
      experience.diner_discount = discount;

      await experience.save();

      // Personal dining is never in restaurant's active list, so no need to remove

      const populatedExperience = await this.personalDiningModel
        .findById(personal_dining_id)
        .populate('host_id', 'full_name profile_pictures')
        .populate('guest_id', 'full_name profile_pictures')
        .populate(
          'restaurant_id',
          'name location images cuisine_types price_range',
        )
        .exec();

      return {
        message: 'Personal dining experience completed successfully',
        data: populatedExperience,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.error('Error completing personal dining:', error);
      throw new InternalServerErrorException(
        'Failed to complete personal dining experience',
      );
    }
  }

  async addReview(
    reviewDto: ReviewPersonalDiningDto,
  ): Promise<{ message: string }> {
    try {
      const { reviewer_id, personal_dining_id, rating, comment } = reviewDto;

      const experience =
        await this.personalDiningModel.findById(personal_dining_id);
      if (!experience) {
        throw new NotFoundException('Personal dining experience not found');
      }

      if (experience.status !== DiningStatus.COMPLETED) {
        throw new BadRequestException('Can only review completed experiences');
      }

      // Determine if reviewer is host or guest
      const isHost = experience.host_id.toString() === reviewer_id;
      const isGuest = experience.guest_id?.toString() === reviewer_id;

      if (!isHost && !isGuest) {
        throw new ForbiddenException(
          'You are not authorized to review this experience',
        );
      }

      if (!experience.reviews) {
        experience.reviews = {};
      }

      const reviewData = {
        rating,
        comment,
        reviewed_at: new Date(),
      };

      if (isHost) {
        if (experience.reviews.host_review) {
          throw new BadRequestException(
            'Host has already reviewed this experience',
          );
        }
        experience.reviews.host_review = reviewData;
      } else {
        if (experience.reviews.guest_review) {
          throw new BadRequestException(
            'Guest has already reviewed this experience',
          );
        }
        experience.reviews.guest_review = reviewData;
      }

      await experience.save();

      // Also add review to restaurant
      await this.restaurantService.addReview(
        experience.restaurant_id.toString(),
        reviewer_id,
        rating,
        comment,
        personal_dining_id,
      );

      return {
        message: 'Review added successfully',
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      console.error('Error adding review:', error);
      throw new InternalServerErrorException('Failed to add review');
    }
  }

  // NEW METHODS FOR PUBLIC DINING JOIN REQUESTS

  async getPublicPersonalDining(
    latitude?: number,
    longitude?: number,
    radius?: number,
    timeSlot?: TimeSlot,
  ): Promise<{ message: string; data: PersonalDining[] }> {
    try {
      const query: any = {
        is_public: true,
        is_visible_on_map: true,
        status: DiningStatus.PENDING,
        guest_id: { $exists: false }, // No guest assigned yet
        $or: [
          { expires_at: { $exists: false } },
          { expires_at: { $gt: new Date() } },
        ],
      };

      // Add time slot filtering if provided
      if (timeSlot && Object.values(TimeSlot).includes(timeSlot)) {
        const timeSlotQuery = createTimeSlotQuery(timeSlot, 'dining_time');
        Object.assign(query, timeSlotQuery);
      }

      const experiences = await this.personalDiningModel
        .find(query)
        .populate('host_id', 'full_name profile_pictures gender age')
        .populate(
          'restaurant_id',
          'name location images cuisine_types price_range',
        )
        .sort({ dining_date: 1 })
        .exec();

      // TODO: Add location-based filtering if coordinates are provided
      // Similar to restaurant nearby filtering

      return {
        message: 'Public personal dining experiences retrieved successfully',
        data: experiences,
      };
    } catch (error) {
      console.error('Error getting public personal dining:', error);
      throw new InternalServerErrorException(
        'Failed to retrieve public personal dining experiences',
      );
    }
  }

  async requestToJoin(
    experienceId: string,
    joinRequestDto: JoinRequestPersonalDiningDto,
  ): Promise<{ message: string }> {
    try {
      const { requester_id, message } = joinRequestDto;

      // Validate requester exists
      const requester = await this.profileModel.findById(requester_id);
      if (!requester) {
        throw new NotFoundException('Requester profile not found');
      }

      const experience = await this.personalDiningModel.findById(experienceId);
      if (!experience) {
        throw new NotFoundException('Personal dining experience not found');
      }

      // Validate this is a public experience
      if (!experience.is_public) {
        throw new BadRequestException('This is not a public dining experience');
      }

      // Check if experience is still available
      if (experience.status !== DiningStatus.PENDING) {
        throw new BadRequestException('This experience is no longer available');
      }

      if (experience.guest_id) {
        throw new BadRequestException('This experience already has a guest');
      }

      // Check if expired
      if (experience.expires_at && new Date() > experience.expires_at) {
        throw new BadRequestException('This invitation has expired');
      }

      // Cannot request to join your own experience
      if (experience.host_id.toString() === requester_id) {
        throw new BadRequestException(
          'Cannot request to join your own experience',
        );
      }

      // Check if user already has a pending request
      const existingRequest = experience.join_requests.find(
        (req) =>
          req.requester_id.toString() === requester_id &&
          req.status === JoinRequestStatus.PENDING,
      );

      if (existingRequest) {
        throw new BadRequestException(
          'You already have a pending request for this experience',
        );
      }

      // Check for time conflicts before allowing the join request
      await this.checkForTimeConflict(requester_id, experience);

      // Add join request
      experience.join_requests.push({
        requester_id: new Types.ObjectId(requester_id),
        status: JoinRequestStatus.PENDING,
        message: message || undefined,
        requested_at: new Date(),
      });

      await experience.save();

      return {
        message: 'Join request submitted successfully',
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.error('Error requesting to join:', error);
      throw new InternalServerErrorException(
        'Failed to retrieve join requests',
      );
    }
  }

  private async checkForTimeConflict(
    profileId: string,
    newExperience: PersonalDiningDocument,
  ): Promise<void> {
    const newDiningDateTime = new Date(
      `${newExperience.dining_date.toISOString().split('T')[0]}T${newExperience.dining_time}:00`,
    );
    const newExperienceStartTime = newDiningDateTime.getTime();
    const newExperienceEndTime =
      newExperienceStartTime + newExperience.estimated_duration * 60 * 1000;

    const bufferMilliseconds = 2 * 60 * 60 * 1000; // 2 hours

    const existingExperiences = await this.personalDiningModel.find({
      status: DiningStatus.ACCEPTED,
      _id: { $ne: newExperience._id },
      $or: [
        { host_id: new Types.ObjectId(profileId) },
        { guest_id: new Types.ObjectId(profileId) },
      ],
    });

    for (const existingExperience of existingExperiences) {
      const existingDiningDateTime = new Date(
        `${existingExperience.dining_date.toISOString().split('T')[0]}T${existingExperience.dining_time}:00`,
      );
      const existingExperienceStartTime = existingDiningDateTime.getTime();
      const existingExperienceEndTime =
        existingExperienceStartTime +
        existingExperience.estimated_duration * 60 * 1000;

      // Check for overlap with a 2-hour buffer on each side of the existing experience
      const conflict =
        newExperienceStartTime <
          existingExperienceEndTime + bufferMilliseconds &&
        existingExperienceStartTime - bufferMilliseconds < newExperienceEndTime;

      if (conflict) {
        throw new BadRequestException(
          `This dining time conflicts with another accepted experience. You must have at least a 2-hour gap between experiences.`,
        );
      }
    }
  }

  async respondToJoinRequest(
    experienceId: string,
    hostId: string,
    responseDto: RespondToJoinRequestDto,
  ): Promise<{ message: string; data: PersonalDining }> {
    try {
      const { request_id, response } = responseDto;

      const experience = await this.personalDiningModel.findById(experienceId);
      if (!experience) {
        throw new NotFoundException('Personal dining experience not found');
      }

      // Validate host
      if (experience.host_id.toString() !== hostId) {
        throw new ForbiddenException('You are not the host of this experience');
      }

      // Find the specific join request
      const requestIndex = experience.join_requests.findIndex(
        (req) =>
          req.requester_id.toString() === request_id &&
          req.status === JoinRequestStatus.PENDING,
      );

      if (requestIndex === -1) {
        throw new NotFoundException(
          'Join request not found or already responded to',
        );
      }

      const joinRequest = experience.join_requests[requestIndex];

      if (response === 'accept') {
        // Check for time conflicts before accepting the join request
        await this.checkForTimeConflict(
          joinRequest.requester_id.toString(),
          experience,
        );

        // Accept the request
        joinRequest.status = JoinRequestStatus.ACCEPTED;
        joinRequest.responded_at = new Date();

        // Set this person as the guest
        experience.guest_id = joinRequest.requester_id;
        experience.status = DiningStatus.ACCEPTED;
        experience.accepted_at = new Date();

        // Decline all other pending requests
        experience.join_requests.forEach((req, index) => {
          if (
            index !== requestIndex &&
            req.status === JoinRequestStatus.PENDING
          ) {
            req.status = JoinRequestStatus.DECLINED;
            req.responded_at = new Date();
          }
        });
      } else {
        // Decline the request
        joinRequest.status = JoinRequestStatus.DECLINED;
        joinRequest.responded_at = new Date();
      }

      await experience.save();

      const populatedExperience = await this.personalDiningModel
        .findById(experienceId)
        .populate('host_id', 'full_name profile_pictures')
        .populate('guest_id', 'full_name profile_pictures')
        .populate('join_requests.requester_id', 'full_name profile_pictures')
        .populate(
          'restaurant_id',
          'name location images cuisine_types price_range',
        )
        .exec();

      return {
        message: `Joined request ${response} successfully`,
        data: populatedExperience,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      console.error('Error responding to join request:', error);
      throw new InternalServerErrorException(
        'Failed to respond to join request',
      );
    }
  }

  async getJoinRequestsForHost(
    hostId: string,
  ): Promise<{ message: string; data: PersonalDining[] }> {
    try {
      const experiences = await this.personalDiningModel
        .find({
          host_id: hostId,
          is_public: true,
          'join_requests.status': JoinRequestStatus.PENDING,
        })
        .populate(
          'join_requests.requester_id',
          'full_name profile_pictures gender age bio',
        )
        .populate(
          'restaurant_id',
          'name location images cuisine_types price_range',
        )
        .sort({ createdAt: -1 })
        .exec();

      return {
        message: 'Join requests retrieved successfully',
        data: experiences,
      };
    } catch (error) {
      console.error('Error getting join requests:', error);
      throw new InternalServerErrorException(
        'Failed to retrieve join requests',
      );
    }
  }
}
