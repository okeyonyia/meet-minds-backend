import { Module } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Profile, ProfileSchema } from './schema/profile.schema';
import { User, UserSchema } from 'src/user/schema/user.schema';
import { UserService } from 'src/user/user.service';
import { EventModule } from 'src/event/event.module';
import { EventParticipationModule } from 'src/event-participation/event-participation.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Profile.name, schema: ProfileSchema }]),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    EventModule,
    EventParticipationModule,
    AuthModule,
  ],
  providers: [ProfileService, UserService],
  controllers: [ProfileController],
  exports: [MongooseModule],
})
export class ProfileModule {}
