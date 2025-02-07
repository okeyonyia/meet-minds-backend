import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
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
}
