// src/app/core/services/staff.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import { StaffByServicesResponse } from '../models/staff.model';

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
}