export interface ServiceCategory {
  id: number;
  name: string;
  description?: string;
  services: Service[];
}

export interface Service {
  id: number;
  name: string;
  duration: string;  // Példa: "45 perc", "15 perc - 1 óra"
  price: number;
  currency: string;
  categoryId?: number;  // A kosárhoz szükséges (kliens oldalon adjuk hozzá)
}

/**
 * CartItem típus - a kosárban tárolt szolgáltatás
 * Tartalmazza a categoryId-t is a szűréshez
 */
export interface CartServiceItem extends Service {
  categoryId: number;  // Kötelező a kosárban
}