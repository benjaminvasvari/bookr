// api-endpoints.ts - FRISSÍTETT
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH_TOKEN: '/auth/refresh',
    VERIFY_EMAIL: '/auth/verify',
    REQUEST_PASSWORD_RESET: '/auth/resetPassRequest',
    RESET_PASSWORD: '/auth/resetPassUpdate',
  },

  COMPANIES: {
    LIST: '/companies',
    DETAIL: (id: number) => `/companies/loadCompanyById?id=${id}`,
    SHORT: (id: number) => `/companies/short?id=${id}`,
    TOP_RECOMMENDATIONS: '/companies/top',
    FEATURED: '/companies/featured',
    NEW: '/companies/new',
    SEARCH: '/companies/search',
    BUSINESS_CATEGORIES: '/businesscat/getAll',
    REGISTER: '/companies/createFull',
  },

  SERVICES: {
    LIST: '/services',
    DETAIL: (id: number) => `/services/${id}`,
    BY_COMPANY: (companyId: number) =>
      `/services/getServiceCategoriesWithServicesByCompanyId?id=${companyId}`,
    CATEGORIES: '/services/categories',
  },

  SPECIALISTS: {
    LIST: '/specialists',
    DETAIL: (id: number) => `/specialists/${id}`,
    BY_COMPANY: (companyId: number) => `/companies/${companyId}/specialists`,
    BY_COMPANY_AND_SERVICES: '/staff/by-company-and-services',
  },

  BOOKINGS: {
    CREATE: '/bookings',
    LIST: '/bookings',
    USER_BOOKINGS: '/bookings/user',
    DETAIL: (id: number) => `/bookings/${id}`,
    CANCEL: (id: number) => `/bookings/${id}/cancel`,
    AVAILABLE_SLOTS: '/bookings/available-slots',
  },

  APPOINTMENTS: {
    UNAVAILABLE_DATES: '/appointments/unavailable-dates',
    OCCUPIED_SLOTS: '/appointments/occupied-slots',
    CREATE: '/appointments/createAppointment',
    BY_CLIENT: '/appointments/getAppointmentsByClient',
    SALES_OVERVIEW_REVENUE: (companyId: number, period: 'week' | 'month' | 'year') =>
      `/appointments/getSalesOverviewRevenueByCompany?companyId=${companyId}&period=${period}`,
    SALES_OVERVIEW_AVG_BASKET: (companyId: number, period: 'week' | 'month' | 'year') =>
      `/appointments/getSalesOverviewAvgBasket?companyId=${companyId}&period=${period}`,
    SALES_OVERVIEW_BOOKINGS_COUNT: (companyId: number, period: 'week' | 'month' | 'year') =>
      `/appointments/getSalesOverviewBookingsCount?companyId=${companyId}&period=${period}`,
    SALES_OVERVIEW_RETURNING_CLIENTS: (companyId: number, period: 'week' | 'month' | 'year') =>
      `/appointments/getSalesOverviewReturningClients?companyId=${companyId}&period=${period}`,
    SALES_REVENUE_CHART: (companyId: number, period: 'week' | 'month' | 'year') =>
      `/appointments/getSalesRevenueChart?companyId=${companyId}&period=${period}`,
    SALES_TOP_SERVICES: (companyId: number, period: 'week' | 'month' | 'year') =>
      `/services/getSalesTopServices?companyId=${companyId}&period=${period}`,
  },

  REVIEWS: {
    LIST: '/reviews',
    CREATE: '/reviews',
    BY_COMPANY: (companyId: number) => `/companies/${companyId}/reviews`,
    OWNER_PANEL: '/reviews/getOwnerPanelReviews',
  },

  USER: {
    ME: '/users/me',
    PROFILE: '/users/profile',
    UPDATE_PROFILE: '/users/updateProfile',
    CHANGE_PASSWORD: '/users/change-password',
    UPLOAD_AVATAR: '/images/uploadUserImage',
    DELETE_AVATAR: '/users/deleteAvatar',
    UPDATE_NOTIFICATION_SETTINGS: '/notifsetting/update',
    CLIENTS_BY_COMPANY: (companyId: number, page: number, pageSize: number) =>
      `/users/getClientsByCompany?companyId=${companyId}&page=${page}&pageSize=${pageSize}`,
  },

  STAFF: {
    BY_COMPANY_AND_SERVICES: '/staff/by-company-and-services',
    DASHBOARD: (userId: number) => `/staff/dashboard/${userId}`,
  },
  DASHBOARDS: {
    OWNER: '/dashboards/owner',
  },
  FAVORITES: {
    GETALL: (userId: number) => `/favorites/getFavorites?id=${userId}`,
    ADD: (companyId: number) => `/favorites/addFavorite/${companyId}`,
    REMOVE: (companyId: number) => `/favorites/removeFavorite/${companyId}`,
  },

  DELETE_USER: '/users/deleteUser',
};
