/**
 * Login request
 */
export interface LoginRequest {
    email: string;
    password: string;
  }
  
  /**
   * Login response
   */
  export interface LoginResponse {
    status: string;
    statusCode: number;
    user: UserInfo & {
      accessToken: string;
      refreshToken: string;
    };
  }
  
  /**
   * Register request
   */
  export interface RegisterRequest {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
    passwordConfirmation: string;
  }
  
  /**
   * Register response
   */
  export interface RegisterResponse {
    message: string;
    userId: number;
  }
  
  /**
   * Refresh token request
   */
  export interface RefreshTokenRequest {
    refreshToken: string;
  }
  
  /**
   * Refresh token response
   */
  export interface RefreshTokenResponse {
    accessToken: string;
    refreshToken: string;
  }
  
  /**
   * User info (aktuális bejelentkezett user adatai)
   */
  export interface UserInfo {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    role: 'user' | 'admin' | 'company_owner';
  }