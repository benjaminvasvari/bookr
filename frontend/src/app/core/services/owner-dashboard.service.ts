import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
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

  getWeeklyCalendarAppointments(
    companyId: number,
    weekStart: string,
    staffId?: number | null,
  ): Observable<unknown> {
    let params = new HttpParams()
      .set('companyId', companyId.toString())
      .set('weekStart', weekStart)
      .set('staffId', staffId ? staffId.toString() : '');

    return this.http.get<unknown>(
      `${this.apiUrl}${API_ENDPOINTS.APPOINTMENTS.WEEKLY_CALENDAR}`,
      { params }
    );
  }
}
