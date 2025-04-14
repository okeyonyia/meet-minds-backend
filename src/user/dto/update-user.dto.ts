import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['uid'] as const), // This will omit(remove) the uid from createuserdto, resulting exclude changes in uid but this DTO.
) {}
