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

@Injectable()
export class EventService {
  constructor(
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
    @InjectModel(Profile.name) private profileModel: Model<ProfileDocument>,
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

      profile.events.push(Object(newEvent._id));
      await profile.save();

      await newEvent.save();

      return { message: 'Event Created Successfully', data: newEvent };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.log(error);
      throw new BadRequestException('Error creating event');
    }
  }

  async findAllEvents(): Promise<{ message: string; data: Event[] }> {
    try {
      const events = await this.eventModel.find().exec();
      if (!events || events.length === 0) {
        return { message: 'No events found', data: [] };
      }

      return { message: 'Events retrieved successfully', data: events };
    } catch (error) {
      throw new BadRequestException('Events not found');
    }
  }

  async findEventById(id: string): Promise<{ message: string; data: Event }> {
    try {
      const event = await this.eventModel.findById(id).exec();
      if (!event) throw new NotFoundException('Event not found');

      return { message: 'Event retrieved successfully', data: event };
    } catch (error) {
      throw new NotFoundException('Error finding event');
    }
  }

  async updateEvent(
    id: string,
    updateEventDto: UpdateEventDto,
  ): Promise<{ message: string; data: Event }> {
    try {
      const updatedEvent = await this.eventModel
        .findByIdAndUpdate(id, updateEventDto, { new: true })
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

      const deletedEvent = await this.eventModel.findByIdAndDelete(id).exec();

      return { message: 'Event Deleted Successfully', data: deletedEvent };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Error deleting event');
    }
  }
}
