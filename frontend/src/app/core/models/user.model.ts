export interface User {
  id: number;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  roles: string;
  companyId: number | null;
  avatarUrl: string | null;
  roleId: number | null;
  twoFactorEnabled?: boolean;
  isTwoFactorEnabled?: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthenticatedUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  roles: string;
  companyId: number | null;
  avatarUrl: string | null;
  roleId: number | null;
  accessToken: string;
  refreshToken: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface LoginSuccessResponse {
  user: AuthenticatedUser;
  status: 'success';
  statusCode: number;
}

export interface LoginTwoFactorRequiredResponse {
  pendingToken: string;
  status: '2faRequired';
  statusCode: number;
}

export type LoginResponse = LoginSuccessResponse | LoginTwoFactorRequiredResponse;

export interface VerifyTwoFactorLoginRequest {
  pendingToken: string;
  code: number;
}

export type VerifyTwoFactorLoginResponse = LoginSuccessResponse;

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

export interface UpdateProfileRequest {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface PasswordResetRequest {
  currentPassword: string;
}

export interface AvatarUploadResponse {
  avatarUrl: string;
}

export interface UpdateNotificationSettingsRequest {
  id: string;
  confirm: boolean;
  reminder: boolean;
  cancel: boolean;
  marketing: boolean;
}

export interface NotificationSettingsResult {
  id: number;
  confirm: boolean;
  reminder: boolean;
  cancel: boolean;
  marketing: boolean;
}

export interface NotificationSettingsResponse {
  result: NotificationSettingsResult;
  status: string;
  statusCode: number;
}

export interface ApiStatusResponse {
  status: string;
  statusCode: number;
  message?: string;
}

export interface TwoFactorSetupResponse {
  qrUrl: string;
  secret: string;
  statusCode: number;
}

export interface TwoFactorStatusResponse {
  twoFactorEnabled: boolean;
  confirmedAt: string | null;
  statusCode: number;
}

export interface TwoFactorConfirmResponse {
  message: string;
  recoveryCodes: string[];
  statusCode: number;
}
