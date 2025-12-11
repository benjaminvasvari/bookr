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

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface AvailableTimeSlotsResponse {
  date: string;
  slots: TimeSlot[];
}