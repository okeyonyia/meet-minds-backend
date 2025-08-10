import { Module } from '@nestjs/common';
import { EventController } from './event.controller';
import { EventService } from './event.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Event, EventSchema } from './schema/event.schema';
import { Profile, ProfileSchema } from 'src/profile/schema/profile.schema';
import { Restaurant, RestaurantSchema } from 'src/restaurant/schema/restaurant.schema';
import { EventParticipationModule } from 'src/event-participation/event-participation.module';
import { RestaurantModule } from 'src/restaurant/restaurant.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Event.name, schema: EventSchema }]),
    MongooseModule.forFeature([{ name: Profile.name, schema: ProfileSchema }]),
    MongooseModule.forFeature([{ name: Restaurant.name, schema: RestaurantSchema }]),
    EventParticipationModule,
    RestaurantModule,
  ],
  controllers: [EventController],
  providers: [EventService],
  exports: [EventService],
})
export class EventModule {}
