import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class JoinRequestPersonalDiningDto {
  @ApiProperty({
    description: 'Profile ID of the person requesting to join',
    example: '507f1f77bcf86cd799439012',
  })
  @IsString()
  requester_id: string;

  @ApiPropertyOptional({
    description: 'Optional message from the requester to the host',
    example:
      'Hi! I would love to join you for dinner. I enjoy Italian cuisine and good conversation.',
    maxLength: 300,
  })
  @IsString()
  @IsOptional()
  message?: string;
}

export class RespondToJoinRequestDto {
  @ApiProperty({
    description: 'ID of the join request to respond to',
    example: '507f1f77bcf86cd799439015',
  })
  @IsString()
  request_id: string;

  @ApiProperty({
    description: "Host's response to the join request",
    example: 'accept',
    enum: ['accept', 'decline'],
  })
  @IsString()
  response: 'accept' | 'decline';

  @ApiPropertyOptional({
    description: 'Optional message from host when responding',
    example: 'Looking forward to meeting you!',
    maxLength: 200,
  })
  @IsString()
  @IsOptional()
  response_message?: string;
}
