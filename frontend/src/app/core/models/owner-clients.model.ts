export interface OwnerClientsApiResponse {
  result: {
    result: OwnerClientApiItem[];
    totalClients: number;
  };
  status: string;
  statusCode: number;
}

export interface OwnerClientApiItem {
  id?: number;
  userId?: number;
  clientId?: number;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  totalBookings?: number;
  bookingCount?: number;
  appointmentsCount?: number;
}
