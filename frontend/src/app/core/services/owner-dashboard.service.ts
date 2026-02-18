import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import { OwnerDashboardResponse } from '../models/owner-dashboard.model';

@Injectable({
  providedIn: 'root',
})
export class OwnerDashboardService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getOwnerDashboard(): Observable<OwnerDashboardResponse> {
    return this.http.get<OwnerDashboardResponse>(
      `${this.apiUrl}${API_ENDPOINTS.DASHBOARDS.OWNER}`
    );
  }
}
