import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { Event, EventDocument } from './schema/event.schema';
import { Profile, ProfileDocument } from 'src/profile/schema/profile.schema';
import { JoinEventDto } from './dto/join-event.dto';
import { EventParticipationService } from 'src/event-participation/event-participation.service';

@Injectable()
export class EventService {
  constructor(
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
    @InjectModel(Profile.name) private profileModel: Model<ProfileDocument>,
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

      const totalCount = Number(await this.eventModel.countDocuments(query));
      const events = await this.eventModel
        .find(query)
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
}
