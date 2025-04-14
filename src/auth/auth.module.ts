import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { FirebaseAdminService } from './firebase/firebase-admin.service';

@Module({
    providers: [AuthService, FirebaseAdminService],
    exports: [AuthService, FirebaseAdminService],
})
export class AuthModule {}
