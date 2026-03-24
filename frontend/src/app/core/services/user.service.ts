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
  ApiStatusResponse,
} from '../models';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private apiUrl = environment.apiUrl;
  private readonly USER_KEY = 'user_data';
  private readonly TWO_FACTOR_KEY_PREFIX = 'two_factor_enabled_';

  constructor(private http: HttpClient) {}

  /**
   * Felhasználói profil lekérése
   */
  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}${API_ENDPOINTS.USER.PROFILE}`);
  }

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
    return this.http
      .delete<{ status: string; statusCode: number }>(
        `${this.apiUrl}${API_ENDPOINTS.USER.DELETE_AVATAR}`
      )
      .pipe(
        tap(() => {
          // localStorage user_data avatarUrl null-ra állítása
          const currentUser = this.getUserFromStorage();
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
   * 2FA beállítás lekérése.
   * Backend hiányában userenként localStorage-ban tároljuk.
   */
  getTwoFactorEnabled(userId: number | string | null | undefined): boolean {
    if (userId === null || userId === undefined || userId === '') {
      return false;
    }

    return localStorage.getItem(`${this.TWO_FACTOR_KEY_PREFIX}${userId}`) === 'true';
  }

  /**
   * 2FA állapot frissítése.
   * Bekapcsoláskor a backend majd valódi jelszó-ellenőrzést végez.
   */
  updateTwoFactorEnabled(
    userId: number | string | null | undefined,
    enabled: boolean,
    password?: string
  ): Observable<ApiStatusResponse> {
    if (userId === null || userId === undefined || userId === '') {
      throw new Error('Missing user id for 2FA update');
    }

    if (enabled && (!password || password.trim().length < 8)) {
      throw new Error('Password is required to enable 2FA');
    }

    localStorage.setItem(`${this.TWO_FACTOR_KEY_PREFIX}${userId}`, String(enabled));

    return new Observable<ApiStatusResponse>((observer) => {
      observer.next({
        status: 'success',
        statusCode: 200,
      });
      observer.complete();
    });
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
}