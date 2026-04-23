import { OpeningHours } from './opening-hours.model';
import { Review } from './review.model';
import { ServiceCategory } from './service.model';

export interface AddressDetails {
  street: string;
  city: string;
  postalCode: string;
  country: string;
}

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

/**
 * Egyszerűsített Company típus - rövid adatok (pl. kosár megjelenítéshez)
 */
export interface CompanyShort {
  id: number;
  name: string;
  rating: number;
  reviewCount: number;
  address: string;
  addressDetails?: AddressDetails;
  imageUrl: string;
  statusCode?: number;
}