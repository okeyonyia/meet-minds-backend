import * as admin from 'firebase-admin';
import { BadRequestException, Injectable } from '@nestjs/common';
import * as path from 'path';

import * as dotenv from 'dotenv';

dotenv.config(); // Load env vars

let fbServiceAccountKey: admin.ServiceAccount;

if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
  // Vercel / ENV-based setup
  fbServiceAccountKey = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
} else {
  // Local file-based fallback
  fbServiceAccountKey = require(path.resolve('./fbServiceAccountKey.json'));
}
@Injectable()
export class FirebaseAdminService {
  constructor() {
    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert(
          fbServiceAccountKey as admin.ServiceAccount,
        ),
      });
    }
  }

  getAuth() {
    return admin.auth();
  }

  async verifyIdToken(idToken: string) {
    return await this.getAuth().verifyIdToken(idToken);
  }

  async verifyFirebaseUid(firebaseUid: string): Promise<void> {
    try {
      // Fetch the user by UID from Firebase to ensure it's valid
      const user = await this.getAuth().getUser(firebaseUid);
      console.log('User found:', user); // Log the user data to verify
    } catch (error) {
      console.error('Error in Firebase UID verification:', error);
      if (error.code === 'auth/user-not-found') {
        throw new BadRequestException(
          'User not found with the given Firebase UID.',
        );
      }
      throw new BadRequestException('Invalid Firebase UID.');
    }
  }
}
