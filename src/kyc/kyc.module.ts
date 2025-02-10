import { Module } from '@nestjs/common';
import { KycService } from './kyc.service';
import { KycController } from './kyc.controller';

@Module({
  providers: [KycService],
  controllers: [KycController]
})
export class KycModule {}
