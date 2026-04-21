import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import type {
  FirebaseLoginRequestDto,
  LoginRequestDto,
  RegisterRequestDto,
} from './dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  async register(@Body() dto: RegisterRequestDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async login(@Body() dto: LoginRequestDto) {
    return this.authService.login(dto);
  }

  @Post('firebase-login')
  async firebaseLogin(@Body() dto: FirebaseLoginRequestDto) {
    return this.authService.firebaseLogin(dto);
  }
}
