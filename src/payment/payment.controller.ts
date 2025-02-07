import { Body, Controller, Get, Injectable, Param, Post } from '@nestjs/common';
import { CreatePaymentDTO } from './dto/create-payment.dto';
import { PaymentService } from './payment.service';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get()
  async getAllPayments() {
    return this.paymentService.getAllPayments();
  }

  @Post('pay')
  async createPayment(@Body() createPayment: CreatePaymentDTO) {
    return this.paymentService.createPayment(createPayment);
  }

  @Get('verify/:reference')
  async verifyPayment(@Param('reference') reference: string) {
    return this.paymentService.verifyPayment(reference);
  }
}
