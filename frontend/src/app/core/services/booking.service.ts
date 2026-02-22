// src/app/core/services/booking.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import { 
  Booking,
  ClientAppointment,
  ClientAppointmentsResponse,
  CreateAppointmentRequest,
  UnavailableDate,
  UnavailableDatesResponse,
  OccupiedSlotsResponse
} from '../models/booking.model';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private apiUrl = environment.apiUrl;

  private readonly apiBaseUrl = environment.apiUrl.replace(/\/api\/?$/, '');

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

  /**
   * Ügyfél foglalásainak lekérése (profil oldal)
   */
  getAppointmentsByClient(
    isUpcoming: boolean,
    page: number = 1,
    amount: number = 5
  ): Observable<Booking[]> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('amount', amount.toString())
      .set('isupcoming', isUpcoming ? '1' : '0');

    return this.http
      .get<ClientAppointmentsResponse>(
        `${this.apiUrl}${API_ENDPOINTS.APPOINTMENTS.BY_CLIENT}`,
        { params }
      )
      .pipe(
        map(response => response.data?.appointments || []),
        map(appointments =>
          appointments.map(appointment => this.mapAppointmentToBooking(appointment, isUpcoming))
        )
      );
  }

  /**
   * Foglalas letrehozasa
   */
  createAppointment(request: CreateAppointmentRequest): Observable<any> {
    const serviceIds = request.serviceIds.length === 1 ? request.serviceIds[0] : request.serviceIds;
    const payload = { ...request, serviceIds };

    return this.http.post(`${this.apiUrl}${API_ENDPOINTS.APPOINTMENTS.CREATE}`, payload);
  }

  private mapAppointmentToBooking(
    appointment: ClientAppointment,
    isUpcoming: boolean
  ): Booking {
    const { date, time } = this.extractDateTime(appointment.startTime);
    const serviceName =
      appointment.serviceNames || appointment.services?.[0]?.serviceName || 'Szolgáltatás';

    return {
      id: appointment.appointmentId ?? appointment.id ?? 0,
      companyId: appointment.companyId,
      companyName: appointment.companyName,
      companyImage: this.buildImageUrl(appointment.companyLogo),
      serviceName,
      serviceCategory: '',
      specialistName: this.normalizeStaffName(appointment.staffName),
      date,
      time,
      price: appointment.totalPrice,
      status: this.mapStatus(appointment.status, isUpcoming),
      canReview: false,
      reviewId: null,
    };
  }

  private extractDateTime(startTime: string): { date: string; time: string } {
    if (!startTime) {
      return { date: '', time: '' };
    }

    const [datePart, timePart] = startTime.split(' ');
    if (datePart && timePart) {
      return { date: datePart, time: timePart.slice(0, 5) };
    }

    const parsed = new Date(startTime);
    if (Number.isNaN(parsed.getTime())) {
      return { date: startTime, time: '' };
    }

    const date = parsed.toISOString().slice(0, 10);
    const time = parsed.toTimeString().slice(0, 5);
    return { date, time };
  }

  private mapStatus(status: string, isUpcoming: boolean): Booking['status'] {
    const normalized = (status || '').toLowerCase();
    switch (normalized) {
      case 'booked':
        return 'upcoming';
      case 'completed':
        return 'completed';
      case 'cancelled':
      case 'no_show':
        return 'cancelled';
      default:
        return isUpcoming ? 'upcoming' : 'completed';
    }
  }

  private buildImageUrl(path: string): string {
    if (!path) {
      return '';
    }

    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }

    if (path.startsWith('/')) {
      return `${this.apiBaseUrl}${path}`;
    }

    return `${this.apiBaseUrl}/${path}`;
  }

  private normalizeStaffName(staffName: string | null | undefined): string {
    const name = (staffName || '').trim();
    if (!name || name.toLowerCase().includes('null')) {
      return 'Nincs megadva';
    }
    return name;
  }
}