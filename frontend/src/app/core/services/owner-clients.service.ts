import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import { OwnerClientsApiResponse } from '../models';

@Injectable({
  providedIn: 'root',
})
export class OwnerClientsService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getClientsByCompany(
    companyId: number,
    page: number,
    pageSize: number
  ): Observable<OwnerClientsApiResponse> {
    return this.http.get<OwnerClientsApiResponse>(
      `${this.apiUrl}${API_ENDPOINTS.USER.CLIENTS_BY_COMPANY(companyId, page, pageSize)}`
    );
  }
}
