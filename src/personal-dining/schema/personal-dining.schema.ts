import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { DiningStatus } from '../enums/personal-dinning.enum';

export type PersonalDiningDocument = PersonalDining & Document;

export enum InvitationType {
  DIRECT = 'direct', // Direct invitation to specific user
  OPEN = 'open', // Open invitation, anyone can accept
}

export enum JoinRequestStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
}

@Schema({ timestamps: true })
export class PersonalDining {
  @Prop({ type: Types.ObjectId, ref: 'Profile', required: true })
  host_id: Types.ObjectId; // Person creating the dining experience

  @Prop({ type: Types.ObjectId, ref: 'Profile', required: false })
  guest_id?: Types.ObjectId; // Person being invited or who accepts

  @Prop({ type: Types.ObjectId, ref: 'Restaurant', required: true })
  restaurant_id: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, type: Date })
  dining_date: Date;

  @Prop({ required: true })
  dining_time: string;

  @Prop({ required: true, min: 30, max: 300 })
  estimated_duration: number;

  @Prop({ required: false })
  special_requests?: string;

  @Prop({ enum: DiningStatus, required: true, default: DiningStatus.PENDING })
  status: DiningStatus;

  @Prop({ enum: InvitationType, required: true, default: InvitationType.OPEN })
  invitation_type: InvitationType;

  @Prop({ required: false })
  invitation_message?: string;

  @Prop({ required: true, min: 0 })
  estimated_cost_per_person: number;

  @Prop({ required: true, default: false })
  host_pays_all: boolean;

  @Prop({ type: Date, required: false })
  accepted_at?: Date;

  @Prop({ type: Date, required: false })
  confirmed_at?: Date;

  @Prop({ type: Date, required: false })
  completed_at?: Date;

  @Prop({ type: Date, required: false })
  cancelled_at?: Date;

  @Prop({ required: false })
  cancellation_reason?: string;

  // Payment and commission tracking
  @Prop({ type: Types.ObjectId, ref: 'Payment', required: false })
  payment_id?: Types.ObjectId;

  @Prop({ required: true, default: 0 })
  platform_commission: number;

  @Prop({ required: true, default: 0 })
  diner_discount: number;

  @Prop({ required: true, default: 0 })
  total_bill_amount: number;

  // Reviews
  @Prop({
    type: {
      host_review: {
        rating: { type: Number, min: 1, max: 5 },
        comment: { type: String },
        reviewed_at: { type: Date, default: Date.now },
      },
      guest_review: {
        rating: { type: Number, min: 1, max: 5 },
        comment: { type: String },
        reviewed_at: { type: Date, default: Date.now },
      },
    },
    required: false,
  })
  reviews?: {
    host_review?: {
      rating: number;
      comment?: string;
      reviewed_at: Date;
    };
    guest_review?: {
      rating: number;
      comment?: string;
      reviewed_at: Date;
    };
  };

  // Tracking fields
  @Prop({ required: true, default: true })
  is_visible_on_map: boolean; // For Google Maps display

  @Prop({ type: Date, required: false })
  expires_at?: Date; // When the invitation expires

  @Prop({ type: [String], required: false, default: [] })
  tags: string[]; // business, casual, romantic, etc.

  // Join requests for public personal dining experiences
  @Prop({
    type: [
      {
        requester_id: { type: Types.ObjectId, ref: 'Profile', required: true },
        status: {
          type: String,
          enum: JoinRequestStatus,
          required: true,
          default: JoinRequestStatus.PENDING,
        },
        message: { type: String, required: false },
        requested_at: { type: Date, default: Date.now },
        responded_at: { type: Date, required: false },
      },
    ],
    required: false,
    default: [],
  })
  join_requests: {
    requester_id: Types.ObjectId;
    status: JoinRequestStatus;
    message?: string;
    requested_at: Date;
    responded_at?: Date;
  }[];

  // Public dining visibility flag
  @Prop({ required: true, default: false })
  is_public: boolean; // Whether this can be seen on map for join requests
}

export const PersonalDiningSchema =
  SchemaFactory.createForClass(PersonalDining);

// Indexes for efficient queries
PersonalDiningSchema.index({ host_id: 1 });
PersonalDiningSchema.index({ guest_id: 1 });
PersonalDiningSchema.index({ restaurant_id: 1 });
PersonalDiningSchema.index({ dining_date: 1 });
PersonalDiningSchema.index({ status: 1 });
PersonalDiningSchema.index({ invitation_type: 1 });
PersonalDiningSchema.index({ is_visible_on_map: 1 });
PersonalDiningSchema.index({ is_public: 1 });
PersonalDiningSchema.index({ expires_at: 1 });
PersonalDiningSchema.index({ 'join_requests.requester_id': 1 });
PersonalDiningSchema.index({ 'join_requests.status': 1 });

// Pre-save middleware to set expiration and visibility logic
PersonalDiningSchema.pre<PersonalDiningDocument>('save', function (next) {
  if (this.isNew && !this.expires_at) {
    // Set expiration for open invitations OR public dining
    if (this.invitation_type === InvitationType.OPEN || this.is_public) {
      this.expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    }
  }

  // Set map visibility based on public flag and status
  // Only show on map if it's public, PENDING (available for join requests), and not expired
  if (
    this.is_public &&
    this.status === DiningStatus.PENDING && // Only pending - not accepted!
    !this.guest_id && // No guest assigned yet
    (!this.expires_at || this.expires_at > new Date())
  ) {
    this.is_visible_on_map = true;
  } else {
    this.is_visible_on_map = false;
  }

  next();
});
