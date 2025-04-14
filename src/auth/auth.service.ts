// src/auth/auth.service.ts
import { Injectable } from '@nestjs/common';
import { FirebaseAdminService } from './firebase/firebase-admin.service';
import { DecodedIdToken } from 'firebase-admin/lib/auth/token-verifier';

@Injectable()
export class AuthService {
    constructor(private readonly firebaseAdminService: FirebaseAdminService) {}

    async verify(token: string): Promise<DecodedIdToken> {
        return await this.firebaseAdminService.verifyIdToken(token);
    }
}
