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
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { Event, EventDocument } from './schema/event.schema';
import { Profile, ProfileDocument } from 'src/profile/schema/profile.schema';
import { JoinEventDto } from './dto/join-event.dto';
import { EventParticipationService } from 'src/event-participation/event-participation.service';
import {
  EventParticipation,
  EventParticipationDocument,
} from 'src/event-participation/schema/event-participation.schema';
import { CreateEventReviewDto } from './dto/create-event-review.dto';
import { SuggestEventDto } from './dto/suggest-event.dto';
import * as geolib from 'geolib';
import stringSimilarity from 'string-similarity';

@Injectable()
export class EventService {
  constructor(
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
    @InjectModel(Profile.name) private profileModel: Model<ProfileDocument>,
    @InjectModel(EventParticipation.name)
    private eventParticipationModel: Model<EventParticipationDocument>,

    private readonly eventParticipationService: EventParticipationService,
  ) {}

  async createEvent(
    createEventDto: CreateEventDto,
  ): Promise<{ message: string; data: Event }> {
    try {
      const profile = await this.profileModel.findById(createEventDto.host_id);
      if (!profile) {
        throw new NotFoundException(
          `Profile with ID ${createEventDto.host_id} not found`,
        );
      }

      const newEvent = new this.eventModel(createEventDto);
      if (!newEvent) {
        throw new NotFoundException(
          `Could Not Create Event, Please Try again Later`,
        );
      }

      profile.hosting_events.push(Object(newEvent._id));
      await profile.save();

      await newEvent.save();

      // Populating host info
      const populatedEvent = await this.eventModel
        .findById(newEvent._id)
        .populate('host_id', 'full_name profile_pictures')
        .exec();

      return { message: 'Event Created Successfully', data: populatedEvent };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.log(error);
      throw new BadRequestException('Error creating event');
    }
  }

  async findAllEvents(
    filters: { [key: string]: any } = {},
    page: number = 1,
    limit: number = 10,
  ): Promise<{ message: string; data: Event[]; totalCount: number }> {
    try {
      let query: any = {};

      // Delete page and limit from filter it gets included automatically.
      delete filters.page;
      delete filters.limit;

      if (Object.keys(filters).length > 0) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) {
            switch (key) {
              case 'text':
                const allFields = Object.keys(this.eventModel.schema.paths);

                query.$or = allFields
                  .map((field) => {
                    const fieldType =
                      this.eventModel.schema.paths[field].instance;

                    if (fieldType === 'String') {
                      return { [field]: { $regex: value, $options: 'i' } };
                    } else if (fieldType === 'Number') {
                      const numValue = Number(value);
                      return !isNaN(numValue) ? { [field]: numValue } : null;
                    } else if (fieldType === 'Date') {
                      const inputDate = new Date(value);
                      if (!isNaN(inputDate.getTime())) {
                        return {
                          [field]: {
                            $gte: new Date(value),
                            $lte: new Date(value),
                          },
                        };
                      }
                      return null;
                    }

                    return null; // Skip other data types
                  })
                  .filter(Boolean); // Remove null values
                break;

              case 'capacity':
                query.no_of_attendees = { $gte: Number(value) };
                break;

              case 'date':
                if (value.match(/^\d{4}$/)) {
                  // If only a year is provided (e.g., "2025")
                  query.$or = [
                    { start_date: { $regex: `^${value}-`, $options: 'i' } },
                    { end_date: { $regex: `^${value}-`, $options: 'i' } },
                  ];
                } else if (value.match(/^\d{4}-\d{2}$/)) {
                  // If year + month is provided (e.g., "2025-01")
                  query.$or = [
                    { start_date: { $regex: `^${value}-`, $options: 'i' } },
                    { end_date: { $regex: `^${value}-`, $options: 'i' } },
                  ];
                } else {
                  // If a full date is provided (YYYY-MM-DD)
                  const searchDate = new Date(value);
                  query.$or = [
                    { start_date: { $gte: searchDate } },
                    { end_date: { $lte: searchDate } },
                  ];
                }
                break;

              default:
                // 🔹 Auto-apply regex for partial matching on all string fields
                query[key] =
                  typeof value === 'string'
                    ? { $regex: value, $options: 'i' }
                    : value;
            }
          }
        });
      }

      query.end_date = { $gte: new Date() };

      const totalCount = Number(await this.eventModel.countDocuments(query));
      const events = await this.eventModel
        .find(query)
        .sort({ start_date: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('host_id', 'full_name profile_pictures')
        .exec();

      if (!events || events.length === 0) {
        return {
          message: 'No events found',
          data: [],
          totalCount: totalCount ?? 0,
        };
      }

      return {
        message: 'Events retrieved successfully',
        data: events,
        totalCount: totalCount ?? 0,
      };
    } catch (error) {
      throw new BadRequestException('Events not found');
    }
  }

  async findAllEventsById(
    userId: string,
    hosting?: boolean,
    attending?: boolean,
  ): Promise<{ message: string; data: Event[] }> {
    try {
      const user = await this.profileModel
        .findById(userId)
        .select('hosting_events attending_events')
        .exec();

      if (!user) {
        throw new NotFoundException('User not found');
      }

      let eventIds: Types.ObjectId[] = [];

      if (hosting && attending) {
        eventIds = [...user.hosting_events, ...user.attending_events];
      } else if (hosting) {
        eventIds = user.hosting_events;
      } else if (attending) {
        eventIds = user.attending_events;
      } else {
        eventIds = [...user.hosting_events, ...user.attending_events];
      }

      const events = await this.eventModel
        .find({ _id: { $in: eventIds } })
        .populate('host_id', 'full_name profile_pictures')
        .populate({
          path: 'attendees',
          model: 'EventParticipation',
          select: 'full_name location profile_pictures',
          options: { slice: { profile_pictures: 1 } },
        })
        .exec();

      if (!events || events.length === 0) {
        return { message: 'No events found', data: [] };
      }

      return { message: 'Events retrieved successfully', data: events };
    } catch (error) {
      throw new BadRequestException('Failed to retrieve events');
    }
  }

  async findEventById(id: string): Promise<{ message: string; data: Event }> {
    try {
      const event = await this.eventModel
        .findById(id)
        .populate({
          path: 'attendees',
          model: 'EventParticipation',
          populate: {
            path: 'profile',
            model: 'Profile',
            select: 'full_name location profile_pictures',
          },
        })
        .exec();
      if (!event) throw new NotFoundException('Event not found');

      return { message: 'Event retrieved successfully', data: event };
    } catch (error) {
      throw new NotFoundException('Error finding event');
    }
  }

  async findAllAttendeesByEventId(
    id: string,
  ): Promise<{ message: string; data: Event }> {
    try {
      const event = await this.eventModel
        .findById(id)
        .populate('host_id', 'full_name profile_pictures')
        .populate({
          path: 'attendees',
          model: 'EventParticipation',
          populate: {
            path: 'profile',
            model: 'Profile',
            select: 'full_name location profile_pictures',
            options: { slice: { profile_pictures: 1 } },
          },
        })
        .exec();
      if (!event) throw new NotFoundException('Event not found');

      return { message: 'Attendees retrieved successfully', data: event };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Error finding event');
    }
  }

  async updateEvent(
    id: string,
    updateEventDto: UpdateEventDto,
  ): Promise<{ message: string; data: Event }> {
    try {
      const updatedEvent = await this.eventModel
        .findByIdAndUpdate(id, updateEventDto, { new: true })
        .populate('host_id', 'full_name profile_pictures')
        .exec();
      if (!updatedEvent) throw new NotFoundException('Event not found');

      return { message: 'Event updated successfully', data: updatedEvent };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else if (error.name === 'CastError') {
        throw new BadRequestException(`Invalid Event ID: ${id}`);
      }
      throw new InternalServerErrorException('Failed to update Event.');
    }
  }

  async deleteEvent(id: string): Promise<{ message: string; data: Event }> {
    try {
      const event = await this.eventModel.findById(id).exec();
      if (!event) throw new NotFoundException('Event not found');

      const profile = await this.profileModel.findById(event.host_id).exec();
      if (!profile) {
        throw new NotFoundException(
          `Profile with ID ${event.host_id} not found`,
        );
      }

      const profileUpdate = await this.profileModel
        .updateOne(
          { _id: event.host_id },
          { $pull: { events: new Types.ObjectId(id) } },
        )
        .exec();

      if (profileUpdate.modifiedCount === 0) {
        console.warn(
          `Event reference might not have been found in the profile.`,
        );
      }

      const deletedEvent = await this.eventModel
        .findByIdAndDelete(id)
        .populate('host_id', 'full_name profile_pictures')
        .exec();

      return { message: 'Event Deleted Successfully', data: deletedEvent };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Error deleting event');
    }
  }

  async joinEvent(
    joinEventDto: JoinEventDto,
  ): Promise<{ message: string; data: Event }> {
    const { eventId, profileId } = joinEventDto;
    try {
      const event = await this.eventModel.findById(eventId).exec();

      if (!event) {
        throw new NotFoundException('Event not found');
      }

      const profile = await this.profileModel.findById(profileId).exec();

      if (!profile) {
        throw new NotFoundException('Profile not found');
      }

      // if (!profile.is_kyc_verified) {
      //   throw new ForbiddenException(
      //     'User must complete KYC verification first.',
      //   );
      // }

      const createdParticipation =
        await this.eventParticipationService.createParticipation({
          event: eventId,
          profile: profileId,
        });

      // Updating the id into profile and event
      event.attendees.push(createdParticipation.data._id);

      profile.attending_events.push(new Types.ObjectId(eventId));

      event.slots = Math.max(0, event.no_of_attendees - event.attendees.length);

      await event.save();
      await profile.save();

      const updatedEvent = await this.eventModel
        .findById(eventId)
        .populate({
          path: 'attendees',
          model: 'EventParticipation',
          populate: {
            path: 'profile',
            model: 'Profile',
            select: 'full_name location profile_pictures',
            options: { slice: { profile_pictures: 1 } },
          },
        })
        .populate({
          path: 'host_id',
          select: 'full_name profile_pictures',
        })
        .exec();

      return { message: 'Successfully joined the event', data: updatedEvent };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.error(error);
      throw new InternalServerErrorException('Failed to join the event');
    }
  }

  async unjoinEvent(
    userId: string,
    eventId: string,
  ): Promise<{ message: string; data: Event }> {
    try {
      // Check if the event exists
      const event = await this.eventModel.findById(eventId).exec();
      if (!event) {
        throw new NotFoundException('Event not found');
      }

      // Check if the user exists
      const user = await this.profileModel.findById(userId).exec();
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Check if the user is attending the event
      if (!event.attendees.some((attendee) => attendee.equals(userId))) {
        throw new BadRequestException('User is not attending this event');
      }

      // Remove user from event attendees
      event.attendees = event.attendees.filter(
        (attendee) => !attendee.equals(userId),
      );

      // Remove event from user's attending events list
      user.attending_events = user.attending_events.filter(
        (attendedEvent) => !attendedEvent.equals(eventId),
      );

      // Increase available slots (if slots exist)
      if (event.slots !== undefined) {
        event.slots += 1;
      }

      // Save both documents
      await event.save();
      await user.save();

      return { message: 'Successfully left the event', data: event };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.error(error);
      throw new InternalServerErrorException('Failed to leave the event');
    }
  }

  async removeHostedEventReferences(
    profileId: string,
  ): Promise<{ message: string; statusCode: number }> {
    try {
      const hostedEvents = await this.eventModel
        .find({ host_id: profileId })
        .exec();

      if (hostedEvents.length === 0) {
        return {
          message: 'User has no hosted events to clean up.',
          statusCode: HttpStatus.NOT_FOUND,
        };
      }

      const eventIds = hostedEvents.map((event) => String(event._id));

      // Step 2: Find all participation records for these events
      const participations = await this.eventParticipationModel
        .find({ event: { $in: eventIds } })
        .exec();

      if (participations.length > 0) {
        // Extract profile IDs of all attendees
        const profileIds = participations.map((participation) =>
          String(participation.profile),
        );

        const objectEventIds = eventIds.map((id) => new Types.ObjectId(id));
        // Step 3: Remove the event references from attendees' profiles in one bulk update
        await this.profileModel
          .updateMany(
            { _id: { $in: profileIds } },
            { $pull: { attending_events: { $in: objectEventIds } } }, // Remove event from their attending_events list
          )
          .exec();

        // Step 4: Delete all participation records related to these events
        await this.eventParticipationModel
          .deleteMany({ event: { $in: objectEventIds } })
          .exec();
      }

      // Step 5: Delete the hosted events
      await this.eventModel.deleteMany({ _id: { $in: eventIds } }).exec();

      return {
        message:
          'All hosted events and their references have been removed successfully.',
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      throw error;
    }
  }

  async addReview(
    createEventReviewDto: CreateEventReviewDto,
  ): Promise<{ message: string; statusCode: number }> {
    const { event_id, profile_id, rating, review } = createEventReviewDto;

    try {
      const event = await this.eventModel.findById(event_id).populate({
        path: 'attendees',
        model: 'EventParticipation',
        populate: {
          path: 'profile',
          model: 'Profile',
          select: 'full_name',
        },
      });
      if (!event) {
        throw new NotFoundException('Event not found');
      }

      // Ensure the event has finished
      if (new Date() < event.end_date) {
        throw new HttpException(
          'Event has not finished yet',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Check that the user is an attendee
      const attendees = event.attendees as {
        profile?: { _id: Types.ObjectId };
      }[];

      if (
        !attendees.some(
          (att) =>
            att.profile && att.profile._id.toString() === profile_id.toString(),
        )
      ) {
        throw new HttpException(
          'Only attendees can review the event',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Optionally, check if the user has already submitted a reviews
      const alreadyReviewed = event.reviews.find(
        (r) => r.reviewer.toString() === profile_id,
      );
      if (alreadyReviewed) {
        throw new HttpException(
          'User has already reviewed this event',
          HttpStatus.BAD_REQUEST,
        );
      }

      const reviewerId = new Types.ObjectId(profile_id);
      event.reviews.push({ reviewer: reviewerId, rating, review });
      await event.save();

      return {
        message: 'Review submitted successfully',
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      if (error instanceof NotFoundException || HttpException) {
        throw error;
      }
      console.error(error);
      throw new InternalServerErrorException('Failed to submit review');
    }
  }

  /**
   * Get reviews with optional filters:
   * - `profile_id`: Fetch reviews by a specific user
   * - `top`: Limit number of reviews (e.g., top 3)
   */
  async getReviews(
    profile_id?: string,
    top?: number,
  ): Promise<{ message: string; statusCode: number; data: any[] }> {
    try {
      const events = await this.eventModel
        .find({ host_id: profile_id })
        .populate({
          path: 'reviews.reviewer',
          model: 'Profile',
          select: 'full_name profile_pictures',
        })
        .select('reviews title')
        .exec();

      let reviews = events.flatMap((event) =>
        event.reviews.map((review) => ({
          rating: review.rating,
          review: review.review,
          reviewer_id: review.reviewer?._id || null,
          reviewer_name: (review.reviewer as any).full_name,
          reviewer_profile_pic: (review.reviewer as any).profile_pictures?.[0],
          event_name: event.title,
        })),
      );
      if (top) {
        reviews = reviews.sort((a, b) => b.rating - a.rating).slice(0, top);
      }

      return {
        data: reviews,
        message: 'Reviews Retrived successfully',
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      console.error(error);
      throw new NotFoundException('Error fetching reviews');
    }
  }

  private SCORE_WEIGHTS = {
    interest: 3,
    goal: 2,
    soft: 1,
    location: 2,
    timeOverlapHigh: 2,
    timeOverlapMedium: 1,
  };

  async findBestMatchingEvent(
    data: SuggestEventDto,
  ): Promise<{ message: string; statusCode: number; data: Event | null }> {
    const { profile_id, available_from, available_to } = data;

    console.log('Coming inside service');

    const profile = await this.profileModel.findById(profile_id);
    if (!profile) throw new Error('Profile not found');

    profile.available_from = available_from;
    profile.available_to = available_to;
    await profile.save();

    const now = new Date();
    let events = await this.eventModel.find({
      start_date: { $lte: available_to, $gte: now },
      end_date: { $gte: available_from },
      status: { $ne: 'pending' },
      _id: { $nin: profile.attending_events },
      is_full: { $ne: true },
    });

    if (!events.length) {
      console.warn('⚠️ No relevant events found. Fallback triggered.');
      events = await this.eventModel.find({
        status: { $ne: 'pending' },
        _id: { $nin: profile.attending_events },
        is_full: { $ne: true },
        start_date: { $gte: now },
      });
    }

    if (!events.length) {
      console.error('❌ No events available');
      return {
        message: 'No events available',
        statusCode: HttpStatus.NOT_FOUND,
        data: null,
      };
    }

    const scoredEvents = events.map((event) => {
      let score = 0;
      const combinedText = `${event.title} ${event.description}`.toLowerCase();

      // Interest match (fuzzy)
      const interestScore = profile.interests.reduce((acc, interest) => {
        return (
          acc +
          stringSimilarity.compareTwoStrings(
            combinedText,
            interest.toLowerCase(),
          ) *
            this.SCORE_WEIGHTS.interest
        );
      }, 0);
      score += interestScore;

      // Goal match (fuzzy)
      const goalScore = profile.user_goal.reduce((acc, goal) => {
        return (
          acc +
          stringSimilarity.compareTwoStrings(combinedText, goal.toLowerCase()) *
            this.SCORE_WEIGHTS.goal
        );
      }, 0);
      score += goalScore;

      // Soft fields match
      const softFields = [
        profile.bio,
        profile.profession,
        profile.industry,
        profile.gender,
      ].filter(Boolean);
      const softScore = softFields.reduce((acc, field) => {
        return (
          acc +
          stringSimilarity.compareTwoStrings(
            combinedText,
            field.toLowerCase(),
          ) *
            this.SCORE_WEIGHTS.soft
        );
      }, 0);
      score += softScore;

      // Location match using distance
      const profileLoc = profile.location;
      const eventLoc = event.location;

      if (profileLoc && eventLoc) {
        const distance = geolib.getDistance(
          { latitude: profileLoc.latitude, longitude: profileLoc.longitude },
          { latitude: eventLoc.latitude, longitude: eventLoc.longitude },
        );
        if (distance < 5000) score += this.SCORE_WEIGHTS.location; // within 5km
      }

      // Time overlap
      score += this.calculateTimeOverlapScore(
        event,
        available_from,
        available_to,
      );

      return { event, score };
    });

    const sorted = scoredEvents
      .sort((a, b) => b.score - a.score)
      .map((e, index) => ({
        ...e,
        tieBreaker: e.event.start_date.getTime() + index,
      }));

    const topEvent = sorted[0];

    console.log(
      `[Match Result] Best Score: ${topEvent?.score}, Event ID: ${topEvent?.event?._id}`,
    );

    return {
      message: 'Best matching event found',
      statusCode: HttpStatus.OK,
      data: topEvent?.event || null,
    };
  }

  private calculateTimeOverlapScore(
    event: Event,
    from: Date,
    to: Date,
  ): number {
    const eventStart = new Date(event.start_date).getTime();
    const eventEnd = new Date(event.end_date).getTime();
    const availStart = new Date(from).getTime();
    const availEnd = new Date(to).getTime();

    const overlapStart = Math.max(eventStart, availStart);
    const overlapEnd = Math.min(eventEnd, availEnd);
    const overlapDuration = Math.max(0, overlapEnd - overlapStart);
    const totalRange = eventEnd - eventStart;

    if (totalRange <= 0) return 0;

    const ratio = overlapDuration / totalRange;
    if (ratio > 0.5) return this.SCORE_WEIGHTS.timeOverlapHigh;
    if (ratio > 0.25) return this.SCORE_WEIGHTS.timeOverlapMedium;
    return 0;
  }
}
