import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('authentication')
@Controller('auth')
export class AuthController {
  @ApiOperation({
    summary: 'User login',
    description: 'Authenticate user and generate access token',
  })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @Get('/login')
  LoginUser() {}
}
