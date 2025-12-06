export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  roles: string;
  companyId: number | null;
  roleId: number | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface LoginResponse {
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    roles: string;
    companyId: number | null;
    roleId: number | null;
    accessToken: string;
    refreshToken: string;
  };
  status: string;
  statusCode: number;
}

export interface TokenRefreshRequest {
  refresh_token: string;
}

export interface RefreshTokenResponse {
  refreshToken: string;
  accessToken: string;
}

export interface RegisterResponse {
  regToken: string;
  userId: number;
  status: string;
  statusCode: number;
}

export interface VerifyEmailResponse {
  status: string;
  statusCode: number;
}

export interface VerifyEmailRequest {
  token: string;
}
