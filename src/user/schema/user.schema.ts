import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  uid: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ type: String, ref: 'Profile', required: false })
  profile?: string;
}
export const UserSchema = SchemaFactory.createForClass(User);
