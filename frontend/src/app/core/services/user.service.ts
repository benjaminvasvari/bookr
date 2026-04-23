import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import {
  User,
  UpdateProfileRequest,
  AvatarUploadResponse,
  UpdateNotificationSettingsRequest,
  NotificationSettingsResponse,
  ApiStatusResponse,
  TwoFactorStatusResponse,
  TwoFactorSetupResponse,
  TwoFactorConfirmResponse,
} from '../models';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private apiUrl = environment.apiUrl;
  private readonly USER_KEY = 'user_data';

  constructor(private http: HttpClient) {}

  /**
   * Profil módosítása
   */
  updateProfile(data: UpdateProfileRequest): Observable<User> {
    return this.http
      .put<User>(`${this.apiUrl}${API_ENDPOINTS.USER.UPDATE_PROFILE}`, data)
      .pipe(
        tap((updatedUser) => {
          // localStorage user_data frissítése
          this.updateUserInStorage(updatedUser);
        })
      );
  }

  /**
   * Avatar feltöltés
   */
  uploadAvatar(file: File): Observable<AvatarUploadResponse> {
    const formData = new FormData();
    formData.append('avatar', file);
    
    return this.http
      .post<AvatarUploadResponse>(`${this.apiUrl}${API_ENDPOINTS.USER.UPLOAD_AVATAR}`, formData)
      .pipe(
        tap((response) => {
          // localStorage user_data avatarUrl frissítése
          const currentUser = this.getUserFromStorage();
          if (currentUser) {
            currentUser.avatarUrl = response.avatarUrl;
            this.updateUserInStorage(currentUser);
          }
        })
      );
  }

  /**
   * Avatar törlése
   */
  deleteAvatar(): Observable<{ status: string; statusCode: number }> {
    const currentUser = this.getUserFromStorage();
    const imageId = this.extractAvatarImageId(currentUser?.avatarUrl ?? null) ?? 1;

    if (!currentUser) {
      throw new Error('Az avatar törléséhez hiányzik a felhasználó azonosítója.');
    }

    return this.http
      .delete<{ status: string; statusCode: number }>(
        `${this.apiUrl}${API_ENDPOINTS.USER.DELETE_AVATAR(currentUser.id, imageId)}`
      )
      .pipe(
        tap(() => {
          // localStorage user_data avatarUrl null-ra állítása
          if (currentUser) {
            currentUser.avatarUrl = null;
            this.updateUserInStorage(currentUser);
          }
        })
      );
  }

  /**
   * Jelszó változtatás request (email küldés)
   */
  requestPasswordReset(currentPassword: string): Observable<ApiStatusResponse> {
    return this.http.post<ApiStatusResponse>(
      `${this.apiUrl}${API_ENDPOINTS.AUTH.REQUEST_PASSWORD_RESET}`,
      { currentPassword }
    );
  }

  /**
   * Értesítési beállítások frissítése
   */
  updateNotificationSettings(data: UpdateNotificationSettingsRequest): Observable<ApiStatusResponse> {
    return this.http.put<ApiStatusResponse>(
      `${this.apiUrl}${API_ENDPOINTS.USER.UPDATE_NOTIFICATION_SETTINGS}`,
      data
    );
  }

  /**
   * Értesítési beállítások lekérése.
   */
  getNotificationSettings(): Observable<NotificationSettingsResponse> {
    return this.http.get<NotificationSettingsResponse>(
      `${this.apiUrl}${API_ENDPOINTS.USER.GET_NOTIFICATION_SETTINGS}`
    );
  }

  /**
   * 2FA státusz lekérése backendről.
   */
  getTwoFactorStatus(): Observable<TwoFactorStatusResponse> {
    return this.http
      .get<TwoFactorStatusResponse>(`${this.apiUrl}${API_ENDPOINTS.TWO_FACTOR.STATUS}`)
      .pipe(tap((response) => this.syncStoredTwoFactorState(response.twoFactorEnabled)));
  }

  /**
   * 2FA setup indítása. A backend egy otpauth URL-t és secretet ad vissza.
   */
  setupTwoFactor(): Observable<TwoFactorSetupResponse> {
    return this.http.get<TwoFactorSetupResponse>(`${this.apiUrl}${API_ENDPOINTS.TWO_FACTOR.SETUP}`);
  }

  /**
   * 2FA bekapcsolás megerősítése authenticator kóddal.
   */
  confirmTwoFactor(secret: string, code: number): Observable<TwoFactorConfirmResponse> {
    return this.http
      .post<TwoFactorConfirmResponse>(`${this.apiUrl}${API_ENDPOINTS.TWO_FACTOR.CONFIRM}`, {
        secret,
        code,
      })
      .pipe(tap(() => this.syncStoredTwoFactorState(true)));
  }

  /**
   * 2FA kikapcsolása authenticator kóddal.
   */
  disableTwoFactor(code: number): Observable<ApiStatusResponse> {
    return this.http
      .post<ApiStatusResponse>(`${this.apiUrl}${API_ENDPOINTS.TWO_FACTOR.DISABLE}`, { code })
      .pipe(tap(() => this.syncStoredTwoFactorState(false)));
  }

  /**
   * Fiók végleges törlése
   */
  deleteAccount(password: string): Observable<ApiStatusResponse> {
    return this.http.delete<ApiStatusResponse>(`${this.apiUrl}${API_ENDPOINTS.DELETE_USER}`, {
      body: { password },
    });
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
   * User frissítése localStorage-ban
   */
  private updateUserInStorage(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  private extractAvatarImageId(avatarUrl: string | null): number | null {
    if (!avatarUrl) {
      return null;
    }

    const normalizedUrl = avatarUrl.trim();
    if (!normalizedUrl) {
      return null;
    }

    try {
      const parsedUrl = new URL(normalizedUrl, this.apiUrl);
      const match = parsedUrl.pathname.match(/\/images\/users\/(\d+)\/(\d+)\/?$/);

      if (!match) {
        return null;
      }

      return Number(match[2]);
    } catch {
      return null;
    }
  }

  private extractTwoFactorEnabled(user: Partial<User> | null | undefined): boolean {
    if (!user) {
      return false;
    }

    return Boolean(
      user.twoFactorEnabled ??
        user.isTwoFactorEnabled ??
        (user as User & { twoFAEnabled?: boolean }).twoFAEnabled ??
        (user as User & { isTwoFactorAuthenticationEnabled?: boolean }).isTwoFactorAuthenticationEnabled
    );
  }

  private syncStoredTwoFactorState(enabled: boolean): void {
    const currentUser = this.getUserFromStorage();

    if (!currentUser) {
      return;
    }

    this.updateUserInStorage({
      ...currentUser,
      twoFactorEnabled: enabled,
      isTwoFactorEnabled: enabled,
    });
  }
}