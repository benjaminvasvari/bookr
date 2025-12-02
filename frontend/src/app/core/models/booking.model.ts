export interface Booking {
  id?: number;
  userId: number;
  companyId: number;
  specialistId: number;
  serviceIds: number[];
  date: string; // ISO date format
  time: string; // HH:mm format
  totalPrice: number;
  status: BookingStatus;
  createdAt?: string;
  updatedAt?: string;
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

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface AvailableTimeSlotsResponse {
  date: string;
  slots: TimeSlot[];
}