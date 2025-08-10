import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type EventDocument = Event & Document;

@Schema({ timestamps: true })
export class Event {
  //   _id: Types.ObjectId; // Explicitly declaring _id for type safety

  @Prop({ type: Types.ObjectId, required: true, ref: 'Profile' })
  host_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Restaurant', required: true })
  restaurant_id: Types.ObjectId;



  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, type: Date })
  start_date: Date;

  @Prop({ required: true, type: Date })
  end_date: Date;

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

  @Prop({ required: true })
  cover_picture: string;

  @Prop({ required: true })
  ticket_price: number;

  @Prop({ required: true, type: Number })
  no_of_attendees: number;

  @Prop({ required: false, type: Number })
  slots: number;

  @Prop({
    type: [{ type: Types.ObjectId, ref: 'EventParticipation' }],
    required: false,
    default: [],
  })
  attendees: Types.ObjectId[];

  @Prop({ required: true, type: Boolean })
  is_public: boolean;

  @Prop({
    type: [
      {
        reviewer: { type: Types.ObjectId, ref: 'Profile', required: true },
        rating: { type: Number, required: true, min: 1, max: 5 },
        review: { type: String, required: false },
      },
    ],
    default: [],
  })
  reviews: { reviewer: Types.ObjectId; rating: number; review?: string }[];
}

export const EventSchema = SchemaFactory.createForClass(Event);

EventSchema.pre<EventDocument>('save', function (next) {
  if (this.isNew && (this.slots === undefined || this.slots === null)) {
    this.slots = this.no_of_attendees;
  }
  next();
});
