export interface Service {
  id: number;
  name: string;
  duration: number;
  price: number;
  categoryId: number;
  description?: string;
}

export interface ServiceCategory {
  id: number;
  name: string;
}

export interface Company {
  id: number;
  name: string;
  address: string;
  rating: number;
  imageUrl: string;
}