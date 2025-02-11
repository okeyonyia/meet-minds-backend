import { Module } from '@nestjs/common';
import { EventController } from './event.controller';
import { EventService } from './event.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Event, EventSchema } from './schema/event.schema';
import { Profile, ProfileSchema } from 'src/profile/schema/profile.schema';
import { EventParticipationService } from 'src/event-participation/event-participation.service';
import {
  EventParticipation,
  EventParticipationSchema,
} from 'src/event-participation/schema/event-participation.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Event.name, schema: EventSchema }]),
    MongooseModule.forFeature([{ name: Profile.name, schema: ProfileSchema }]),
    MongooseModule.forFeature([
      { name: EventParticipation.name, schema: EventParticipationSchema },
    ]),
  ],
  controllers: [EventController],
  providers: [EventService, EventParticipationService],
})
export class EventModule {}
