import { Module } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Profile, ProfileSchema } from './schema/profile.schema';
import { User, UserSchema } from 'src/user/schema/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Profile.name, schema: ProfileSchema }]),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  providers: [ProfileService],
  controllers: [ProfileController],
})
export class ProfileModule {}
