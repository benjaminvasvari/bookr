import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import { User } from '../models';

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Felhasználói profil lekérése
   */
  getProfile(): Observable<User> {
    return this.http.get<User>(
      `${this.apiUrl}${API_ENDPOINTS.USER.PROFILE}`
    );
  }

  /**
   * Profil módosítása
   */
  updateProfile(data: UpdateProfileRequest): Observable<User> {
    return this.http.put<User>(
      `${this.apiUrl}${API_ENDPOINTS.USER.UPDATE_PROFILE}`,
      data
    );
  }

  /**
   * Jelszó változtatás
   */
  changePassword(data: ChangePasswordRequest): Observable<void> {
    return this.http.post<void>(
      `${this.apiUrl}${API_ENDPOINTS.USER.CHANGE_PASSWORD}`,
      data
    );
  }
}