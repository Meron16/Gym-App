export interface FirebaseLoginRequestDto {
  idToken: string;
}

export interface AuthProfileDto {
  id: string;
  role: "user" | "operator" | "admin";
  email?: string;
}

export interface FirebaseLoginResponseDto {
  accessToken: string;
  profile: AuthProfileDto;
}

