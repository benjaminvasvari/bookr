import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../../core/services/auth.service';
import { OwnerReviewsService, OwnerReview, OwnerReviewsRequest } from '../../../../../core/services/owner-reviews.service';

@Component({
  selector: 'app-reviews.component',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reviews.component.html',
  styleUrl: './reviews.component.css',
})
export class ReviewsComponent implements OnInit {
  // Star rating filter
  ratingHoverIndex: number | null = null;
  selectedRating: number | null = null;

  // Sort controls
  sortOptions: Array<{ id: string; label: string; isSelected: boolean }> = [
    { id: 'newest', label: 'Legfrissebb', isSelected: false },
    { id: 'highest', label: 'Legmagasabb', isSelected: false },
    { id: 'lowest', label: 'Legalacsonyabb', isSelected: false },
  ];

  // Reviews data
  reviews: OwnerReview[] = [];
  isLoading = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private ownerReviewsService: OwnerReviewsService
  ) {}

  ngOnInit(): void {
    this.loadOwnerReviews();
  }

  loadOwnerReviews(): void {
    const currentUser = this.authService.getCurrentUser();

    console.log('🔍 Current User:', currentUser);

    if (!currentUser?.companyId) {
      this.errorMessage = 'A cégazonosító nem elérhető a lekéréshez.';
      this.reviews = [];
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Határozd meg a tényleges sortBy értéket
    const selectedSort = this.sortOptions.find(o => o.isSelected);
    const sortBy = (selectedSort?.id as 'newest' | 'oldest' | 'highest' | 'lowest') || 'newest';

    const request: OwnerReviewsRequest = {
      search: null,
      ratingFilter: this.selectedRating ? this.selectedRating.toString() : null,
      sortBy: sortBy,
      page: 1,
      pageSize: 50,
    };

    console.log('📤 Sending request:', { companyId: currentUser.companyId, request });

    this.ownerReviewsService.getOwnerReviews(currentUser.companyId, request).subscribe({
      next: (response) => {
        console.log('✅ Reviews loaded:', response);
        this.reviews = response.result?.clients ?? [];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Reviews loading error:', error);
        this.errorMessage = `Hiba: ${error?.error?.message || error?.message || 'Nem sikerült betölteni az értékeléseket.'}`;
        this.reviews = [];
        this.isLoading = false;
      },
    });
  }

  // Star rating filter methods
  onStarHover(index: number): void {
    const hoverRating = index + 1;
    // Ha van kiválasztott csillag, ne lehessen alatta hoverelni
    if (this.selectedRating && hoverRating < this.selectedRating) {
      this.ratingHoverIndex = this.selectedRating;
    } else {
      this.ratingHoverIndex = hoverRating;
    }
  }

  onStarHoverLeave(): void {
    this.ratingHoverIndex = null;
  }

  selectRating(rating: number): void {
    this.selectedRating = this.selectedRating === rating ? null : rating;
    this.loadOwnerReviews();
  }

  getStarFillPercentage(index: number): number {
    const hoverRating = this.ratingHoverIndex || 0;
    const activeRating = this.selectedRating || 0;
    const displayRating = hoverRating > 0 ? hoverRating : activeRating;
    return index < displayRating ? 100 : 0;
  }

  // Sort controls methods
  toggleSort(optionId: string): void {
    const option = this.sortOptions.find(o => o.id === optionId);
    if (option) {
      // Toggle selection or clear if already selected
      if (option.isSelected) {
        option.isSelected = false;
      } else {
        // Clear all others
        this.sortOptions.forEach(o => o.isSelected = false);
        // Select this one
        option.isSelected = true;
      }
      this.loadOwnerReviews();
    }
  }

  getSelectedSortLabel(): string {
    const selected = this.sortOptions.find(o => o.isSelected);
    return selected ? selected.label : 'Egyéb rendezés';
  }

  // Helpers
  getRatingStars(rating: number): number[] {
    return Array(rating).fill(0);
  }

  formatDate(dateString: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric' });
  }
}
