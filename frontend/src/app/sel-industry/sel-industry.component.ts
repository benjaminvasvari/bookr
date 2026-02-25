import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { Title } from '@angular/platform-browser';
import { HungarianCurrencyPipe } from '../core/pipes/hungarian-currency.pipe';

// Importáljuk a models-ből az interface-eket
import { Company } from '../core/models';
// Importáljuk a service-t
import { CompaniesService } from '../core/services/companies.service';
import { Service } from '../core/models/service.model';
import { Favorite, FavoritesService } from '../core/services/favorites.service';
import { combineLatest, Subscription } from 'rxjs';

type LeafletModule = typeof import('leaflet');

interface GeocodeResult {
  lat: string;
  lon: string;
}

interface PhotonFeature {
  geometry?: {
    coordinates?: [number, number];
  };
}

interface PhotonResponse {
  features?: PhotonFeature[];
}

interface TeamMember {
  id: number;
  name: string;
  initials: string;
  role: string;
  bio?: string;
}

@Component({
  selector: 'app-sel-industry',
  standalone: true,
  imports: [CommonModule, HungarianCurrencyPipe],
  templateUrl: './sel-industry.component.html',
  styleUrls: ['./sel-industry.component.css'],
})
export class SelIndustryComponent implements OnInit, OnDestroy {
  @ViewChild('companyMap') private mapElement?: ElementRef<HTMLDivElement>;

  companyId: number | null = null;
  company: Company | null = null;
  selectedCategoryId: number | null = null;
  isLoading: boolean = false;
  isMapLoading = false;
  mapError = '';
  errorMessage: string = '';
  isFavorite: boolean = false;
  selectedImagePreview: string | null = null;
  selectedImageAlt = '';
  private readonly teamBioPreviewLimit = 115;
  private readonly reviewPreviewLimit = 120;
  private readonly defaultMapCoordinates = { lat: 47.4979, lng: 19.0402 };
  private readonly cityFallbackCoordinates: Record<string, { lat: number; lng: number }> = {
    budapest: { lat: 47.4979, lng: 19.0402 },
    pecs: { lat: 46.0727, lng: 18.2323 },
    debrecen: { lat: 47.5316, lng: 21.6273 },
    szeged: { lat: 46.2530, lng: 20.1414 },
    gyor: { lat: 47.6875, lng: 17.6504 },
    miskolc: { lat: 48.1035, lng: 20.7784 },
    nyiregyhaza: { lat: 47.9495, lng: 21.7244 },
    kecskemet: { lat: 46.8964, lng: 19.6897 },
  };
  private readonly expandedTeamBioIds = new Set<number>();
  private readonly expandedReviewIds = new Set<number>();
  public readonly teamMembers: TeamMember[] = [
    {
      id: 1,
      name: 'Kovács Anna',
      initials: 'KA',
      role: 'Senior Stylist',
      bio: 'Precíz hajvágás és modern színtechnikák specialistája, vendégközpontú szemlélettel.',
    },
    {
      id: 2,
      name: 'Nagy Dániel',
      initials: 'ND',
      role: 'Barber & Grooming Expert',
      bio: 'Férfi haj- és szakállformázásban erős, klasszikus és trendi vonalon egyaránt.',
    },
    {
      id: 3,
      name: 'Tóth Petra',
      initials: 'TP',
      role: 'Color Specialist',
      bio: 'Kíméletes, tartós és természetes hatású színezések, kiemelt fókuszban a hajvédelem, személyre szabott otthoni rutinnal és hosszú távú hajegészség támogatással.',
    },
    {
      id: 4,
      name: 'Szabó Máté',
      initials: 'SM',
      role: 'Junior Stylist',
      bio: '',
    },
  ];
  private favoritesLoaded = false;
  private favorites: Favorite[] = [];
  private routeSubscription?: Subscription;
  private favoritesSubscription?: Subscription;
  private map?: import('leaflet').Map;
  private leaflet?: LeafletModule;
  private mapInitId = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private companiesService: CompaniesService,
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
    this.mapInitId++;
    this.routeSubscription?.unsubscribe();
    this.favoritesSubscription?.unsubscribe();
    this.destroyMap();
    document.body.style.overflow = '';
  }

  openImagePreview(imageUrl: string | undefined, altText: string): void {
    const source = imageUrl?.trim() ?? '';
    if (!source) {
      return;
    }

    this.selectedImagePreview = source;
    this.selectedImageAlt = altText;
    document.body.style.overflow = 'hidden';
  }

  closeImagePreview(): void {
    this.selectedImagePreview = null;
    this.selectedImageAlt = '';
    document.body.style.overflow = '';
  }

  handleLightboxBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeImagePreview();
    }
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
        this.mapError = '';

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
        this.scheduleMapInitialization();

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
    const rating = Math.max(0, Math.min(5, this.company?.rating ?? 0));
    return Array.from({ length: 5 }, (_, index) => {
      const fill = rating - index;
      return Math.max(0, Math.min(1, fill));
    });
  }

  getReviewStars(rating: number): number[] {
    return Array(Math.floor(rating)).fill(0);
  }

  getReviewComment(review: { id: number; comment: string }): string {
    const fullComment = review.comment?.trim() ?? '';

    if (this.isReviewExpanded(review.id) || fullComment.length <= this.reviewPreviewLimit) {
      return fullComment;
    }

    return `${fullComment.slice(0, this.reviewPreviewLimit).trimEnd()}...`;
  }

  hasLongReviewComment(comment: string | undefined): boolean {
    return (comment?.trim().length ?? 0) > this.reviewPreviewLimit;
  }

  isReviewExpanded(reviewId: number): boolean {
    return this.expandedReviewIds.has(reviewId);
  }

  toggleReviewComment(reviewId: number): void {
    if (this.expandedReviewIds.has(reviewId)) {
      this.expandedReviewIds.delete(reviewId);
      return;
    }

    this.expandedReviewIds.add(reviewId);
  }

  getTeamBio(member: TeamMember): string {
    const fullBio = member.bio?.trim() ?? '';

    if (this.isTeamBioExpanded(member.id) || fullBio.length <= this.teamBioPreviewLimit) {
      return fullBio;
    }

    return `${fullBio.slice(0, this.teamBioPreviewLimit).trimEnd()}...`;
  }

  hasTeamBio(member: TeamMember): boolean {
    return (member.bio?.trim().length ?? 0) > 0;
  }

  hasLongTeamBio(member: TeamMember): boolean {
    return (member.bio?.trim().length ?? 0) > this.teamBioPreviewLimit;
  }

  isTeamBioExpanded(memberId: number): boolean {
    return this.expandedTeamBioIds.has(memberId);
  }

  toggleTeamBio(memberId: number): void {
    if (this.expandedTeamBioIds.has(memberId)) {
      this.expandedTeamBioIds.delete(memberId);
      return;
    }

    this.expandedTeamBioIds.add(memberId);
  }

  getMainGalleryImage(): string {
    if (!this.company) {
      return '';
    }

    const mainImage = (this.company.imageUrl || '').trim();
    if (mainImage) {
      return mainImage;
    }

    const firstGalleryImage = (this.company.galleryImages ?? []).find((image) => !!image?.trim());
    return firstGalleryImage ?? '';
  }

  getThumbnailGalleryImages(): string[] {
    if (!this.company) {
      return [];
    }

    const mainImage = this.getMainGalleryImage();
    const gallery = (this.company.galleryImages ?? [])
      .map((image) => image?.trim() ?? '')
      .filter((image) => image.length > 0 && image !== mainImage);

    const thumbnails = gallery.slice(0, 3);
    return thumbnails;
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

  private scheduleMapInitialization(): void {
    const initId = ++this.mapInitId;

    setTimeout(() => {
      if (initId !== this.mapInitId) {
        return;
      }

      void this.initializeMap();
    }, 0);
  }

  private async initializeMap(): Promise<void> {
    if (!this.company) {
      return;
    }

    const container = this.mapElement?.nativeElement;
    if (!container) {
      this.scheduleMapInitialization();
      return;
    }

    this.isMapLoading = true;
    this.mapError = '';

    const address = this.getFullAddress();
    if (!address) {
      this.isMapLoading = false;
      this.mapError = 'Ehhez a céghez még nincs cím megadva.';
      return;
    }

    const coordinates =
      (await this.geocodeAddress(address)) ??
      this.getCityFallbackCoordinates() ??
      this.defaultMapCoordinates;

    try {
      const L = await this.getLeaflet();
      this.destroyMap();

      this.map = L.map(container, {
        zoomControl: true,
        scrollWheelZoom: false,
      }).setView([coordinates.lat, coordinates.lng], 15);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap közreműködők',
      }).addTo(this.map);

      const markerIcon = L.divIcon({
        className: 'company-location-marker',
        html: '<span class="marker-pin"><span class="marker-pin-center"></span></span>',
        iconSize: [30, 42],
        iconAnchor: [15, 42],
        popupAnchor: [0, -38],
      });

      L.marker([coordinates.lat, coordinates.lng], {
        icon: markerIcon,
      })
        .addTo(this.map)
        .bindPopup(this.getMapPopupContent(), {
          className: 'company-map-popup',
          maxWidth: 280,
          autoPanPadding: [24, 24],
          offset: [0, -8],
        });

      this.isMapLoading = false;
      setTimeout(() => this.map?.invalidateSize(), 50);
    } catch (error) {
      console.error('Map initialization error:', error);
      this.isMapLoading = false;
      this.mapError = 'A térkép betöltése közben hiba történt.';
    }
  }

  private async getLeaflet(): Promise<LeafletModule> {
    if (!this.leaflet) {
      this.leaflet = await import('leaflet');
    }

    return this.leaflet;
  }

  private async geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    const providers = [
      () => this.geocodeWithPhoton(address),
      () => this.geocodeWithNominatim(address),
    ];

    for (const provider of providers) {
      const coordinates = await provider();
      if (coordinates) {
        return coordinates;
      }
    }

    return null;
  }

  private async geocodeWithNominatim(address: string): Promise<{ lat: number; lng: number } | null> {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`;
      const response = await this.fetchWithTimeout(url, {
        headers: {
          'Accept-Language': 'hu',
        },
      });

      if (!response.ok) {
        return null;
      }

      const results = (await response.json()) as GeocodeResult[];
      const firstResult = results[0];
      if (!firstResult) {
        return null;
      }

      const lat = Number.parseFloat(firstResult.lat);
      const lng = Number.parseFloat(firstResult.lon);

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return null;
      }

      return { lat, lng };
    } catch (error) {
      console.warn('Nominatim geocoding failed:', error);
      return null;
    }
  }

  private async geocodeWithPhoton(address: string): Promise<{ lat: number; lng: number } | null> {
    try {
      const url = `https://photon.komoot.io/api/?limit=1&q=${encodeURIComponent(address)}`;
      const response = await this.fetchWithTimeout(url, {
        headers: {
          'Accept-Language': 'hu',
        },
      });

      if (!response.ok) {
        return null;
      }

      const data = (await response.json()) as PhotonResponse;
      const coordinates = data.features?.[0]?.geometry?.coordinates;

      if (!coordinates || coordinates.length < 2) {
        return null;
      }

      const [lng, lat] = coordinates;

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return null;
      }

      return { lat, lng };
    } catch (error) {
      console.warn('Photon geocoding failed:', error);
      return null;
    }
  }

  private async fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 6500);

    try {
      return await fetch(url, {
        ...init,
        signal: controller.signal,
      });
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  private getCityFallbackCoordinates(): { lat: number; lng: number } | null {
    const city = this.company?.addressDetails?.city?.trim();
    if (!city) {
      return null;
    }

    const normalizedCity = this.normalizeHungarianText(city);
    return this.cityFallbackCoordinates[normalizedCity] ?? null;
  }

  private normalizeHungarianText(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  private getFullAddress(): string {
    if (this.company?.addressDetails) {
      const details = this.company.addressDetails;
      return `${details.street}, ${details.postalCode} ${details.city}, ${details.country}`;
    }

    return this.company?.address?.trim() ?? '';
  }

  private getMapPopupContent(): string {
    if (!this.company) {
      return '';
    }

    const companyName = this.escapeHtml(this.company.name);

    if (this.company.addressDetails) {
      const details = this.company.addressDetails;
      const line1 = this.escapeHtml(details.street || this.company.address || '');
      const cityBlock = [details.postalCode, details.city].filter(Boolean).join(' ').trim();
      const line2Raw = [cityBlock, details.country].filter(Boolean).join(', ').trim();
      const line2 = this.escapeHtml(line2Raw);

      return `<div class="company-map-popup-content"><p class="company-map-popup-name">${companyName}</p><p class="company-map-popup-address">${line1}</p>${line2 ? `<p class="company-map-popup-address">${line2}</p>` : ''}</div>`;
    }

    const fallbackAddress = this.escapeHtml(this.company.address?.trim() || 'Cím nem elérhető');

    return `<div class="company-map-popup-content"><p class="company-map-popup-name">${companyName}</p><p class="company-map-popup-address">${fallbackAddress}</p></div>`;
  }

  private escapeHtml(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  private destroyMap(): void {
    if (this.map) {
      this.map.remove();
      this.map = undefined;
    }
  }

}
