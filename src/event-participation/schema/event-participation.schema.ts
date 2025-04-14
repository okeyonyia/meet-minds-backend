import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type EventParticipationDocument = EventParticipation & Document;

export enum EventJoinStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
}

@Schema({ timestamps: true })
export class EventParticipation {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Profile', required: true })
  profile: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Event', required: true })
  event: Types.ObjectId;

  @Prop({
    required: true,
    enum: EventJoinStatus,
    default: EventJoinStatus.PENDING,
  })
  status: EventJoinStatus;

  @Prop({ type: Types.ObjectId, ref: 'Payment', required: false })
  payment?: Types.ObjectId;

  //   @Prop({ required: false })
  //   cancel_reason?: string; // Reason if the user cancels participation

  //   @Prop({ type: Boolean, default: false })
  //   checked_in?: boolean; // If the user has checked in at the event
}

export const EventParticipationSchema =
  SchemaFactory.createForClass(EventParticipation);
