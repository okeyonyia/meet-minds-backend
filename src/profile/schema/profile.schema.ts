import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Gender } from '../dto/create-profile.dto';

export type ProfileDocument = Profile & Document;

@Schema({ timestamps: true })
export class Profile {
  _id: Types.ObjectId; // Declare _id explicitly in TypeScript for type safety

  @Prop({ required: true })
  full_name: string;

  @Prop({ required: false })
  phone_number?: string;

  @Prop({ required: true })
  date_of_birth: Date;

  @Prop({ required: true })
  bio: string;

  @Prop({ required: false })
  profession?: string;

  @Prop({ required: true, enum: Gender })
  gender: string;

  @Prop({ type: [String], required: true, min: 1 })
  user_goal: string[];

  @Prop({ type: [String], required: true, min: 1 })
  interests: string[];

  @Prop({ type: [String], required: true, min: 1 })
  profile_pictures: string[];

  @Prop({
    type: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
      address: { type: String, required: false },
    },
    required: false,
  })
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
}

export const ProfileSchema = SchemaFactory.createForClass(Profile);
