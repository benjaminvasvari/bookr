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
    CREATE: '/create-appointment',
  },

  REVIEWS: {
    LIST: '/reviews',
    CREATE: '/reviews',
    BY_COMPANY: (companyId: number) => `/companies/${companyId}/reviews`,
  },

  USER: {
    PROFILE: '/user/profile',
    UPDATE_PROFILE: '/user/updateProfile',
    CHANGE_PASSWORD: '/user/change-password',
    UPLOAD_AVATAR: '/user/uploadAvatar',
    DELETE_AVATAR: '/user/deleteAvatar',
  },

  STAFF: {
    BY_COMPANY_AND_SERVICES: '/staff/by-company-and-services',
  },
};
