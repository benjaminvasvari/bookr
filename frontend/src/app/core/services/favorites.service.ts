// src/app/core/services/favorites.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../constants/api-endpoints';

export interface FavoriteCompany {
  companyId: number;
  name: string;
  address: string;
  category: string;
  rating: number;
  reviewCount: number;
  imageUrl: string;
}

export interface Favorite {
  favoriteId: number;
  addedAt: string;
  company: FavoriteCompany;
}

export interface FavoritesResponse {
  result: Favorite[];
  count: number;
  status: string;
  statusCode: number;
}

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getUserFavorites(): Observable<FavoritesResponse> {
    return this.http.get<FavoritesResponse>(`${this.apiUrl}${API_ENDPOINTS.FAVORITES.GETALL}`);
  }

  removeFavorite(favoriteId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${favoriteId}`);
  }

  addFavorite(companyId: number): Observable<any> {
    return this.http.post(this.apiUrl, { companyId });
  }
}