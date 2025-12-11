// API endpoint konstansok - egy helyen minden endpoint
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH_TOKEN: '/auth/refresh',
    VERIFY_EMAIL: '/auth/verify'
  },
  
  COMPANIES: {
    LIST: '/companies',
    DETAIL: (id: number) => `/companies/loadCompanyById?id=${id}`,
    TOP_RECOMMENDATIONS: '/companies/top',
    FEATURED: '/companies/featured',
    NEW: '/companies/new',
    SEARCH: '/companies/search'
  },
  
  SERVICES: {
    LIST: '/services',
    DETAIL: (id: number) => `/services/${id}`,
    BY_COMPANY: (companyId: number) => `/companies/${companyId}/services`,
    CATEGORIES: '/services/categories'
  },
  
  SPECIALISTS: {
    LIST: '/specialists',
    DETAIL: (id: number) => `/specialists/${id}`,
    BY_COMPANY: (companyId: number) => `/companies/${companyId}/specialists`
  },
  
  BOOKINGS: {
    CREATE: '/bookings',
    LIST: '/bookings',
    USER_BOOKINGS: '/bookings/user',
    DETAIL: (id: number) => `/bookings/${id}`,
    CANCEL: (id: number) => `/bookings/${id}/cancel`,
    AVAILABLE_SLOTS: '/bookings/available-slots'
  },
  
  REVIEWS: {
    LIST: '/reviews',
    CREATE: '/reviews',
    BY_COMPANY: (companyId: number) => `/companies/${companyId}/reviews`
  },
  
  USER: {
    PROFILE: '/user/profile',
    UPDATE_PROFILE: '/user/profile',
    CHANGE_PASSWORD: '/user/change-password'
  }
};