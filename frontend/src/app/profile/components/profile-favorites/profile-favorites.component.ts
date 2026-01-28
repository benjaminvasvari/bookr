import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Company } from '../../../core/models';

@Component({
  selector: 'app-profile-favorites',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-favorites.component.html',
  styleUrls: ['./profile-favorites.component.css'],
})
export class ProfileFavoritesComponent implements OnInit {
  favorites: Company[] = [];
  isLoading: boolean = false;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadMockData();
  }

  loadMockData(): void {
    // Mock kedvenc cégek
    this.favorites = [
      {
        id: 1,
        name: 'Bella Szépségszalon',
        imageUrl: 'https://via.placeholder.com/300x200',
        rating: 4.8,
        reviewCount: 142,
        address: 'Pécs, Király utca 12.',
        category: 'Fodrászat & Kozmetika',
        description: 'Professzionális hajápolás és szépségápolás egy helyen.',
      },
      {
        id: 2,
        name: 'Jungle Pécs',
        imageUrl: 'https://via.placeholder.com/300x200',
        rating: 4.9,
        reviewCount: 98,
        address: 'Pécs, Jókai utca 5.',
        category: 'Borbély',
        description: 'Modern férfi borbély szakértő fodrászokkal.',
      },
      {
        id: 3,
        name: 'Relax Massage',
        imageUrl: 'https://via.placeholder.com/300x200',
        rating: 4.7,
        reviewCount: 67,
        address: 'Pécs, Rákóczi út 33.',
        category: 'Masszázs',
        description: 'Professzionális masszázs szolgáltatások relaxációhoz.',
      },
    ];
  }

  /**
   * Csillagok generálása az értékeléshez
   */
  getRatingStars(rating: number): number[] {
    return Array(Math.floor(rating)).fill(0);
  }

  /**
   * Ár formázás
   */
  formatPrice(price: number): string {
    return new Intl.NumberFormat('hu-HU').format(price) + ' Ft-tól';
  }

  /**
   * Navigálás a cég oldalára
   */
  goToCompany(companyId: number): void {
    this.router.navigate(['/sel-industry', companyId]);
  }

  /**
   * Kedvenc eltávolítása
   */
  removeFavorite(companyId: number, event: Event): void {
    event.stopPropagation(); // Ne menjen át a cég oldalára amikor törlünk

    // TODO: Később API hívás lesz itt - DELETE /api/favorites/{companyId}
    console.log('Eltávolítás kedvencekből:', companyId);

    // Mock: Eltávolítjuk a listából
    this.favorites = this.favorites.filter((company) => company.id !== companyId);
  }

  /**
   * Foglalás indítása
   */
  bookCompany(companyId: number, event: Event): void {
    event.stopPropagation(); // Ne menjen át a cég oldalára
    this.router.navigate(['/appointment', companyId, 'services']);
  }
}