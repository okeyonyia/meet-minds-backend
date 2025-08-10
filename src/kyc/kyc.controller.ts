import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { KycService } from './kyc.service';
import { VerifyKycDto } from './dto/verify-kyc.dto';

@ApiTags('kyc-verification')
@Controller('kyc')
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @ApiOperation({
    summary: 'Verify user KYC',
    description:
      'Verify user identity through Know Your Customer (KYC) process',
  })
  @ApiResponse({
    status: 200,
    description: 'KYC verification completed successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid KYC data or verification failed',
  })
  @ApiBearerAuth()
  @Post('verify')
  async verifyUser(@Body() verifyKycDto: VerifyKycDto) {
    return this.kycService.verifyUser(verifyKycDto);
  }
}
