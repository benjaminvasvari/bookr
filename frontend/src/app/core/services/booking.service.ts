import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import { 
  Booking, 
  CreateBookingRequest, 
  AvailableTimeSlotsResponse 
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Új foglalás létrehozása
   */
  createBooking(bookingData: CreateBookingRequest): Observable<Booking> {
    return this.http.post<Booking>(
      `${this.apiUrl}${API_ENDPOINTS.BOOKINGS.CREATE}`,
      bookingData
    );
  }

  /**
   * Felhasználó foglalásainak lekérése
   */
  getUserBookings(): Observable<Booking[]> {
    return this.http.get<Booking[]>(
      `${this.apiUrl}${API_ENDPOINTS.BOOKINGS.USER_BOOKINGS}`
    );
  }

  /**
   * Egy konkrét foglalás lekérése
   */
  getBookingById(id: number): Observable<Booking> {
    return this.http.get<Booking>(
      `${this.apiUrl}${API_ENDPOINTS.BOOKINGS.DETAIL(id)}`
    );
  }

  /**
   * Foglalás lemondása
   */
  cancelBooking(id: number, reason?: string): Observable<Booking> {
    const body = reason ? { reason } : {};
    return this.http.put<Booking>(
      `${this.apiUrl}${API_ENDPOINTS.BOOKINGS.CANCEL(id)}`,
      body
    );
  }

  /**
   * Elérhető időpontok lekérése egy szakemberhez egy adott napon
   * ÚJ PARAMÉTEREK: companyId is kell
   */
  getAvailableTimeSlots(
    companyId: number,
    staffId: number,
    date: string, // YYYY-MM-DD formátum
    serviceIds: number[]
  ): Observable<AvailableTimeSlotsResponse> {
    let params = new HttpParams()
      .set('companyId', companyId.toString())
      .set('staffId', staffId.toString())
      .set('date', date);
    
    // ServiceIds hozzáadása (több érték esetén)
    serviceIds.forEach(id => {
      params = params.append('serviceIds', id.toString());
    });
    
    return this.http.get<AvailableTimeSlotsResponse>(
      `${this.apiUrl}${API_ENDPOINTS.BOOKINGS.AVAILABLE_SLOTS}`,
      { params }
    );
  }
}