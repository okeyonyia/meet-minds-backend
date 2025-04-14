import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateProfileDto } from './create-profile.dto';
import { ApprovedByAdminStatus } from '../schema/profile.schema';
import { IsEnum } from 'class-validator';

export class UpdateProfileDto extends PartialType(
  OmitType(CreateProfileDto, ['date_of_birth'] as const),
) {
  @IsEnum(ApprovedByAdminStatus)
  event_creation_approval: ApprovedByAdminStatus;
}
