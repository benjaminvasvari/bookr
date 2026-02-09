// profile-favorites.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FavoritesService, Favorite } from '../../../core/services/favorites.service';

@Component({
  selector: 'app-profile-favorites',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-favorites.component.html',
  styleUrls: ['./profile-favorites.component.css'],
})
export class ProfileFavoritesComponent implements OnInit {
  favorites: Favorite[] = [];
  isLoading: boolean = false;
  error: string | null = null;

  constructor(
    private router: Router,
    private favoritesService: FavoritesService
  ) {}

  ngOnInit(): void {
    this.loadFavorites();
  }

  /**
   * Kedvencek betöltése a backendről
   */
  loadFavorites(): void {
    this.isLoading = true;
    this.error = null;

    this.favoritesService.getUserFavorites().subscribe({
      next: (response) => {
        this.favorites = response.result;
        this.isLoading = false;
        console.log('Kedvencek betöltve:', response);
      },
      error: (err) => {
        console.error('Hiba a kedvencek betöltése során:', err);
        this.error = 'Nem sikerült betölteni a kedvenceket.';
        this.isLoading = false;
      }
    });
  }

  /**
   * Csillagok generálása az értékeléshez
   */
  getRatingStars(rating: number): number[] {
    return Array(Math.floor(rating)).fill(0);
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
  removeFavorite(favoriteId: number, event: Event): void {
    event.stopPropagation();

    if (confirm('Biztosan törölni szeretnéd ezt a kedvencet?')) {
      this.favoritesService.removeFavorite(favoriteId).subscribe({
        next: () => {
          console.log('Kedvenc törölve:', favoriteId);
          // Eltávolítjuk a listából
          this.favorites = this.favorites.filter(fav => fav.favoriteId !== favoriteId);
        },
        error: (err) => {
          console.error('Hiba a kedvenc törlése során:', err);
          alert('Nem sikerült törölni a kedvencet.');
        }
      });
    }
  }

  /**
   * Foglalás indítása
   */
  bookCompany(companyId: number, event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/appointment', companyId, 'services']);
  }

  /**
   * Dátum formázása
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}