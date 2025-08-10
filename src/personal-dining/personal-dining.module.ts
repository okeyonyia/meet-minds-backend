import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PersonalDiningController } from './personal-dining.controller';
import { PersonalDiningService } from './personal-dining.service';
import {
  PersonalDining,
  PersonalDiningSchema,
} from './schema/personal-dining.schema';
import {
  Restaurant,
  RestaurantSchema,
} from '../restaurant/schema/restaurant.schema';
import { Profile, ProfileSchema } from '../profile/schema/profile.schema';
import { RestaurantModule } from '../restaurant/restaurant.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PersonalDining.name, schema: PersonalDiningSchema },
      { name: Restaurant.name, schema: RestaurantSchema },
      { name: Profile.name, schema: ProfileSchema },
    ]),
    RestaurantModule,
  ],
  controllers: [PersonalDiningController],
  providers: [PersonalDiningService],
  exports: [PersonalDiningService],
})
export class PersonalDiningModule {}
