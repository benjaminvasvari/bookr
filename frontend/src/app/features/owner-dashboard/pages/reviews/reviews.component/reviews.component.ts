import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reviews.component',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reviews.component.html',
  styleUrl: './reviews.component.css',
})
export class ReviewsComponent {
  selectedRating: number | null = null;
  hoveredRating: number | null = null;
  selectedSort: 'latest' | 'highest' | 'lowest' | null = null;
  stars = [1, 2, 3, 4, 5];

  setHoveredRating(rating: number | null): void {
    this.hoveredRating = rating;
  }

  selectRating(rating: number): void {
    this.selectedRating = this.selectedRating === rating ? null : rating;
    // Itt szűrheted a reviews listát a selectedRating alapján
  }

  selectSort(sort: 'latest' | 'highest' | 'lowest'): void {
    this.selectedSort = this.selectedSort === sort ? null : sort;
    // Itt rendezheted a reviews listát a selectedSort alapján
  }

  isStarFilled(star: number): boolean {
    const activeRating = this.hoveredRating ?? this.selectedRating;
    return activeRating !== null && star <= activeRating;
  }
}
