import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type PaymentDocument = Payment & Document;

@Schema({ timestamps: true })
export class Payment {
  @Prop()
  userID: string;

  @Prop()
  email: string;

  @Prop()
  reference: string;

  @Prop()
  status: 'pending' | 'success' | 'failed';
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
