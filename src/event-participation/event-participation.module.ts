import { Module } from '@nestjs/common';
import { EventParticipationService } from './event-participation.service';
import { EventParticipationController } from './event-participation.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  EventParticipation,
  EventParticipationSchema,
} from './schema/event-participation.schema';
import { EventSchema } from 'src/event/schema/event.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EventParticipation.name, schema: EventParticipationSchema },
    ]),
    MongooseModule.forFeature([{ name: Event.name, schema: EventSchema }]),
  ],
  providers: [EventParticipationService],
  controllers: [EventParticipationController],
  exports: [EventParticipationService, MongooseModule],
})
export class EventParticipationModule {}
