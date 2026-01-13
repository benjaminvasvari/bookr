// src/app/core/services/booking.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import { 
  UnavailableDate,
  UnavailableDatesResponse,
  OccupiedSlotsResponse
} from '../models/booking.model';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Unavailable dates lekérése
   */
  getUnavailableDates(
    companyId: number,
    staffId: number
  ): Observable<UnavailableDate[]> {
    const params = new HttpParams()
      .set('companyId', companyId.toString())
      .set('staffId', staffId.toString());

    return this.http
      .get<UnavailableDatesResponse>(
        `${this.apiUrl}${API_ENDPOINTS.APPOINTMENTS.UNAVAILABLE_DATES}`,
        { params }
      )
      .pipe(
        map(response => response.data.unavailableDates || [])
      );
  }

  /**
   * Occupied slots lekérése
   * ⚠️ FIGYELEM: workingHours TÖMB, nem object!
   */
  getOccupiedSlots(
    companyId: number,
    staffId: number,
    date: string
  ): Observable<OccupiedSlotsResponse['data']> {
    const params = new HttpParams()
      .set('companyId', companyId.toString())
      .set('staffId', staffId.toString())
      .set('date', date);

    return this.http
      .get<OccupiedSlotsResponse>(
        `${this.apiUrl}${API_ENDPOINTS.APPOINTMENTS.OCCUPIED_SLOTS}`,
        { params }
      )
      .pipe(
        map(response => response.data)
      );
  }
}