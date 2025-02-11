import { Body, Controller, Post } from '@nestjs/common';
import { KycService } from './kyc.service';
import { VerifyKycDto } from './dto/verify-kyc.dto';

@Controller('kyc')
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Post('verify')
  async verifyUser(@Body() verifyKycDto: VerifyKycDto) {
    return this.kycService.verifyUser(verifyKycDto);
  }
}
