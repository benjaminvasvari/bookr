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

export interface OwnerPendingStaffMember {
  createdAt: string;
  companyId: number;
  id: number;
  position: string;
  userId: number | null;
  email: string;
  status: 'pending' | string;
}

export interface OwnerUpcomingAppointment {
  id?: number;
  date?: string;
  time?: string;
  serviceName?: string;
  clientName?: string;
}

export interface OwnerActualStaffMember {
  firstName: string;
  lastName: string;
  specialties: string;
  upcomingAppointments: OwnerUpcomingAppointment[];
  color: string | null;
  displayName: string;
  imageUrl: string | null;
  id: number;
  userId: number;
}

export interface OwnerStaffWithAppointmentsResult {
  pendingStaff: OwnerPendingStaffMember[];
  actualStaff: OwnerActualStaffMember[];
}

export interface OwnerStaffWithAppointmentsResponse {
  result: OwnerStaffWithAppointmentsResult;
  status: string;
  statusCode: number;
}

export interface PendingStaffInviteRequest {
  email: string;
  position: string;
}

export interface PendingStaffInviteResult {
  id: number;
  firstName: string | null;
  lastName: string | null;
  position: string;
  email: string;
  createdAt?: string;
}

export interface PendingStaffInviteResponse {
  result: PendingStaffInviteResult;
  status: string;
  statusCode: number;
}

export interface PendingStaffCancelInviteResponse {
  status: string;
  statusCode: number;
}