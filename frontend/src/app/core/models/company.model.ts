import { AddressDetails } from './address.model';
import { OpeningHours } from './opening-hours.model';
import { Review } from './review.model';
import {ServiceCategory } from './service.model';


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