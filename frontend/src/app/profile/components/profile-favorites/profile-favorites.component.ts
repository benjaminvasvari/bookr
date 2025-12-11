import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Favorite } from '../../../core/models';

@Component({
  selector: 'app-profile-favorites',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-favorites.component.html',
  styleUrls: ['./profile-favorites.component.css']
})
export class ProfileFavoritesComponent implements OnInit {
  favorites: Favorite[] = [];
  isLoading: boolean = false;
  showRemoveModal: boolean = false;
  favoriteToRemove: Favorite | null = null;

  constructor(public router: Router) {}

  ngOnInit(): void {
    this.loadMockData();
  }

  loadMockData(): void {
    // Mock favorites data
    this.favorites = [
      {
        id: 1,
        companyId: 1,
        name: 'Bella Szépségszalon',
        rating: 4.8,
        reviewCount: 156,
        address: 'Váci utca 15., 1052 Budapest',
        imageUrl: 'https://via.placeholder.com/400x300',
        serviceCategories: ['Fodrászat', 'Kozmetika', 'Manikűr'],
        addedAt: '2024-11-20'
      },
      {
        id: 2,
        companyId: 2,
        name: 'Jungle Pécs',
        rating: 4.7,
        reviewCount: 89,
        address: 'Koller utca 7, 7626 Pécs',
        imageUrl: 'https://via.placeholder.com/400x300',
        serviceCategories: ['Borbély', 'Szakállápol��s'],
        addedAt: '2024-11-15'
      },
      {
        id: 3,
        companyId: 3,
        name: 'Relax Massage',
        rating: 4.9,
        reviewCount: 203,
        address: 'Árpád út 42., 9021 Győr',
        imageUrl: 'https://via.placeholder.com/400x300',
        serviceCategories: ['Masszázs', 'Wellness'],
        addedAt: '2024-10-28'
      },
      {
        id: 4,
        companyId: 4,
        name: 'NailArt Studio',
        rating: 4.6,
        reviewCount: 124,
        address: 'Dohány utca 22., 1074 Budapest',
        imageUrl: 'https://via.placeholder.com/400x300',
        serviceCategories: ['Manikűr', 'Pedikűr', 'Műköröm'],
        addedAt: '2024-10-10'
      },
      {
        id: 5,
        companyId: 5,
        name: 'BarberShop Budapest',
        rating: 4.5,
        reviewCount: 67,
        address: 'Wesselényi utca 18., 1077 Budapest',
        imageUrl: 'https://via.placeholder.com/400x300',
        serviceCategories: ['Borbély', 'Hajvágás'],
        addedAt: '2024-09-22'
      },
      {
        id: 6,
        companyId: 6,
        name: 'Beauty Salon Pécs',
        rating: 4.7,
        reviewCount: 178,
        address: 'Király utca 5., 7621 Pécs',
        imageUrl: 'https://via.placeholder.com/400x300',
        serviceCategories: ['Kozmetika', 'Hajfestés', 'Smink'],
        addedAt: '2024-09-05'
      }
    ];
  }

  getRatingStars(rating: number): string[] {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return [
      ...Array(fullStars).fill('full'),
      ...(hasHalfStar ? ['half'] : []),
      ...Array(emptyStars).fill('empty')
    ];
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}. ${month}. ${day}.`;
  }

  goToCompany(companyId: number): void {
    this.router.navigate(['/sel-industry', companyId]);
  }

  openRemoveModal(favorite: Favorite): void {
    this.favoriteToRemove = favorite;
    this.showRemoveModal = true;
  }

  closeRemoveModal(): void {
    this.showRemoveModal = false;
    this.favoriteToRemove = null;
  }

  confirmRemove(): void {
    if (this.favoriteToRemove) {
      // TODO: API call to remove favorite
      console.log('Removing favorite:', this.favoriteToRemove.id);
      
      // Mock: Remove from list
      this.favorites = this.favorites.filter(
        f => f.id !== this.favoriteToRemove!.id
      );
      
      this.closeRemoveModal();
    }
  }

  bookNow(favorite: Favorite): void {
    // Navigate to company page
    this.router.navigate(['/sel-industry', favorite.companyId]);
  }
}