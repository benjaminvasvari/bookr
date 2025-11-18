import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../services/api.service';
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  UserInfo
} from '../models/auth.models';

@Injectable({
  providedIn: 'root'
})
export class AuthApiService {

  constructor(private apiService: ApiService) {}

  /**
   * Login - Bejelentkezés
   * POST /auth/login
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.apiService.post<LoginResponse>('/login', credentials);
  }

  /**
   * Register - Regisztráció
   * POST /auth/register
   */
  register(userData: RegisterRequest): Observable<RegisterResponse> {
    return this.apiService.post<RegisterResponse>('/register', userData);
  }

  /**
   * Refresh Token - Access token frissítése
   * POST /auth/refresh
   */
  refreshToken(refreshToken: string): Observable<RefreshTokenResponse> {
    const request: RefreshTokenRequest = { refreshToken };
    return this.apiService.post<RefreshTokenResponse>('/auth/refresh', request);
  }

  /**
   * Get Current User - Aktuális bejelentkezett user adatai
   * GET /auth/me
   */
  getCurrentUser(): Observable<UserInfo> {
    return this.apiService.get<UserInfo>('/auth/me');
  }

  /**
   * Verify Email - Email cím megerősítése token alapján
   * POST /users/verify-email
   */
  verifyEmail(token: string): Observable<any> {
    return this.apiService.post('/users/verify-email', { token });
  }
}