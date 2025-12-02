import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import { Review, CreateReviewRequest } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ReviewsService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Összes értékelés lekérése
   */
  getReviews(): Observable<Review[]> {
    return this.http.get<Review[]>(
      `${this.apiUrl}${API_ENDPOINTS.REVIEWS.LIST}`
    );
  }

  /**
   * Egy cég értékeléseinek lekérése
   */
  getReviewsByCompany(companyId: number): Observable<Review[]> {
    return this.http.get<Review[]>(
      `${this.apiUrl}${API_ENDPOINTS.REVIEWS.BY_COMPANY(companyId)}`
    );
  }

  /**
   * Új értékelés létrehozása
   */
  createReview(reviewData: CreateReviewRequest): Observable<Review> {
    return this.http.post<Review>(
      `${this.apiUrl}${API_ENDPOINTS.REVIEWS.CREATE}`,
      reviewData
    );
  }
}