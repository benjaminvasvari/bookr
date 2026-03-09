import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

import { CartService, CartItem } from '../core/services/cart.service';
import { CompaniesService } from '../core/services/companies.service';
import { CompanyShort } from '../core/models/company.model';
import { ServiceCategory, Service } from '../core/models/service.model';
import { HungarianCurrencyPipe } from '../core/pipes/hungarian-currency.pipe';


@Component({
  selector: 'app-appointment',
  standalone: true,
  imports: [CommonModule, HungarianCurrencyPipe],
  templateUrl: './appointment.component.html',
  styleUrl: './appointment.component.css',
})
export class AppointmentComponent implements OnInit, OnDestroy {
  companyId: number = 0;
  
  // Adatok
  company: CompanyShort | null = null;
  categories: ServiceCategory[] = [];
  services: Service[] = [];  // Összes szolgáltatás "lapos" listában
  filteredServices: Service[] = [];
  selectedCategory: number | null = null;
  cart: CartItem[] = [];
  
  // UI státuszok
  isLoading: boolean = true;
  loadError: string | null = null;
  
  // Cleanup
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cartService: CartService,
    private companiesService: CompaniesService
  ) {}

  ngOnInit(): void {
    // companyId kiolvasása az URL-ből
    this.companyId = Number(this.route.snapshot.paramMap.get('companyId'));
    
    if (!this.companyId || isNaN(this.companyId)) {
      this.loadError = 'Érvénytelen cég azonosító.';
      this.isLoading = false;
      return;
    }
    
    // Adatok betöltése
    this.loadData();
    
    // Kosár betöltése a service-ből
    this.loadCart();
    
    // Oldal tetejére görgetés
    window.scrollTo(0, 0);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Adatok betöltése API-ból (párhuzamosan)
   */
  loadData(): void {
    this.isLoading = true;
    this.loadError = null;
    
    // Párhuzamos API hívások
    forkJoin({
      company: this.companiesService.getCompanyShort(this.companyId),
      categories: this.companiesService.getServiceCategoriesWithServices(this.companyId)
    })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (data) => {
          this.company = data.company;
          this.categories = data.categories;
          
          // Szolgáltatások "lapos" listává alakítása (kategóriák szétbontása)
          this.services = this.flattenServices(data.categories);
          this.filteredServices = [...this.services];
          
          // Ha van serviceId query param, automatikusan kosárba tenni
          this.handleServiceIdQueryParam();

          console.log(this.companiesService)
        },
        error: (error) => {
          console.error('Error loading appointment data:', error);
          this.loadError = 'Hiba történt az adatok betöltésekor. Kérjük próbálja újra később.';
        }
      });
  }

  /**
   * Szolgáltatások "lapos" listává alakítása
   * Minden service-hez hozzáadjuk a categoryId-t is
   */
  private flattenServices(categories: ServiceCategory[]): Service[] {
    const flatServices: Service[] = [];
    
    categories.forEach(category => {
      category.services.forEach(service => {
        flatServices.push({
          ...service,
          categoryId: category.id
        });
      });
    });
    
    return flatServices;
  }

  /**
   * Ha van serviceId query param, automatikusan kosárba tenni
   */
  private handleServiceIdQueryParam(): void {
    const serviceId = this.route.snapshot.queryParamMap.get('serviceId');
    if (serviceId) {
      const service = this.services.find((s) => s.id === Number(serviceId));
      if (service) {
        this.addToCart(service);
      }
    }
  }

  /**
   * Kosár betöltése és feliratkozás változásokra
   */
  loadCart(): void {
    this.cartService.cart$
      .pipe(takeUntil(this.destroy$))
      .subscribe(cart => {
        this.cart = cart;
      });
  }

  /**
   * Kategória szűrés
   */
  filterByCategory(categoryId: number | null): void {
    this.selectedCategory = categoryId;
    
    if (categoryId === null) {
      // Összes szolgáltatás megjelenítése
      this.filteredServices = [...this.services];
    } else {
      // Csak a kiválasztott kategória szolgáltatásai
      this.filteredServices = this.services.filter((s) => s.categoryId === categoryId);
    }
  }

  /**
   * Kosárba helyezés
   */
  addToCart(service: Service): void {
    // Service -> CartItem konverzió
    const cartItem: CartItem = {
      id: service.id,
      name: service.name,
      duration: service.duration,
      price: service.price,
      currency: service.currency,
      categoryId: service.categoryId || 0
    };
    
    this.cartService.addToCart(cartItem);
  }

  /**
   * Ellenőrzi hogy a szolgáltatás már a kosárban van-e
   */
  isInCart(serviceId: number): boolean {
    return this.cartService.isInCart(serviceId);
  }

  /**
   * Kosárból törlés
   */
  removeFromCart(serviceId: number): void {
    this.cartService.removeFromCart(serviceId);
  }

  /**
   * Kosár összeg számítás
   */
  getCartTotal(): number {
    return this.cartService.getTotal();
  }

  /**
   * Folytatás gomb - navigálás a szakember választó oldalra
   */
  continue(): void {
    if (this.cart.length > 0) {
      this.router.navigate(['/appointment', this.companyId, 'specialists']);
    }
  }

  /**
   * Újrapróbálkozás gomb (error esetén)
   */
  retry(): void {
    this.loadData();
  }
}