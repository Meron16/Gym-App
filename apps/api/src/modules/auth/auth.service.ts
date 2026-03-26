import { Injectable } from "@nestjs/common";
import { AuthProfileDto, FirebaseLoginRequestDto, FirebaseLoginResponseDto } from "./dto";

@Injectable()
export class AuthService {
  firebaseLogin(_dto: FirebaseLoginRequestDto): FirebaseLoginResponseDto {
    // MVP stub: later verify Firebase idToken + assign role from claims.
    const profile: AuthProfileDto = {
      id: "user_1",
      role: "user",
    };

    return {
      accessToken: `mock_token_${Date.now()}`,
      profile,
    };
  }
}

