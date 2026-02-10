import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { Title } from '@angular/platform-browser';
import { HungarianCurrencyPipe } from '../core/pipes/hungarian-currency.pipe';

// Importáljuk a models-ből az interface-eket
import { Company } from '../core/models';
// Importáljuk a service-t
import { CompaniesService } from '../core/services/companies.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Service } from '../core/models/service.model';
import { Favorite, FavoritesService } from '../core/services/favorites.service';
import { combineLatest, Subscription } from 'rxjs';

@Component({
  selector: 'app-sel-industry',
  standalone: true,
  imports: [CommonModule, HungarianCurrencyPipe],
  templateUrl: './sel-industry.component.html',
  styleUrls: ['./sel-industry.component.css'],
})
export class SelIndustryComponent implements OnInit, OnDestroy {
  companyId: number | null = null;
  company: Company | null = null;
  selectedCategoryId: number | null = null;
  isLoading: boolean = false;
  errorMessage: string = '';
  isFavorite: boolean = false;
  private favoritesLoaded = false;
  private favorites: Favorite[] = [];
  private routeSubscription?: Subscription;
  private favoritesSubscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private companiesService: CompaniesService,
    private sanitizer: DomSanitizer,
    private title: Title,
    private favoritesService: FavoritesService
  ) {}

  ngOnInit(): void {
    // URL paraméterből kinyerjük a company ID-t
    this.routeSubscription = this.route.params.subscribe((params) => {
      this.companyId = +params['id'];
      this.loadCompanyDetails();
      this.updateFavoriteState();
    });

    this.favoritesSubscription = combineLatest([
      this.favoritesService.favorites$,
      this.favoritesService.favoritesLoaded$
    ]).subscribe(([favorites, loaded]) => {
      this.favorites = favorites;
      this.favoritesLoaded = loaded;
      if (loaded) {
        this.updateFavoriteState();
      }
    });

    // Oldal tetejére görgetés
    window.scrollTo(0, 0);
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
    this.favoritesSubscription?.unsubscribe();
  }

  loadCompanyDetails(): void {
    // Ellenőrizzük hogy van-e companyId
    if (!this.companyId) {
      this.errorMessage = 'Érvénytelen cég azonosító';
      return;
    }

    // Betöltés kezdése
    this.isLoading = true;
    this.errorMessage = '';

    // API hívás a service-en keresztül
    this.companiesService.getCompanyById(this.companyId).subscribe({
      // Sikeres válasz esetén
      next: (data: Company) => {
        this.company = data;
        this.isLoading = false;

        this.title.setTitle(`${data.name} | Bookr`);

        // Első kategória automatikus kiválasztása
        if (data.serviceCategories && data.serviceCategories.length > 0) {
          this.selectedCategoryId = data.serviceCategories[0].id;
        }

        // Ha a backend küldi az isFavorite mezőt, használjuk
        if (data.isFavorite !== undefined) {
          this.isFavorite = data.isFavorite;
        }

        this.updateFavoriteState();

        console.log('Cég adatok betöltve:', data);
      },

      // Hiba esetén
      error: (error) => {
        console.error('Hiba a cég betöltése során:', error);
        this.errorMessage = 'Nem sikerült betölteni a cég adatait. Kérjük próbálja újra később.';
        this.isLoading = false;
      },
    });
  }

  selectCategory(categoryId: number): void {
    this.selectedCategoryId = categoryId;
  }

  toggleFavorite(): void {
    if (!this.companyId) {
      return;
    }

    const nextState = !this.isFavorite;
    this.isFavorite = nextState;

    const request$ = nextState
      ? this.favoritesService.addFavorite(this.companyId)
      : this.favoritesService.removeFavorite(this.companyId);

    request$.subscribe({
      error: (error) => {
        console.error('Hiba a kedvenc módosítása során:', error);
        this.isFavorite = !nextState;
      },
    });
  }

  private updateFavoriteState(): void {
    if (!this.companyId || !this.favoritesLoaded) {
      return;
    }

    this.isFavorite = this.favorites.some(
      (favorite) => favorite.company.companyId === this.companyId
    );
  }

  shareCompany(): void {
    if (navigator.share) {
      navigator
        .share({
          title: this.company?.name,
          text: this.company?.description,
          url: window.location.href,
        })
        .catch((err) => console.log('Megosztás sikertelen', err));
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link másolva a vágólapra!');
    }
  }

  bookNow(): void {
    if (this.company?.id) {
      this.router.navigate(['/appointment', this.company.id, 'services']);
    }
  }

  bookService(service: Service): void {
    if (this.company?.id) {
      this.router.navigate(['/appointment', this.company.id, 'services'], {
        queryParams: { serviceId: service.id },
      });
    }
  }

  getRatingStars(): number[] {
    const rating = this.company?.rating || 0;
    return Array(Math.floor(rating)).fill(0);
  }

  getReviewStars(rating: number): number[] {
    return Array(Math.floor(rating)).fill(0);
  }

  getMapUrl(): SafeResourceUrl {
    if (!this.company?.addressDetails) {
      return '';
    }

    const details = this.company.addressDetails;

    // Összerakod a címet
    const address = `${details.street}, ${details.postalCode} ${details.city}, ${details.country}`;

    // URL encode
    const encodedAddress = encodeURIComponent(address);

    // Google Maps URL
    const url = `https://maps.google.com/maps?q=${encodedAddress}&output=embed`;
    // Sanitize
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  getMapTitle(): string {
    if (!this.company) return 'Térkép - Bookr';

    const details = this.company.addressDetails;
    if (!details) return `${this.company.name} - Térkép`;

    return `${this.company.name} - ${details.street}, ${details.city}`;
  }

  /**
   * Mai nap meghatározása (lowercase)
   * @returns 'monday' | 'tuesday' | ... | 'sunday'
   */
  getCurrentDay(): string {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = new Date().getDay(); // 0 = vasárnap, 1 = hétfő, ...
    return days[today];
  }

  /**
   * Ellenőrzi hogy az adott nap ma van-e
   * @param day 'monday' | 'tuesday' | ...
   * @returns boolean
   */
  isToday(day: string): boolean {
    return this.getCurrentDay() === day.toLowerCase();
  }

}
