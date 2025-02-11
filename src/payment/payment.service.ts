import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { CreatePaymentDTO } from './dto/create-payment.dto';
import axios from 'axios';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Payment, PaymentDocument } from './schema/payment.schema';
import {
  EventParticipation,
  EventParticipationDocument,
} from 'src/event-participation/schema/event-participation.schema';

@Injectable()
export class PaymentService {
  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @InjectModel(EventParticipation.name)
    private eventParticipationModel: Model<EventParticipationDocument>,
  ) {}

  async getAllPayments() {
    const payments = await this.paymentModel.find().exec();
    if (!payments) {
      throw new HttpException('No payments found', HttpStatus.NOT_FOUND);
    }
    return payments;
  }

  async createPayment(createPaymentDTO: CreatePaymentDTO) {
    try {
      const existingPayment = await this.paymentModel.findOne({
        reference: createPaymentDTO.reference,
      });

      if (existingPayment) {
        throw new HttpException(
          'Duplicate payment reference detected',
          HttpStatus.CONFLICT,
        );
      }

      const eventParticipationData = await this.eventParticipationModel.findOne(
        { profile: createPaymentDTO.userID, event: createPaymentDTO.eventID },
      );

      if (!eventParticipationData) {
        throw new HttpException(
          'User is not participating in this event',
          HttpStatus.UNAUTHORIZED,
        );
      }

      const newPayment = new this.paymentModel({
        userID: createPaymentDTO.userID,
        eventID: createPaymentDTO.eventID,
        reference: createPaymentDTO.reference,
        amount: createPaymentDTO.amount,
        status: 'pending',
      });
      await newPayment.save();

      eventParticipationData.payment = newPayment._id;
      await eventParticipationData.save();

      return {
        message: 'Payment initiated, awaiting verification.',
        data: newPayment,
      };
    } catch (error) {
      if (error.code === 11000) {
        throw new HttpException(
          'Duplicate entry detected',
          HttpStatus.CONFLICT,
        );
      }

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async verifyPayment(reference: string) {
    try {
      // 🔹 Step 1: Verify the transaction on Paystack
      const response = await axios.get(
        `https://api.paystack.co/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          },
        },
      );

      if (!response.data.status) {
        throw new HttpException(response.data.message, HttpStatus.BAD_REQUEST);
      }

      // 🔹 Step 2: Find the payment record
      const payment = await this.paymentModel.findOne({ reference });

      if (!payment) {
        throw new HttpException('Payment not found', HttpStatus.NOT_FOUND);
      }

      // 🔹 Step 3: If successful, update payment status & event participation
      if (response.data.data.status === 'success') {
        payment.status = 'success';
        await payment.save();

        // 🔹 Step 4: Update event participation to `CONFIRMED`
        await this.eventParticipationModel.updateOne(
          { profile: payment.userID, status: 'pending' },
          { $set: { status: 'confirmed', payment: payment._id } },
        );

        return {
          message: 'Payment verified and event participation confirmed!',
        };
      }

      payment.status = 'failed';
      await payment.save();

      return { message: 'Payment verification failed.', statusCode: 200 };
    } catch (error) {
      throw new HttpException(
        'Payment verification failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
