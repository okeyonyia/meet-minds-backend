import { Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { InjectModel } from '@nestjs/mongoose';
import { Profile, ProfileDocument } from './profile/schema/profile.schema';
import { Model } from 'mongoose';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @InjectModel(Profile.name)
    private readonly profileModel: Model<ProfileDocument>,
  ) {}

  @Post('migrate-privacy')
  async migrateProfilePrivacy() {
    const defaultPrivacy = {
      show_age: false,
      get_invited: true,
      show_attended_events: true,
    };

    const result = await this.profileModel.updateMany(
      { profile_privacy: { $exists: false } },
      { $set: { profile_privacy: defaultPrivacy } },
    );

    return {
      modifiedCount: result.modifiedCount,
      message: `Successfully added profile_privacy to ${result.modifiedCount} documents.`,
    };
  }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
