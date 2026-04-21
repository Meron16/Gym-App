export interface FirebaseLoginRequestDto {
  idToken: string;
}

export interface AuthProfileDto {
  id: string;
  role: 'user' | 'operator' | 'admin';
  email?: string;
}

export interface FirebaseLoginResponseDto {
  accessToken: string;
  profile: AuthProfileDto;
}

export interface RegisterRequestDto {
  email: string;
  password: string;
  fullName?: string;
  /** Digits only; optional */
  phone?: string;
}

export interface LoginRequestDto {
  email: string;
  password: string;
}
