import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Injectable,
  Param,
  Post,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CreatePaymentDTO } from './dto/create-payment.dto';
import { PaymentService } from './payment.service';

@ApiTags('payments')
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @ApiOperation({
    summary: 'Get all payments',
    description: 'Retrieve all payment records in the system',
  })
  @ApiResponse({ status: 200, description: 'Payments retrieved successfully' })
  @ApiBearerAuth()
  @Get()
  async getAllPayments() {
    return this.paymentService.getAllPayments();
  }

  @ApiOperation({
    summary: 'Get payment by ID',
    description: 'Retrieve a specific payment record by its ID',
  })
  @ApiParam({ name: 'id', description: 'Payment ID', example: '507f1f77bcf86cd799439016' })
  @ApiResponse({ status: 200, description: 'Payment retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  @ApiBearerAuth()
  @Get(':id')
  async getPaymentById(@Param('id') id: string) {
    return this.paymentService.getPaymentById(id);
  }

  @ApiOperation({
    summary: 'Initiate payment',
    description: 'Create and initiate a new payment transaction',
  })
  @ApiResponse({ status: 201, description: 'Payment initiated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid payment data' })
  @ApiBearerAuth()
  @Post('initiate')
  async createPayment(@Body() createPayment: CreatePaymentDTO) {
    return this.paymentService.createPayment(createPayment);
  }

  @ApiOperation({
    summary: 'Verify payment',
    description: 'Verify a payment transaction using its reference code',
  })
  @ApiParam({ name: 'reference', description: 'Payment reference code', example: 'PAY_1234567890ABCDEF' })
  @ApiResponse({ status: 200, description: 'Payment verification completed' })
  @ApiResponse({ status: 404, description: 'Payment reference not found' })
  @Get('verify/:reference')
  async verifyPayment(@Param('reference') reference: string) {
    return this.paymentService.verifyPayment(reference);
  }
}
