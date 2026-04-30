export interface OwnerClientsApiResponse {
  result: {
    clients?: OwnerClientApiItem[];
    result?: OwnerClientApiItem[];
    totalClients: number;
  };
  status: string;
  statusCode: number;
}

export interface OwnerClientApiItem {
  id?: number;
  userId?: number;
  clientId?: number;
  Id?: number;
  UserId?: number;
  ClientId?: number;
  firstName?: string;
  lastName?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  fullName?: string;
  FirstName?: string;
  LastName?: string;
  Name?: string;
  email?: string;
  Email?: string;
  totalBookings?: number;
  totalAppointments?: number;
  bookingCount?: number;
  appointmentsCount?: number;
  TotalBookings?: number;
  TotalAppointments?: number;
  BookingCount?: number;
  AppointmentsCount?: number;
  appointments?: unknown[];
  Appointments?: unknown[];
}