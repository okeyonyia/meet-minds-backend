import { Injectable, UnauthorizedException } from '@nestjs/common';
import axios from 'axios';
import { VerifyKycDto } from './dto/verify-kyc.dto';

@Injectable()
export class KycService {
  private SMILE_ID_PARTNER_ID = process.env.SMILE_ID_PARTNER_ID;
  private SMILE_ID_API_KEY = process.env.SMILE_ID_API_KEY;
  private SMILE_ID_AUTH_TOKEN = process.env.SMILE_ID_AUTH_TOKEN;
  private SMILE_ID_URL = process.env.SMILE_ID_API_URL + 'job'; // Ensure "/job" is added

  async verifyUser(verifyKycDto: VerifyKycDto) {
    const { document, profileId, selfie } = verifyKycDto;
    try {
      const payload = {
        partner_id: this.SMILE_ID_PARTNER_ID,
        job_type: 2, // Document Verification
        user_id: profileId,
        images: [
          { image_type_id: 0, image: selfie }, // Selfie Image
          { image_type_id: 1, image: document }, // Document Image
        ],
        source_sdk: 'node',
        source_sdk_version: '1.0',
      };

      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.SMILE_ID_AUTH_TOKEN}`,
      };

      console.log('Sending request to Smile ID API:', payload);

      const response = await axios.post(this.SMILE_ID_URL, payload, {
        headers,
      });

      if (!response.data.success) {
        throw new UnauthorizedException('Verification failed.');
      }

      return {
        success: true,
        message: 'User Verified!',
        verificationId: response.data.verificationId,
        verificationStatus: response.data.status || 'Approved',
      };
    } catch (error) {
      console.error('Smile ID API Error:', error);
      throw new UnauthorizedException('Verification process failed.');
    }
  }
}
