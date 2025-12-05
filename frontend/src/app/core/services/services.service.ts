  import { Injectable } from '@angular/core';
  import { HttpClient } from '@angular/common/http';
  import { Observable } from 'rxjs';

  import { environment } from '../../../environments/environment';
  import { API_ENDPOINTS } from '../constants/api-endpoints';
  import { Service, ServiceCategory } from '../models';

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
     * Szolgáltatás kategóriák lekérése
     */
    getCategories(): Observable<ServiceCategory[]> {
      return this.http.get<ServiceCategory[]>(
        `${this.apiUrl}${API_ENDPOINTS.SERVICES.CATEGORIES}`
      );
    }
  }