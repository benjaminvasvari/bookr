export interface Staff {
  id: number;
  name: string;
  imageUrl: string;
  specialization?: string;
  bio?: string;
  rating?: number;
  reviewCount?: number;
  companyId: number;
}

/**
 * Staff by services response
 */
export interface StaffByServicesResponse {
  result: StaffMember[];
  status: string;
  statusCode: number;
}

export interface StaffMember {
  id: number;
  userId: number;
  companyId: number;
  displayName: string;
  firstName: string;
  lastName: string;
  specialties: string;
  bio: string;
  imageUrl: string | null;
  isActive: boolean;
  servicesCount: number;
}

export interface StaffDashboardAppointment {
  id: number;
  date: string;
  time: string;
  serviceName: string;
  clientName: string;
  durationMinutes: number;
}

export interface StaffDashboardService {
  id: number;
  name: string;
  durationMinutes: number;
  price: number;
}

export interface StaffDashboardData {
  staffId: number;
  staffName: string;
  companyName: string;
  todayAppointments: StaffDashboardAppointment[];
  upcomingAppointments: StaffDashboardAppointment[];
  services: StaffDashboardService[];
}

export interface StaffDashboardResponse {
  result: StaffDashboardData;
  status: string;
  statusCode: number;
}