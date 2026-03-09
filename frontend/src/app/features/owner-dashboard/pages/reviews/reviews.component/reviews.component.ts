import { Component, OnDestroy, OnInit } from '@angular/core';
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
export class ReviewsComponent implements OnInit, OnDestroy {
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
  displayedReviews: OwnerReview[] = [];
  isLoading = false;
  errorMessage = '';
  searchTerm = '';
  private searchDebounceTimer?: ReturnType<typeof setTimeout>;

  constructor(
    private authService: AuthService,
    private ownerReviewsService: OwnerReviewsService
  ) {}

  ngOnInit(): void {
    this.loadOwnerReviews();
  }

  ngOnDestroy(): void {
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }
  }

  get hasActiveFilters(): boolean {
    const hasSearch = this.searchTerm.trim().length > 0;
    const hasRatingFilter = this.selectedRating !== null;
    const hasSortFilter = this.sortOptions.some((option) => option.isSelected);

    return hasSearch || hasRatingFilter || hasSortFilter;
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
      search: this.searchTerm.trim().length > 0 ? this.searchTerm.trim() : null,
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
        this.applyLocalSearchFilter();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Reviews loading error:', error);
        this.errorMessage = `Hiba: ${error?.error?.message || error?.message || 'Nem sikerült betölteni az értékeléseket.'}`;
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

  onSearchChange(value: string): void {
    this.searchTerm = value;
    this.applyLocalSearchFilter();

    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }

    this.searchDebounceTimer = setTimeout(() => {
      this.loadOwnerReviews();
    }, 300);
  }

  clearAllFilters(): void {
    this.searchTerm = '';
    this.selectedRating = null;
    this.ratingHoverIndex = null;
    this.sortOptions.forEach((option) => (option.isSelected = false));

    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }

    this.applyLocalSearchFilter();
    this.loadOwnerReviews();
  }

  private applyLocalSearchFilter(): void {
    const query = this.searchTerm.trim().toLowerCase();

    if (!query) {
      this.displayedReviews = [...this.reviews];
      return;
    }

    this.displayedReviews = this.reviews.filter((review) => {
      const clientName = (review.clientName || '').toLowerCase();
      const clientHungarian = this.getHungarianName(review.clientName).toLowerCase();
      const serviceName = (review.serviceName || '').toLowerCase();

      return (
        clientName.includes(query) ||
        clientHungarian.includes(query) ||
        serviceName.includes(query)
      );
    });
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

  getRatingDisplay(rating: number): string {
    const normalizedRating = Math.max(0, Math.min(5, Math.floor(rating || 0)));
    return '★'.repeat(normalizedRating) + '☆'.repeat(5 - normalizedRating);
  }

  formatDate(dateString: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  getHungarianName(fullName: string): string {
    const trimmed = (fullName || '').trim();
    if (!trimmed) {
      return '';
    }

    const parts = trimmed.split(/\s+/).filter(Boolean);
    if (parts.length <= 1) {
      return trimmed;
    }

    const lastName = parts[parts.length - 1];
    const givenNames = parts.slice(0, -1).join(' ');
    return `${lastName} ${givenNames}`.trim();
  }
}
