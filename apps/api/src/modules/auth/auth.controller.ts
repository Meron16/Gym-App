import { Body, Controller, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";
import type { FirebaseLoginRequestDto } from "./dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("firebase-login")
  async firebaseLogin(@Body() dto: FirebaseLoginRequestDto) {
    return this.authService.firebaseLogin(dto);
  }
}

