import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RestaurantDocument = Restaurant & Document;

@Schema({ timestamps: true })
export class Restaurant {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: [String], required: false })
  images: string[];

  @Prop({
    type: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
      address: { type: String, required: true },
    },
    required: true,
  })
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };

  @Prop({ type: [String], required: true })
  cuisine_types: string[]; // Italian, Chinese, Nigerian, etc.

  @Prop({ required: true, min: 1, max: 5 })
  price_range: number; // 1 = $, 2 = $$, 3 = $$$, 4 = $$$$, 5 = $$$$$

  @Prop({ required: true })
  phone_number: string;

  @Prop({ required: false })
  email?: string;

  @Prop({ required: false })
  website?: string;

  @Prop({
    type: {
      monday: {
        open: String,
        close: String,
        closed: { type: Boolean, default: false },
      },
      tuesday: {
        open: String,
        close: String,
        closed: { type: Boolean, default: false },
      },
      wednesday: {
        open: String,
        close: String,
        closed: { type: Boolean, default: false },
      },
      thursday: {
        open: String,
        close: String,
        closed: { type: Boolean, default: false },
      },
      friday: {
        open: String,
        close: String,
        closed: { type: Boolean, default: false },
      },
      saturday: {
        open: String,
        close: String,
        closed: { type: Boolean, default: false },
      },
      sunday: {
        open: String,
        close: String,
        closed: { type: Boolean, default: false },
      },
    },
    required: true,
  })
  opening_hours: {
    monday: { open: string; close: string; closed: boolean };
    tuesday: { open: string; close: string; closed: boolean };
    wednesday: { open: string; close: string; closed: boolean };
    thursday: { open: string; close: string; closed: boolean };
    friday: { open: string; close: string; closed: boolean };
    saturday: { open: string; close: string; closed: boolean };
    sunday: { open: string; close: string; closed: boolean };
  };

  @Prop({ required: true, min: 0, max: 5 })
  average_rating: number;

  @Prop({ required: true, min: 0 })
  total_reviews: number;

  @Prop({ required: true, default: true })
  is_active: boolean;

  @Prop({ required: true, default: true })
  accepts_reservations: boolean;

  @Prop({ required: true, default: 10 })
  platform_discount_percentage: number; // 10% discount for platform users

  @Prop({ required: true, default: 5 })
  platform_commission_percentage: number; // 5% goes to platform

  @Prop({ required: true, default: 5 })
  diner_discount_percentage: number; // 5% goes to diners

  @Prop({
    type: [
      {
        reviewer: { type: Types.ObjectId, ref: 'Profile', required: true },
        rating: { type: Number, required: true, min: 1, max: 5 },
        review: { type: String, required: false },
        personal_dining: {
          type: Types.ObjectId,
          ref: 'PersonalDining',
          required: false,
        },
      },
    ],
    default: [],
  })
  reviews: {
    reviewer: Types.ObjectId;
    rating: number;
    review?: string;
    personal_dining?: Types.ObjectId;
  }[];

  @Prop({ type: [String], required: false, default: [] })
  amenities: string[]; // WiFi, Parking, Outdoor Seating, etc.

  @Prop({ required: false })
  google_place_id?: string;

  @Prop({ type: Date, default: Date.now })
  verified_at?: Date;

  @Prop({ required: true, default: false })
  is_partner: boolean; // Partner restaurants get priority

  @Prop({ type: [Types.ObjectId], ref: 'PersonalDining', default: [] })
  active_personal_dining: Types.ObjectId[]; // For map display - only open personal dining experiences

  @Prop({ type: [Types.ObjectId], ref: 'Event', default: [] })
  active_public_events: Types.ObjectId[]; // For map display - only public group events
}

export const RestaurantSchema = SchemaFactory.createForClass(Restaurant);

// Index for location-based queries
RestaurantSchema.index({ 'location.latitude': 1, 'location.longitude': 1 });
RestaurantSchema.index({ cuisine_types: 1 });
RestaurantSchema.index({ price_range: 1 });
RestaurantSchema.index({ average_rating: -1 });
