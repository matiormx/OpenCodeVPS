export interface AuthUser {
  authenticated: boolean;
  token?: string;
  role?: string;
  expiresAt?: number;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  message?: string;
  expiresIn?: string;
}
