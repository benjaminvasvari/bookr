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
import { OpeningHours } from '../models/opening-hours.model';

export interface CompanyImage {
  id: number;
  isMain: boolean;
  uploadedAt?: string;
  url: string;
}

interface CompanyImagesResponse {
  result?: CompanyImage[];
}

interface OpeningHoursResponse {
  result?: OpeningHours;
}

interface UpdateOpeningHoursRequest {
  openingHours: OpeningHours;
}

interface BookingRulesResponse {
  result?: {
    cancellationHours?: number | null;
    minimumBookingHoursAhead?: number | null;
    bookingAdvanceDays?: number | null;
  };
}

interface UpdateCompanyBookingRulesRequest {
  bookingAdvanceDays: number;
  cancellationHours: number;
  minimumBookingHoursAhead: number | null;
}

export interface UpdateCompanyRequest {
  name: string;
  description: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  phone: string;
  email: string;
  website?: string | null;
  businessCategoryId?: number;
}

export interface TemporaryClosedPeriod {
  id?: number;
  reason?: string;
  startDate?: string;
  endDate?: string;
  openTime?: string | null;
  closeTime?: string | null;
}

interface TemporaryClosedPeriodsResponse {
  result?: TemporaryClosedPeriod[];
}

interface CreateTemporaryClosedPeriodRequest {
  startDate: string;
  endDate: string;
  openTime: string | null;
  closeTime: string | null;
  reason: string;
}

interface CreateTemporaryClosedPeriodResponse {
  result?: TemporaryClosedPeriod;
}

interface UpdateTemporaryClosedPeriodResponse {
  result?: TemporaryClosedPeriod;
}


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
      .pipe(
        map((response: any) => response.result || []),
        map((categories: any[]) =>
          categories.map((category) => ({
            id: category.categoryId,
            name: category.name,
            description: category.description,
          }))
        )
      );
  }

  /**
   * Cég regisztráció owner userrel együtt
   */
  registerCompany(data: CompanyRegistrationRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}${API_ENDPOINTS.COMPANIES.REGISTER}`, data);
  }

  getCompanyImages(companyId: number): Observable<CompanyImage[]> {
    return this.http
      .get<CompanyImagesResponse>(`${this.apiUrl}${API_ENDPOINTS.IMAGES.BY_COMPANY(companyId)}`)
      .pipe(map((response) => response.result || []));
  }

  getOwnerPanelOpeningHours(): Observable<OpeningHours> {
    return this.http
      .get<OpeningHoursResponse>(`${this.apiUrl}${API_ENDPOINTS.OPENING_HOURS.OWNER_PANEL}`)
      .pipe(map((response) => response.result || {}));
  }

  getCompanyBookingRules(): Observable<{
    cancellationHours?: number | null;
    minimumBookingHoursAhead?: number | null;
    bookingAdvanceDays?: number | null;
  }> {
    return this.http
      .get<BookingRulesResponse>(`${this.apiUrl}${API_ENDPOINTS.COMPANIES.BOOKING_RULES}`)
      .pipe(map((response) => response.result || {}));
  }

  getTemporaryClosedPeriods(): Observable<TemporaryClosedPeriod[]> {
    return this.http
      .get<TemporaryClosedPeriodsResponse>(`${this.apiUrl}${API_ENDPOINTS.TEMPORARY_CLOSED.GET_ALL}`)
      .pipe(map((response) => response.result || []));
  }

  createTemporaryClosedPeriod(
    payload: CreateTemporaryClosedPeriodRequest
  ): Observable<TemporaryClosedPeriod> {
    return this.http
      .post<CreateTemporaryClosedPeriodResponse>(
        `${this.apiUrl}${API_ENDPOINTS.TEMPORARY_CLOSED.CREATE}`,
        payload
      )
      .pipe(map((response) => response.result || {}));
  }

  updateTemporaryClosedPeriod(
    id: number,
    payload: CreateTemporaryClosedPeriodRequest
  ): Observable<TemporaryClosedPeriod> {
    return this.http
      .put<UpdateTemporaryClosedPeriodResponse>(
        `${this.apiUrl}${API_ENDPOINTS.TEMPORARY_CLOSED.UPDATE(id)}`,
        payload
      )
      .pipe(map((response) => response.result || {}));
  }

  deleteTemporaryClosedPeriod(id: number): Observable<unknown> {
    return this.http.delete(`${this.apiUrl}${API_ENDPOINTS.TEMPORARY_CLOSED.DELETE(id)}`);
  }

  updateCompanyBookingRules(payload: UpdateCompanyBookingRulesRequest): Observable<unknown> {
    return this.http.put(`${this.apiUrl}${API_ENDPOINTS.COMPANIES.UPDATE_BOOKING_RULES}`, payload);
  }

  updateCompany(payload: UpdateCompanyRequest): Observable<unknown> {
    return this.http.put(`${this.apiUrl}${API_ENDPOINTS.COMPANIES.UPDATE}`, payload);
  }

  updateOwnerPanelOpeningHours(payload: UpdateOpeningHoursRequest): Observable<unknown> {
    return this.http.put(`${this.apiUrl}${API_ENDPOINTS.OPENING_HOURS.UPDATE}`, payload);
  }
}
