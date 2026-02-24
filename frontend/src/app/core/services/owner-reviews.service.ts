import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../constants/api-endpoints';

export interface OwnerReview {
  createdAt: string;
  clientName: string;
  imageUrl: string | null;
  rating: number;
  comment: string;
  serviceName: string;
  reviewId: number;
  appointmentDate: string;
}

export interface OwnerReviewsResponse {
  result: {
    clients: OwnerReview[];
    totalCount: number;
  };
  status: string;
  statusCode: number;
}

export interface OwnerReviewsRequest {
  search: string | null;
  ratingFilter: string | null;
  sortBy: 'newest' | 'oldest' | 'highest' | 'lowest';
  page: number;
  pageSize: number;
}

@Injectable({
  providedIn: 'root',
})
export class OwnerReviewsService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getOwnerReviews(
    companyId: number,
    request: OwnerReviewsRequest
  ): Observable<OwnerReviewsResponse> {
    // POST a backend által várt formátumban
    const url = `${this.apiUrl}${API_ENDPOINTS.REVIEWS.OWNER_PANEL}?companyId=${companyId}`;
    console.log('🌐 Request to:', url);
    console.log('📦 Body:', request);
    
    return this.http.post<OwnerReviewsResponse>(
      url,
      request
    );
  }
}
