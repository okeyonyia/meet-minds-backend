import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProfileDocument = Profile & Document;

@Schema({ timestamps: true })
export class Profile {
    @Prop({ required: true })
    first_name: string;

    @Prop({ required: true })
    last_name: string;

    @Prop({ required: true })
    age: number;

    @Prop({ required: true })
    gender: string;

    @Prop()
    profile_picture_url?: string;

    @Prop()
    bio?: string;

    @Prop()
    linkedin_url?: string;

    @Prop([String])
    interests: string[];

    @Prop({ required: true })
    dating_preference: string;  // 'romantic', 'professional', 'both'
}

export const ProfileSchema = SchemaFactory.createForClass(Profile);
