import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap, catchError, throwError } from 'rxjs';
import { AuthApiService } from './auth-api.service';
import { LoginRequest, RegisterRequest, UserInfo } from '../models/auth.models';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<UserInfo | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private authApiService: AuthApiService,
    private router: Router
  ) {
    // App indulásakor ellenőrizzük hogy van-e token
    this.checkAuthStatus();
  }

  /**
   * Login - Bejelentkezés
   */
  login(credentials: LoginRequest): Observable<any> {
    return this.authApiService.login(credentials).pipe(
      tap(response => {
        // Backend response struktúra: { user: { accessToken, refreshToken, ...userData } }
        const userData = response.user as any;
        
        // Tokenek mentése LocalStorage-ba
        localStorage.setItem(environment.accessTokenKey, userData.accessToken);
        localStorage.setItem(environment.refreshTokenKey, userData.refreshToken);
        
        // User adatok tárolása (tokenek nélkül)
        const { accessToken, refreshToken, ...userInfo } = userData;
        this.currentUserSubject.next(userInfo as UserInfo);
        
        // Átirányítás főoldalra
        this.router.navigate(['/']);
      }),
      catchError(error => {
        console.error('Login error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Register - Regisztráció
   */
  register(userData: RegisterRequest): Observable<any> {
    return this.authApiService.register(userData).pipe(
      tap(response => {
        console.log('Registration successful:', response);
        // Regisztráció után átirányítás login oldalra
        this.router.navigate(['/login']);
      }),
      catchError(error => {
        console.error('Registration error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Logout - Kijelentkezés
   */
  logout(): void {
    // Tokenek törlése
    localStorage.removeItem(environment.accessTokenKey);
    localStorage.removeItem(environment.refreshTokenKey);
    
    // User adatok törlése
    this.currentUserSubject.next(null);
    
    // Átirányítás login oldalra
    this.router.navigate(['/login']);
  }

  /**
   * Check if user is logged in
   */
  isLoggedIn(): boolean {
    const token = localStorage.getItem(environment.accessTokenKey);
    return !!token;
  }

  /**
   * Get current user info
   */
  getCurrentUser(): UserInfo | null {
    return this.currentUserSubject.value;
  }

  /**
   * Fetch current user from backend (app indításakor)
   */
  private checkAuthStatus(): void {
    if (this.isLoggedIn()) {
      this.authApiService.getCurrentUser().subscribe({
        next: (user) => {
          this.currentUserSubject.next(user);
        },
        error: (error) => {
          console.error('Auth check failed:', error);
          // Ha token invalid, logout
          this.logout();
        }
      });
    }
  }

  /**
   * Refresh user data manually
   */
  refreshUserData(): void {
    if (this.isLoggedIn()) {
      this.authApiService.getCurrentUser().subscribe({
        next: (user) => {
          this.currentUserSubject.next(user);
        },
        error: (error) => {
          console.error('Failed to refresh user data:', error);
        }
      });
    }
  }

  /**
   * Verify Email - Email cím megerősítése
   */
  verifyEmail(token: string): Observable<any> {
    return this.authApiService.verifyEmail(token);
  }
}