// src/app/core/models/booking.model.ts

export interface Booking {
  id: number;
  companyId: number;
  companyName: string;
  companyImage: string;
  serviceName: string;
  serviceCategory: string;
  specialistName: string;
  date: string;
  time: string;
  price: number;
  status: 'upcoming' | 'completed' | 'cancelled';
  canReview?: boolean;
  reviewId?: number | null;
}

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED'
}

export interface CreateBookingRequest {
  companyId: number;
  specialistId: number;
  serviceIds: number[];
  date: string;
  time: string;
}

/**
 * Unavailable dates response
 */
export interface UnavailableDatesResponse {
  data: {
    unavailableDates: UnavailableDate[];
    advanceDays: number;
    periodStart: string;
    periodEnd: string;
  };
  message: string;
  status: string;
  statusCode: number;
}

export interface UnavailableDate {
  date: string;        // "YYYY-MM-DD"
  reason: string;      // "Company closed"
  dayOfWeek: string;   // "sunday"
}

/**
 * Occupied slots response
 */
export interface OccupiedSlotsResponse {
  data: {
    date: string;
    staffId: number;
    workingHours: WorkingHours[];  // ⬅️ TÖMB, NEM object!
    occupiedSlots: OccupiedSlot[];
  };
  message: string;
  status: string;
  statusCode: number;
}

export interface WorkingHours {
  startTime: string;      // "10:00"
  endTime: string;        // "14:00"
  isAvailable: boolean;
}

export interface OccupiedSlot {
  appointmentId: number;
  startTime: string;      // "10:00"
  endTime: string;        // "11:00"
  serviceId: number;
  durationMinutes: number;
}

export interface ClientAppointmentService {
  duration: number;
  price: number;
  serviceId: number;
  serviceName: string;
}

export interface ClientAppointment {
  appointmentId?: number;
  id?: number;
  companyId: number;
  totalPrice: number;
  companyLogo: string;
  companyName: string;
  staffName: string | null;
  startTime: string;
  endTime: string;
  services: ClientAppointmentService[];
  serviceNames?: string;
  staffId?: number;
  status: string;
}

export interface ClientAppointmentsResponse {
  data: {
    appointments: ClientAppointment[];
    totalPages: number;
    totalCount: number;
    currentPage: number;
  };
  status: string;
  statusCode: number;
}

export interface CreateAppointmentRequest {
  companyId: number;
  serviceIds: number[];
  staffId: number;
  startTime: string;
  endTime: string;
  notes?: string;
  price: number;
}