import { IsEnum, IsEmail, IsString } from 'class-validator';
import { ApprovedByAdminStatus } from '../schema/profile.schema';

export class UpdateProfileStatusDto {
  @IsEmail()
  email: string;

  // @IsString()
  // date_of_birth: string; // Should be in ISO format (YYYY-MM-DD)

  @IsEnum(ApprovedByAdminStatus)
  status: ApprovedByAdminStatus;
}
