import { IsString, IsEnum } from 'class-validator';

export class VerifyKycDto {
  @IsString()
  profileId: string;

  @IsString()
  selfie: string;

  @IsString()
  document: string;
}
