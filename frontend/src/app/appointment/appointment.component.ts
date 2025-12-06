import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CartService, CartItem } from '../core/services/cart.service';

@Component({
  selector: 'app-appointment',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './appointment.component.html',
  styleUrl: './appointment.component.css',
})
export class AppointmentComponent implements OnInit {
  companyId: number = 0;

  // Mock adatok (később API-ból jönnek majd)
  company: any = null;
  categories: any[] = [];
  services: any[] = [];
  filteredServices: any[] = [];
  selectedCategory: number | null = null;
  cart: CartItem[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    // companyId kiolvasása az URL-ből
    this.companyId = Number(this.route.snapshot.paramMap.get('companyId'));
    // Mock adatok betöltése
    this.loadMockData();
    // Kosár betöltése a service-ből
    this.loadCart();
    
    // Ha van serviceId query param, automatikusan kosárba tenni
    const serviceId = this.route.snapshot.queryParamMap.get('serviceId');
    if (serviceId) {
      const service = this.services.find((s) => s.id === Number(serviceId));
      if (service) {
        this.addToCart(service);
      }
    }

    // Oldal tetejére görgetés
    window.scrollTo(0, 0);
  }

  loadMockData(): void {
    // Mock cég adatok
    this.company = {
      id: this.companyId,
      name: 'Szalon neve',
      address: 'újhelyi u. 86',
      rating: 5.0,
      imageUrl: 'assets/placeholder.jpg',
    };

    // Mock kategóriák
    this.categories = [
      { id: 1, name: 'Hajvágás' },
      { id: 2, name: 'Festés' },
      { id: 3, name: 'Manikűr' },
      { id: 4, name: 'Pedikűr' },
      { id: 5, name: 'Masszázs' },
    ];

    // Mock szolgáltatások
    this.services = [
      { id: 1, name: 'szolgáltatás', duration: 45, price: 4500, categoryId: 1 },
      { id: 2, name: 'szolgáltatás', duration: 60, price: 5500, categoryId: 1 },
      { id: 3, name: 'szolgáltatás', duration: 120, price: 8500, categoryId: 2 },
      { id: 4, name: 'szolgáltatás', duration: 30, price: 3500, categoryId: 3 },
      { id: 5, name: 'szolgáltatás', duration: 45, price: 4000, categoryId: 4 },
    ];

    this.filteredServices = [...this.services];
  }

  loadCart(): void {
    // Feliratkozás a kosár változásaira
    this.cartService.cart$.subscribe(cart => {
      this.cart = cart;
    });
  }

  // Kategória szűrés
  filterByCategory(categoryId: number | null): void {
    if (categoryId === null) {
      this.filteredServices = [...this.services];
    } else {
      this.filteredServices = this.services.filter((s) => s.categoryId === categoryId);
    }
    this.selectedCategory = categoryId;
  }

  // Kosárba helyezés
  addToCart(service: any): void {
    this.cartService.addToCart(service as CartItem);
  }

  // Ellenőrzi hogy a szolgáltatás már a kosárban van-e
  isInCart(serviceId: number): boolean {
    return this.cartService.isInCart(serviceId);
  }

  // Kosárból törlés
  removeFromCart(serviceId: number): void {
    this.cartService.removeFromCart(serviceId);
  }

  // Kosár összeg számítás
  getCartTotal(): number {
    return this.cartService.getTotal();
  }

  // Folytatás gomb
  continue(): void {
    if (this.cart.length > 0) {
      // Navigálás a szakember választó oldalra
      this.router.navigate(['/appointment', this.companyId, 'specialists']);
    }
  }
}