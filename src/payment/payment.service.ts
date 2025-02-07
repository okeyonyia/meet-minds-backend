import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { CreatePaymentDTO } from './dto/create-payment.dto';
import axios from 'axios';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Payment, PaymentDocument } from './schema/payment.schema';

@Injectable()
export class PaymentService {
  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
  ) {}

  async getAllPayments() {
    const payments = await this.paymentModel.find().exec();
    if (!payments) {
      throw new HttpException('No payments found', HttpStatus.NOT_FOUND);
    }
    return payments;
  }

  async createPayment(createPayment: CreatePaymentDTO) {
    const { email, userID, amount } = createPayment;

    try {
      // Create a subscription on Paystack
      const response = await axios.post(
        'https://api.paystack.co/transaction/initialize',
        {
          email,
          amount,
          callback_url: 'https://example.com/callback',
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          },
        },
      );

      if (!response.data.status) {
        throw new HttpException(response.data.message, HttpStatus.BAD_REQUEST);
      }

      const newPayment = await new this.paymentModel({
        userID,
        email,
        reference: response.data.data.reference,
        status: 'pending',
      }).save();

      return {
        payment: newPayment,
        paymentUrl: response.data.data.authorization_url,
        status: 200,
      };
    } catch (error) {
      if (error.response && error.response.status === 404) {
        throw new HttpException(
          'Paystack endpoint not found',
          HttpStatus.NOT_FOUND,
        );
      }
      throw new HttpException(
        'Payment initialization failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async verifyPayment(reference: string) {
    try {
      // Verify the transaction on Paystack
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

      const payment = await this.paymentModel.findOne({ reference });

      if (!payment) {
        throw new HttpException('Payment not found', HttpStatus.NOT_FOUND);
      }

      if (response.data.data.status === 'success') {
        payment.status = 'success';
      } else {
        payment.status = 'failed';
      }

      console.log('payment => ', JSON.stringify(payment, null, 2));
      await payment.save();
      return payment;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        throw new HttpException(
          'Paystack endpoint not found',
          HttpStatus.NOT_FOUND,
        );
      }
      throw new HttpException(
        'Payment verification failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
