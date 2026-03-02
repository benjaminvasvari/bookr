export interface Company {
  id: number;
  name: string;
  rating: number;
  reviewCount: number;
  address: string;
  imageUrl: string;
  description?: string;
  phone?: string;
  email?: string;
  website?: string;
  category?: string;
  galleryImages?: string[];
  openingHours?: OpeningHours;
  services?: Service[];
  reviews?: Review[];
  isFavorite?: boolean;
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

export interface Service {
  id: number;
  name: string;
  duration: string;
  price: number;
  currency: string;
}

export interface Review {
  id: number;
  userName: string;
  userImage?: string;
  rating: number;
  comment: string;
  date: string;
}

export interface ServiceCategory {
  id: number;
  name: string;
  description?: string;
}

// ÚJ - CreateReviewRequest interface
export interface CreateReviewRequest {
  companyId: number;
  rating: number;
  comment: string;
}