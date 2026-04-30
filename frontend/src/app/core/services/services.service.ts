import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import { Service, ServiceCategory } from '../models/service.model';

export interface StaffServiceItem {
  id: number;
  name: string;
  description?: string;
  durationMinutes: number;
  price: number;
  currency: string;
  categories: string;
  isAssigned: boolean;
  isActive: boolean;
}

interface StaffServicesResponse {
  data: StaffServiceItem[];
  status: string;
  statusCode: number;
}

export interface UpdateStaffServiceAssignmentRequest {
  serviceId: number;
  isAssigned: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ServicesService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

    /**
     * Összes szolgáltatás lekérése
     */
    getServices(): Observable<Service[]> {
      return this.http.get<Service[]>(
        `${this.apiUrl}${API_ENDPOINTS.SERVICES.LIST}`
      );
    }

    /**
     * Egy konkrét szolgáltatás lekérése ID alapján
     */
    getServiceById(id: number): Observable<Service> {
      return this.http.get<Service>(
        `${this.apiUrl}${API_ENDPOINTS.SERVICES.DETAIL(id)}`
      );
    }

    /**
     * Egy cég összes szolgáltatásának lekérése
     */
    getServicesByCompany(companyId: number): Observable<Service[]> {
      return this.http.get<Service[]>(
        `${this.apiUrl}${API_ENDPOINTS.SERVICES.BY_COMPANY(companyId)}`
      );
    }

  /**
   * Staffhoz rendelhető szolgáltatások lekérése
   */
  getStaffServices(): Observable<StaffServiceItem[]> {
    return this.http
      .get<StaffServicesResponse>(`${this.apiUrl}${API_ENDPOINTS.SERVICES.STAFF_SERVICES}`)
      .pipe(map((response) => response.data || []));
  }

  updateStaffServiceAssignment(payload: UpdateStaffServiceAssignmentRequest): Observable<unknown> {
    return this.http.put(`${this.apiUrl}${API_ENDPOINTS.SERVICES.UPDATE_STAFF_SERVICE}`, payload);
  }

  /**
   * Szolgáltatás kategóriák lekérése
   */
  getCategories(): Observable<ServiceCategory[]> {
    return this.http.get<ServiceCategory[]>(
      `${this.apiUrl}${API_ENDPOINTS.SERVICES.CATEGORIES}`
    );
  }
}
