import { Controller, Get } from '@nestjs/common';
import { Public } from './decorators/public.decorator';

@Controller('auth')
export class AuthController {
  @Public()
  @Get('/login')
  LoginUser() {}
}
