// src/app/core/services/favorites.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import { AuthService } from './auth.service';

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
  private favoritesSubject = new BehaviorSubject<Favorite[]>([]);
  favorites$ = this.favoritesSubject.asObservable();
  private favoritesLoadedSubject = new BehaviorSubject<boolean>(false);
  favoritesLoaded$ = this.favoritesLoadedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getUserId(): number | null {
    const user = this.authService.getCurrentUser();
    return user ? user.id : null;
  }

  getUserFavorites(): Observable<FavoritesResponse> {
    const userId = this.getUserId();
    if (!userId) {
      this.favoritesSubject.next([]);
      this.favoritesLoadedSubject.next(true);
      return of({
        result: [],
        count: 0,
        status: 'success',
        statusCode: 200,
      });
    }

    return this.http
      .get<FavoritesResponse>(`${this.apiUrl}${API_ENDPOINTS.FAVORITES.GETALL(userId)}`)
      .pipe(
        tap((response) => {
          this.favoritesSubject.next(response.result);
          this.favoritesLoadedSubject.next(true);
        })
      );
  }

  refreshFavorites(): void {
    this.getUserFavorites().subscribe({
      error: (error) => console.error('Hiba a kedvencek frissítése során:', error),
    });
  }

  removeFavorite(companyId: number): Observable<any> {
    return this.http
      .delete(`${this.apiUrl}${API_ENDPOINTS.FAVORITES.REMOVE(companyId)}`)
      .pipe(tap(() => this.refreshFavorites()));
  }

  addFavorite(companyId: number): Observable<any> {
    return this.http
      .post(`${this.apiUrl}${API_ENDPOINTS.FAVORITES.ADD(companyId)}`, null)
      .pipe(tap(() => this.refreshFavorites()));
  }
}