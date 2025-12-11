export interface ServiceCategory {
  id: number;
  name: string;
  description?: string;
  services: Service[];
}

export interface Service {
  id: number;
  name: string;
  duration: string;  // "45 p - 1 ó"
  price: number;
  currency: string;
}