import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  EventJoinStatus,
  EventParticipation,
  EventParticipationDocument,
} from './schema/event-participation.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateEventParticipationDto } from './dto/create-event-participation.dto';
import { Event, EventDocument } from 'src/event/schema/event.schema';

@Injectable()
export class EventParticipationService {
  constructor(
    @InjectModel(EventParticipation.name)
    private eventParticipationModel: Model<EventParticipationDocument>,

    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
  ) {}

  async createParticipation(
    createEventParticipationDto: CreateEventParticipationDto,
  ): Promise<{ message: string; data: EventParticipation }> {
    try {
      const { event, profile } = createEventParticipationDto;

      const eventData = await this.eventModel.findById(event);

      if (!eventData) {
        throw new NotFoundException('Event not found.');
      }

      // ✅ Check if event slots are full
      const participationCount =
        await this.eventParticipationModel.countDocuments({ event });
      if (
        eventData.slots !== undefined &&
        participationCount >= eventData.slots
      ) {
        throw new BadRequestException('Event is fully booked.');
      }

      const existingParticipation = await this.eventParticipationModel.findOne({
        event,
        profile,
      });

      if (existingParticipation) {
        throw new BadRequestException(
          'User is already participating in this event.',
        );
      }

      const newParticipation = new this.eventParticipationModel(
        createEventParticipationDto,
      );

      if (eventData.ticket_price === 0) {
        newParticipation.status = EventJoinStatus.CONFIRMED;
      }

      await newParticipation.save();

      return {
        message: 'Successfully joined the event',
        data: newParticipation,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      } else if (error.name === 'CastError') {
        throw new BadRequestException('Invalid Event ID or Profile ID');
      }
      console.error(error);
      throw new InternalServerErrorException('Failed to join the event.');
    }
  }

  async getAllParticipationByEventId(
    eventId: string,
  ): Promise<{ message: string; data: EventParticipation[] }> {
    try {
      // ✅ Check if event exists
      const eventData = await this.eventModel.findById(eventId);
      if (!eventData) {
        throw new NotFoundException('Event not found.');
      }

      // ✅ Fetch all participations for this event, and populate user details
      const participations = await this.eventParticipationModel
        .find({ event: eventId })
        .populate({
          path: 'profile',
          select: 'full_name profile_pictures', // Only fetch necessary fields
        })
        .exec();

      return {
        message: 'Event participation retrieved successfully',
        data: participations,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else if (error.name === 'CastError') {
        throw new BadRequestException('Invalid Event ID format');
      }
      console.error(error);
      throw new InternalServerErrorException(
        'Failed to retrieve event participation.',
      );
    }
  }

  async getAllParticipants(): Promise<{
    message: string;
    data: EventParticipation[];
  }> {
    try {
      const eventParticipantData = await this.eventParticipationModel.find();
      if (!eventParticipantData) {
        throw new NotFoundException('Event Participant not found.');
      }

      return {
        message: 'Event participation retrieved successfully',
        data: eventParticipantData,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else if (error.name === 'CastError') {
        throw new BadRequestException('Invalid Event ID format');
      }
      console.error(error);
      throw new InternalServerErrorException(
        'Failed to retrieve event participation.',
      );
    }
  }

  async getParticipantById(id): Promise<{
    message: string;
    data: EventParticipation;
  }> {
    try {
      const eventParticipantData =
        await this.eventParticipationModel.findOne(id);
      if (!eventParticipantData) {
        throw new NotFoundException('Event Participant not found.');
      }

      return {
        message: 'Event participation retrieved successfully',
        data: eventParticipantData,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else if (error.name === 'CastError') {
        throw new BadRequestException('Invalid Event ID format');
      }
      console.error(error);
      throw new InternalServerErrorException(
        'Failed to retrieve event participation.',
      );
    }
  }

  async deleteParticipantById(id: string): Promise<{
    message: string;
    data: EventParticipation;
  }> {
    try {
      const eventParticipantData =
        await this.eventParticipationModel.findByIdAndDelete(id);
      if (!eventParticipantData) {
        throw new NotFoundException('Event Participant not found.');
      }

      return {
        message: 'Event participation retrieved successfully',
        data: eventParticipantData,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else if (error.name === 'CastError') {
        throw new BadRequestException('Invalid Event ID format');
      }
      console.error(error);
      throw new InternalServerErrorException(
        'Failed to retrieve event participation.',
      );
    }
  }

  async deleteAllParticipationsByProfileId(
    profileId: string,
  ): Promise<{ message: string; statusCode: number }> {
    try {
      // Step 1: Find all event participations for the profile
      const participations = await this.eventParticipationModel
        .find({ profile: profileId })
        .exec();

      // if (participations.length === 0) {
      //   throw new NotFoundException(
      //     'No event participations found for this profile.',
      //   );
      // }

      // Step 2: Extract all event IDs where the user participated
      const eventIds = participations.map(
        (participation) => participation.event,
      );

      // Step 3: Bulk remove user's participation reference from all events in one query
      await this.eventModel
        .updateMany(
          { _id: { $in: eventIds } }, // Target all events where the user participated
          { $pull: { attendees: { $in: participations.map((p) => p._id) } } }, // Remove participation references
        )
        .exec();

      // // // Step 4: Bulk delete all participation records for the user
      await this.eventParticipationModel
        .deleteMany({ profile: profileId })
        .exec();

      return {
        message: 'All event participations deleted successfully.',
        statusCode: 200,
      };
    } catch (error) {
      throw error;
    }
  }
}
