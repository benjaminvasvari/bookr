import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';  // ← ÚJ IMPORT!

import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import { Company } from '../models';

@Injectable({
  providedIn: 'root'
})
export class CompaniesService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Egy konkrét cég lekérése ID alapján
   */
  getCompanyById(id: number): Observable<Company> {
    return this.http.get<Company>(
      `${this.apiUrl}${API_ENDPOINTS.COMPANIES.DETAIL(id)}`
    );
  }

  /**
   * Top ajánlott cégek lekérése
   */
  getTopRecommendations(limit: number = 4): Observable<Company[]> {
    const params = new HttpParams().set('limit', limit.toString());
    
    return this.http.get<any>(  // ← any mert wrapper object
      `${this.apiUrl}${API_ENDPOINTS.COMPANIES.TOP_RECOMMENDATIONS}`,
      { params }
    ).pipe(
      map((response: any) => response.result || [])  // ← Kicsomagolás!
    );
  }

  /**
   * Felkapott cégek lekérése
   */
  getFeaturedCompanies(limit: number = 4): Observable<Company[]> {
    const params = new HttpParams().set('limit', limit.toString());
    
    return this.http.get<any>(
      `${this.apiUrl}${API_ENDPOINTS.COMPANIES.FEATURED}`,
      { params }
    ).pipe(
      map((response: any) => response.result || [])  // ← Kicsomagolás!
    );
  }

  /**
   * Új cégek lekérése
   */
  getNewCompanies(limit: number = 4): Observable<Company[]> {
    const params = new HttpParams().set('limit', limit.toString());
    
    return this.http.get<any>(
      `${this.apiUrl}${API_ENDPOINTS.COMPANIES.NEW}`,
      { params }
    ).pipe(
      map((response: any) => response.result || [])  // ← Kicsomagolás!
    );
  }

  /**
   * Cégek keresése
   */
  searchCompanies(query: string): Observable<Company[]> {
    const params = new HttpParams().set('q', query);
    
    return this.http.get<Company[]>(
      `${this.apiUrl}${API_ENDPOINTS.COMPANIES.SEARCH}`,
      { params }
    );
  }
}