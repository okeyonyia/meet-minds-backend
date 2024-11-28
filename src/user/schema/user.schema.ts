import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Gender } from '../dto/create-user.dto';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  static calculateAge(birthday: Date): number {
    const today = new Date();
    const birthDate = new Date(birthday);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();

    if (
      monthDifference < 0 ||
      (monthDifference === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  }

  @Prop({ required: true })
  first_name: string;

  @Prop({ required: true })
  last_name: string;

  @Prop({ required: true })
  birthday: Date;

  @Prop()
  age: number;

  @Prop({ required: true, enum: Gender })
  gender: Gender;

  @Prop({ required: true })
  height: string;

  @Prop({ required: true })
  story: string;

  @Prop({ required: true })
  religion: string;

  @Prop({ type: [String], required: true })
  languages: string[];

  @Prop({ required: true })
  education: string;

  @Prop({ required: true })
  profession: string;

  @Prop({ required: true })
  work_location: string;

  @Prop({ required: true })
  drinking_habit: string;

  @Prop({ required: true })
  smoking_habit: string;

  @Prop({ type: [String], required: true })
  interests: string[];

  @Prop({ type: [String], default: [] })
  profile_pictures?: string[];
}

export const UserSchema = SchemaFactory.createForClass(User);

/**
 * Pre-save middleware to calculate the age based on the birthday.
 */
UserSchema.pre('save', function (next) {
  if (this.birthday) {
    this.age = User.calculateAge(this.birthday);
  }
  next();
});
