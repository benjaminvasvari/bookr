import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import { Staff } from '../models';

@Injectable({
  providedIn: 'root'
})
export class SpecialistsService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Összes szakember lekérése
   */
  getSpecialists(): Observable<Staff[]> {
    return this.http.get<Staff[]>(
      `${this.apiUrl}${API_ENDPOINTS.SPECIALISTS.LIST}`
    );
  }

  /**
   * Egy konkrét szakember lekérése ID alapján
   */
  getSpecialistById(id: number): Observable<Staff> {
    return this.http.get<Staff>(
      `${this.apiUrl}${API_ENDPOINTS.SPECIALISTS.DETAIL(id)}`
    );
  }

  /**
   * Egy cég összes szakemberének lekérése
   */
  getSpecialistsByCompany(companyId: number): Observable<Staff[]> {
    return this.http.get<Staff[]>(
      `${this.apiUrl}${API_ENDPOINTS.SPECIALISTS.BY_COMPANY(companyId)}`
    );
  }
}