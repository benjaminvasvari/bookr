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
  AuthResponse,
  TokenRefreshRequest 
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USER_KEY = 'user_data';
  
  private apiUrl = environment.apiUrl;
  
  // BehaviorSubject - értesíti a feliratkozókat a változásokról
  private currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  /**
   * Bejelentkezés
   */
  login(email: string, password: string): Observable<AuthResponse> {
    const loginData: LoginRequest = { email, password };
    
    return this.http.post<AuthResponse>(
      `${this.apiUrl}${API_ENDPOINTS.AUTH.LOGIN}`,
      loginData
    ).pipe(
      tap(response => {
        // Token és user mentése
        this.setSession(response);
      })
    );
  }

  /**
   * Regisztráció
   */
  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.apiUrl}${API_ENDPOINTS.AUTH.REGISTER}`,
      data
    ).pipe(
      tap(response => {
        this.setSession(response);
      })
    );
  }

  /**
   * Kijelentkezés
   */
  logout(): void {
    // Token törlése a szerverről (opcionális)
    this.http.post(`${this.apiUrl}${API_ENDPOINTS.AUTH.LOGOUT}`, {})
      .subscribe({
        next: () => console.log('Logged out from server'),
        error: (err) => console.error('Logout error:', err)
      });
    
    // Helyi adatok törlése
    this.clearSession();
    
    // Navigálás a főoldalra
    this.router.navigate(['/']);
  }

  /**
   * Token frissítés
   */
  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    const request: TokenRefreshRequest = { refreshToken };
    
    return this.http.post<AuthResponse>(
      `${this.apiUrl}${API_ENDPOINTS.AUTH.REFRESH_TOKEN}`,
      request
    ).pipe(
      tap(response => {
        this.setSession(response);
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
   * Token lekérése
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Refresh token lekérése
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Session beállítása (token és user mentése)
   */
  private setSession(authResponse: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, authResponse.token);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, authResponse.refreshToken);
    localStorage.setItem(this.USER_KEY, JSON.stringify(authResponse.user));
    
    this.currentUserSubject.next(authResponse.user);
  }

  /**
   * Session törlése
   */
  private clearSession(): void {
    localStorage.removeItem(this.TOKEN_KEY);
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
   * Token lejárat ellenőrzés (JWT decode kell hozzá)
   * Opcionális: telepítsd az @auth0/angular-jwt package-et
   */
  // private isTokenExpired(token: string): boolean {
  //   const helper = new JwtHelperService();
  //   return helper.isTokenExpired(token);
  // }
}