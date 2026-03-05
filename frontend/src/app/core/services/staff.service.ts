// src/app/core/services/staff.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import {
  StaffMember,
  PendingStaffCancelInviteResponse,
  PendingStaffInviteRequest,
  PendingStaffInviteResponse,
  OwnerStaffWithAppointmentsResponse,
  StaffByServicesResponse,
  StaffDashboardResponse,
} from '../models/staff.model';

export interface IndustryPageStaffResponse {
  result: Array<
    Pick<StaffMember, 'id' | 'displayName' | 'specialties' | 'bio' | 'imageUrl'>
  >;
  status: string;
  statusCode: number;
}

@Injectable({
  providedIn: 'root'
})
export class StaffService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Szakemberek lekérése cég + szolgáltatások alapján
   * 
   * Endpoint: GET /api/staff/by-company-and-services?companyId={id}&serviceIds={id1,id2}
   */
  getStaffByServices(companyId: number, serviceIds: number[]): Observable<StaffByServicesResponse> {
    const params = new HttpParams()
      .set('companyId', companyId.toString())
      .set('serviceIds', serviceIds.join(','));

    return this.http.get<StaffByServicesResponse>(
      `${this.apiUrl}${API_ENDPOINTS.STAFF.BY_COMPANY_AND_SERVICES}`,
      { params }
    );
  }

  /**
   * Staff dashboard adatok lekérése userId alapján
   *
   * Endpoint: GET /api/staff/dashboard/{userId}
   */
  getStaffDashboard(userId: number, companyId?: number | null): Observable<StaffDashboardResponse> {
    const params = companyId ? new HttpParams().set('companyId', companyId.toString()) : undefined;

    return this.http.get<StaffDashboardResponse>(
      `${this.apiUrl}${API_ENDPOINTS.STAFF.DASHBOARD(userId)}`,
      { params }
    );
  }

  getAllStaffForOwnerWithAppointments(companyId: number): Observable<OwnerStaffWithAppointmentsResponse> {
    const params = new HttpParams().set('companyId', companyId.toString());

    return this.http.get<OwnerStaffWithAppointmentsResponse>(
      `${this.apiUrl}${API_ENDPOINTS.STAFF.OWNER_WITH_APPOINTMENTS}`,
      { params }
    );
  }

  getStaffForIndustryPage(companyId: number): Observable<IndustryPageStaffResponse['result']> {
    const params = new HttpParams().set('companyId', companyId.toString());

    return this.http
      .get<IndustryPageStaffResponse>(`${this.apiUrl}${API_ENDPOINTS.STAFF.INDUSTRY_PAGE}`, {
        params,
      })
      .pipe(map((response) => response.result || []));
  }

  invitePendingStaff(payload: PendingStaffInviteRequest): Observable<PendingStaffInviteResponse> {
    return this.http.post<PendingStaffInviteResponse>(
      `${this.apiUrl}${API_ENDPOINTS.PENDING_STAFF.INVITE}`,
      payload
    );
  }

  deletePendingStaff(id: number): Observable<PendingStaffCancelInviteResponse> {
    return this.http.delete<PendingStaffCancelInviteResponse>(
      `${this.apiUrl}${API_ENDPOINTS.PENDING_STAFF.CANCEL_INVITE(id)}`
    );
  }

  updateStaffColor(staffId: number, companyId: number, color: string): Observable<unknown> {
    const params = new HttpParams().set('staffId', staffId.toString());

    return this.http.put(
      `${this.apiUrl}${API_ENDPOINTS.STAFF.UPDATE_COLOR}`,
      { companyId, color },
      { params }
    );
  }
}