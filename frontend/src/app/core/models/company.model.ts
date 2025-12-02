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
  openingHours?: OpeningHours;
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