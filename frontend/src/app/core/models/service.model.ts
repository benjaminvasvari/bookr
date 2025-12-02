export interface Service {
  id: number;
  name: string;
  description?: string;
  duration: number; // percben
  price: number; // Ft-ban
  categoryId: number;
  category?: ServiceCategory;
  imageUrl?: string;
}

export interface ServiceCategory {
  id: number;
  name: string;
  description?: string;
  icon?: string;
}