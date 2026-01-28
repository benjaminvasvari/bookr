import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import { Company, CompanyShort } from '../models/company.model';
import { ServiceCategory } from '../models/service.model';
import { CompanyRegistrationRequest } from '../models/company-registration.model';
import { BusinessCategory } from '../models/business-category.model';



@Injectable({
  providedIn: 'root',
})
export class CompaniesService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Egy konkrét cég rövid adatainak lekérése (appointment flow-hoz)
   */
  getCompanyShort(id: number): Observable<CompanyShort> {
    return this.http.get<CompanyShort>(`${this.apiUrl}${API_ENDPOINTS.COMPANIES.SHORT(id)}`);
  }

  /**
   * Egy konkrét cég teljes adatainak lekérése
   */
  getCompanyById(id: number): Observable<Company> {
    return this.http.get<Company>(`${this.apiUrl}${API_ENDPOINTS.COMPANIES.DETAIL(id)}`);
  }

  /**
   * Egy cég szolgáltatásainak lekérése kategóriákkal
   */
  getServiceCategoriesWithServices(companyId: number): Observable<ServiceCategory[]> {
    return this.http
      .get<{
        data: ServiceCategory[];
        message: string;
        statusCode: number;
      }>(`${this.apiUrl}${API_ENDPOINTS.SERVICES.BY_COMPANY(companyId)}`)
      .pipe(map((response) => response.data || []));
  }

  /**
   * Top ajánlott cégek lekérése
   */
  getTopRecommendations(limit: number = 4): Observable<Company[]> {
    const params = new HttpParams().set('limit', limit.toString());

    return this.http
      .get<any>(`${this.apiUrl}${API_ENDPOINTS.COMPANIES.TOP_RECOMMENDATIONS}`, { params })
      .pipe(map((response: any) => response.result || []));
  }

  /**
   * Felkapott cégek lekérése
   */
  getFeaturedCompanies(limit: number = 4): Observable<Company[]> {
    const params = new HttpParams().set('limit', limit.toString());

    return this.http
      .get<any>(`${this.apiUrl}${API_ENDPOINTS.COMPANIES.FEATURED}`, { params })
      .pipe(map((response: any) => response.result || []));
  }

  /**
   * Új cégek lekérése
   */
  getNewCompanies(limit: number = 4): Observable<Company[]> {
    const params = new HttpParams().set('limit', limit.toString());

    return this.http
      .get<any>(`${this.apiUrl}${API_ENDPOINTS.COMPANIES.NEW}`, { params })
      .pipe(map((response: any) => response.result || []));
  }

  /**
   * Cégek keresése
   */
  searchCompanies(query: string): Observable<Company[]> {
    const params = new HttpParams().set('q', query);

    return this.http.get<Company[]>(`${this.apiUrl}${API_ENDPOINTS.COMPANIES.SEARCH}`, { params });
  }

  /**
   * Üzleti kategóriák lekérése
   */
  getBusinessCategories(): Observable<BusinessCategory[]> {
    return this.http
      .get<any>(`${this.apiUrl}${API_ENDPOINTS.COMPANIES.BUSINESS_CATEGORIES}`)
      .pipe(map((response: any) => response.data || []));
  }

  /**
   * Cég regisztráció owner userrel együtt
   */
  registerCompany(data: CompanyRegistrationRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}${API_ENDPOINTS.COMPANIES.REGISTER}`, data);
  }
}
