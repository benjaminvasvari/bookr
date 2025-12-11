export interface Favorite {
  id: number;
  companyId: number;
  name: string;
  rating: number;
  reviewCount: number;
  address: string;
  imageUrl: string;
  serviceCategories: string[];
  addedAt: string;
}