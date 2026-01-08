export interface Staff {
  id: number;
  name: string;
  imageUrl: string;
  specialization?: string;
  bio?: string;
  rating?: number;
  reviewCount?: number;
  companyId: number;
}