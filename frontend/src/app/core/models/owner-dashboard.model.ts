export interface OwnerDashboardResponse {
  result: OwnerDashboardData;
  status: string;
  statusCode: number;
}

export interface OwnerDashboardData {
  weeklyRevenueData: OwnerDashboardWeeklyRevenue;
  todayBookingsCount: OwnerDashboardTodayBookings;
  reviewsLimited: OwnerDashboardReview[];
  activeClientsData: OwnerDashboardActiveClients;
  upcomingAppointmentsData: OwnerDashboardUpcomingAppointment[];
  servicesByCategories: OwnerDashboardServiceCategory[];
  averageRating: OwnerDashboardAverageRating;
}

export interface OwnerDashboardWeeklyRevenue {
  thisWeek: string;
  currency: string;
  lastWeek: string;
}

export interface OwnerDashboardTodayBookings {
  todayCount: number;
  yesterdayCount: number;
}

export interface OwnerDashboardReview {
  id: number;
  date: string;
  rating: number;
  comment: string;
  userName: string;
}

export interface OwnerDashboardActiveClients {
  newClientsThisWeek: number;
  activeClients: number;
}

export interface OwnerDashboardUpcomingAppointment {
  id?: number;
  date?: string;
  time?: string;
  startTime?: string;
  serviceName?: string;
  service?: string;
  clientName?: string;
  customerName?: string;
  userName?: string;
  dayLabel?: string;
}

export interface OwnerDashboardServiceCategory {
  id: number;
  name: string;
  description: string;
  services: OwnerDashboardServiceItem[];
}

export interface OwnerDashboardServiceItem {
  id: number;
  name: string;
  duration: string;
  price: number;
  currency: string;
}

export interface OwnerDashboardAverageRating {
  totalReviews: number;
  averageRating: number;
}
