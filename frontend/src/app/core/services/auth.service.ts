import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import {
  User,
  LoginRequest,
  RegisterRequest,
  LoginResponse,
  RegisterResponse,
  RefreshTokenResponse,
  TokenRefreshRequest,
  VerifyEmailRequest,
  VerifyEmailResponse,
} from '../models';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly ACCESS_TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USER_KEY = 'user_data';

  private apiUrl = environment.apiUrl;

  // BehaviorSubject - értesíti a feliratkozókat a változásokról
  private currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  /**
   * Bejelentkezés
   */
  login(email: string, password: string): Observable<LoginResponse> {
    const loginData: LoginRequest = { email, password };

    return this.http
      .post<LoginResponse>(`${this.apiUrl}${API_ENDPOINTS.AUTH.LOGIN}`, loginData)
      .pipe(
        tap((response) => {
          if (response.status === 'success') {
            this.setSession(response);
          }
        })
      );
  }

  /**
   * Regisztráció
   * FONTOS: Email verification szükséges, ezért NEM jelentkeztet be automatikusan!
   */
  register(data: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}${API_ENDPOINTS.AUTH.REGISTER}`, data);
    // NEM hívjuk a setSession()-t, mert nincs token a response-ban!
  }

  /**
   * Kijelentkezés
   */
  logout(): void {
    const user = this.getCurrentUser();

    if (user) {
      this.http
        .post(`${this.apiUrl}${API_ENDPOINTS.AUTH.LOGOUT}`, {
          id: user.id,
          email: user.email,
          companyId: user.companyId,
        })
        .subscribe({
          next: () => console.log('Logged out from server'),
          error: (err) => console.error('Logout error:', err),
        });

      // Helyi adatok törlése
      this.clearSession();

      // Navigálás a főoldalra
      this.router.navigate(['/']);
    }
  }

  /**
   * Token frissítés (REACTIVE approach)
   * 
   * ⚠️ FONTOS: Ezt az interceptor hívja automatikusan 401 error esetén!
   * 
   * Flow:
   * 1. API kérés → 401 Unauthorized (access token lejárt)
   * 2. Interceptor észreveszi → meghívja ezt a metódust
   * 3. Backend validálja a refresh tokent → új access + refresh tokent ad
   * 4. Metódus elmenti az új tokeneket localStorage-ba
   * 5. Interceptor újrapróbálja az eredeti kérést az új tokennel
   * 6. Ha refresh sikertelen → interceptor logout-ol
   */
  refreshToken(): Observable<RefreshTokenResponse> {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    // Backend refresh_token kulcsot vár (underscore)
    const request: TokenRefreshRequest = { refresh_token: refreshToken };

    return this.http
      .post<RefreshTokenResponse>(`${this.apiUrl}${API_ENDPOINTS.AUTH.REFRESH_TOKEN}`, request)
      .pipe(
        tap((response) => {
          // ✅ Csak a tokeneket frissítjük, a user adatokat NEM!
          localStorage.setItem(this.ACCESS_TOKEN_KEY, response.accessToken);
          localStorage.setItem(this.REFRESH_TOKEN_KEY, response.refreshToken);
          
          console.log('✅ Token refresh successful');
        })
      );
  }

  /**
   * Bejelentkezett-e a felhasználó
   */
  isAuthenticated(): boolean {
    const token = this.getToken();

    if (!token) {
      return false;
    }

    // Token lejárat ellenőrzés (opcionális, JWT decode szükséges)
    // return !this.isTokenExpired(token);

    return true;
  }

  /**
   * Aktuális felhasználó lekérése
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Access token lekérése
   */
  getToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  /**
   * Refresh token lekérése
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Session beállítása (token és user mentése)
   * A backend a tokeneket a user objektumon BELÜL küldi!
   */
  private setSession(loginResponse: LoginResponse): void {
    // Tokenek kinyerése a user objektumból
    const { accessToken, refreshToken, ...userData } = loginResponse.user;

    // Tokenek mentése
    localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);

    // User objektum mentése TOKENEK NÉLKÜL (biztonsági ok)
    const userWithoutTokens: User = {
      id: userData.id,
      email: userData.email,
      phone: userData.phone,
      firstName: userData.firstName,
      lastName: userData.lastName,
      roles: userData.roles,
      companyId: userData.companyId,
      avatarUrl: userData.avatarUrl,
      roleId: userData.roleId,
    };

    localStorage.setItem(this.USER_KEY, JSON.stringify(userWithoutTokens));

    // BehaviorSubject frissítése
    this.currentUserSubject.next(userWithoutTokens);
  }

  /**
   * Session törlése
   */
  private clearSession(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);

    this.currentUserSubject.next(null);
  }

  /**
   * User lekérése localStorage-ból
   */
  private getUserFromStorage(): User | null {
    const userJson = localStorage.getItem(this.USER_KEY);

    if (!userJson) {
      return null;
    }

    try {
      return JSON.parse(userJson) as User;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  }

  /**
   * Email verification
   */
  verifyEmail(token: string): Observable<VerifyEmailResponse> {
    const request: VerifyEmailRequest = { token };

    return this.http.post<VerifyEmailResponse>(
      `${this.apiUrl}${API_ENDPOINTS.AUTH.VERIFY_EMAIL}`,
      request
    );
  }

  /**
   * Password reset - új jelszó beállítása token alapján
   */
  resetPassword(resetToken: string, newPassword: string): Observable<void> {
    const body = {
      token: resetToken,
      password: newPassword
    };

    return this.http.post<void>(`${this.apiUrl}${API_ENDPOINTS.AUTH.RESET_PASSWORD}`, body);
  }

  /**
   * Ellenőrzi, hogy a usernek van-e cége
   */
  hasCompany(): boolean {
    const user = this.getCurrentUser();
    return !!(user && user.companyId);
  }

  /**
   * User companyId frissítése (cég regisztráció után)
   */
  updateUserCompany(companyId: number): void {
    const currentUser = this.getCurrentUser();
    
    if (currentUser) {
      const updatedUser: User = {
        ...currentUser,
        companyId: companyId
      };
      
      // LocalStorage frissítése
      localStorage.setItem(this.USER_KEY, JSON.stringify(updatedUser));
      
      // BehaviorSubject frissítése
      this.currentUserSubject.next(updatedUser);
      
      console.log('✅ User company updated:', companyId);
    }
  }

  /**
   * Mock session beállítása regisztráció után (frontend teszteléshez)
   */
  setMockSession(user: User): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, 'mock_access_token');
    localStorage.setItem(this.REFRESH_TOKEN_KEY, 'mock_refresh_token');
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));

    this.currentUserSubject.next(user);
  }
}