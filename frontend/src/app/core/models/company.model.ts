export interface Company {
  id: number;
  name: string;
  rating: number;
  reviewCount: number;
  address: string;
  addressDetails?: AddressDetails;
  imageUrl: string;
  description?: string;
  phone?: string;
  email?: string;
  website?: string;
  businessCategoryId?: number;
  category?: string;
  galleryImages?: string[];
  openingHours?: OpeningHours;
  serviceCategories?: ServiceCategory[];
  reviews?: Review[];
  isFavorite?: boolean;
  statusCode?: number;
}

// ÚJ INTERFACE - ServiceCategory
export interface ServiceCategory {
  id: number;
  name: string;
  description?: string;
  services: Service[];  // ← EZ A FONTOS!
}

export interface Service {
  id: number;
  name: string;
  duration: string;  // "45 p - 1 ó"
  price: number;
  currency: string;
}

export interface Review {
  id: number;
  userName: string;
  userImage?: string;
  rating: number;
  comment: string;
  date: string;  // "2024. 11. 15."
}

export interface OpeningHours {
  monday?: string;
  tuesday?: string;
  wednesday?: string;
  thursday?: string;
  friday?: string;
  saturday?: string;
  sunday?: string;
}

export interface CreateReviewRequest {
  companyId: number;
  rating: number;
  comment: string;
}

export interface AddressDetails {
  street: string;
  postalCode: string;
  city: string;
  country: string;
}