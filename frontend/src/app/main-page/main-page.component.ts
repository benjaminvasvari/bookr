import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Company } from '../core/models';
import { CompaniesService } from '../core/services/companies.service';
import { Title } from '@angular/platform-browser';


interface Review {
  author: string;
  authorImage: string;
  title: string;
  content: string;
  rating: number;
}

@Component({
  selector: 'app-main-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './main-page.component.html',
  styleUrls: ['./main-page.component.css'],
})
export class MainPageComponent implements OnInit, AfterViewInit {
  @ViewChild('reviewsCarousel') reviewsCarousel?: ElementRef<HTMLDivElement>;

  searchQuery: string = '';
  activeReviewIndex = 0;

  // Company lists
  topRecommendations: Company[] = [];
  newServices: Company[] = [];
  featuredServices: Company[] = [];

  // Loading states
  isLoadingTop: boolean = false;
  isLoadingNew: boolean = false;
  isLoadingFeatured: boolean = false;

  // Error states
  errorTop: string = '';
  errorNew: string = '';
  errorFeatured: string = '';

  reviews: Review[] = [
    {
      author: 'Vendég felhasználó',
      authorImage: 'assets/images/favicon.png',
      title: 'Gyors és egyszerű foglalás',
      content:
        'A foglalás folyamata átlátható volt, néhány kattintással sikerült időpontot választani.',
      rating: 5,
    },
    {
      author: 'Vendég felhasználó',
      authorImage: 'assets/images/favicon.png',
      title: 'Letisztult felület',
      content:
        'Minden fontos információ könnyen megtalálható, a folyamat gyors és logikus.',
      rating: 4,
    },
    {
      author: 'Vendég felhasználó',
      authorImage: 'assets/images/favicon.png',
      title: 'Jó keresési élmény',
      content:
        'A kategóriák és az értékelések alapján gyorsan megtaláltam a megfelelő szolgáltatót.',
      rating: 5,
    },
    {
      author: 'Vendég felhasználó',
      authorImage: 'assets/images/favicon.png',
      title: 'Stabil működés',
      content:
        'Többször használtam már, minden alkalommal probléma nélkül ment végig a foglalás.',
      rating: 5,
    },
    {
      author: 'Vendég felhasználó',
      authorImage: 'assets/images/favicon.png',
      title: 'Mobilon is kényelmes',
      content:
        'Telefonról is jól használható, a felület gyors és a gombok jól eltalálhatók.',
      rating: 5,
    },
    {
      author: 'Vendég felhasználó',
      authorImage: 'assets/images/favicon.png',
      title: 'Átlátható adatok',
      content:
        'A szolgáltatások, árak és időpontok egyértelműen jelennek meg, könnyű dönteni.',
      rating: 4,
    },
    {
      author: 'Vendég felhasználó',
      authorImage: 'assets/images/favicon.png',
      title: 'Gyors visszajelzés',
      content:
        'A foglalás után rögtön kaptam visszaigazolást, ami sokat segített a tervezésben.',
      rating: 5,
    },
    {
      author: 'Vendég felhasználó',
      authorImage: 'assets/images/favicon.png',
      title: 'Korrekt felhasználói élmény',
      content:
        'Összességében megbízható platform, egyszerű kezeléssel és gyors működéssel.',
      rating: 4,
    },
  ];

  constructor(private router: Router, private companiesService: CompaniesService, private title: Title) {}

  ngOnInit(): void {
    this.loadTopRecommendations();
    this.loadNewServices();
    this.loadFeaturedServices();
        this.title.setTitle(`Bookr`);

  }

  ngAfterViewInit(): void {
    this.onReviewsScroll();
  }

  loadTopRecommendations(): void {
    this.isLoadingTop = true;
    this.errorTop = '';

    this.companiesService.getTopRecommendations(4).subscribe({
      next: (data: Company[]) => {
        this.topRecommendations = data;
        this.isLoadingTop = false;
        console.log('New services loaded:', data);

      },
      error: (error) => {
        this.errorTop = 'Nem sikerült betölteni az ajánlatokat. Kérjük próbálja újra később.';
        this.isLoadingTop = false;
      },
    });
  }

  loadNewServices(): void {
    this.isLoadingNew = true;
    this.errorNew = '';

    this.companiesService.getNewCompanies(4).subscribe({
      next: (data: Company[]) => {
        this.newServices = data;
        this.isLoadingNew = false;
        console.log('New services loaded:', data);
      },
      error: (error) => {
        console.error('Error loading new services:', error);
        this.errorNew =
          'Nem sikerült betölteni az új szolgáltatásokat. Kérjük próbálja újra később.';
        this.isLoadingNew = false;
      },
    });
  }

  loadFeaturedServices(): void {
    this.isLoadingFeatured = true;
    this.errorFeatured = '';

    this.companiesService.getFeaturedCompanies(4).subscribe({
      next: (data: Company[]) => {
        this.featuredServices = data;
        this.isLoadingFeatured = false;
        console.log('Featured services loaded:', data);
      },
      error: (error) => {
        console.error('Error loading featured services:', error);
        this.errorFeatured =
          'Nem sikerült betölteni a felkapott szolgáltatásokat. Kérjük próbálja újra később.';
        this.isLoadingFeatured = false;
      },
    });
  }

  retryLoadTop(): void {
    this.loadTopRecommendations();
  }

  retryLoadNew(): void {
    this.loadNewServices();
  }

  retryLoadFeatured(): void {
    this.loadFeaturedServices();
  }

  onSearch(): void {
    if (this.searchQuery.trim()) {
      console.log('Searching for:', this.searchQuery);
      // TODO: Navigate to search results page
      // this.router.navigate(['/search'], { queryParams: { q: this.searchQuery } });
    }
  }

  goToService(serviceId: number): void {
    this.router.navigate(['/sel-industry', serviceId]);
  }

  getRatingStars(rating: number): { filled: boolean }[] {
    const full = Math.round(rating);
    return Array(5).fill(0).map((_, i) => ({ filled: i < full }));
  }

  learnMore(): void {
    this.router.navigate(['/learnmore']);
  }

  scrollReviews(direction: 'left' | 'right'): void {
    const carouselElement = this.reviewsCarousel?.nativeElement;
    if (!carouselElement) {
      return;
    }

    // Egy review card width-e + gap
    const cardWidth = (carouselElement.clientWidth - 32) / 3 + 16;
    const scrollAmount = cardWidth;

    carouselElement.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });

    // Next index frissítése iránya alapján
    if (direction === 'right' && this.activeReviewIndex < this.reviews.length - 1) {
      this.activeReviewIndex++;
    } else if (direction === 'left' && this.activeReviewIndex > 0) {
      this.activeReviewIndex--;
    }
  }

  scrollToReview(index: number): void {
    const carouselElement = this.reviewsCarousel?.nativeElement;
    if (!carouselElement) {
      return;
    }

    const reviewElement = carouselElement.children.item(index) as HTMLElement | null;
    if (!reviewElement) {
      return;
    }

    carouselElement.scrollTo({
      left: reviewElement.offsetLeft,
      behavior: 'smooth',
    });
    this.activeReviewIndex = index;
  }

  onReviewsScroll(): void {
    const carouselElement = this.reviewsCarousel?.nativeElement;
    if (!carouselElement || carouselElement.children.length === 0) {
      return;
    }

    const cardWidth = (carouselElement.children.item(0) as HTMLElement).offsetWidth + 16;
    const nextIndex = Math.round(carouselElement.scrollLeft / Math.max(cardWidth, 1));
    this.activeReviewIndex = Math.max(0, Math.min(this.reviews.length - 1, nextIndex));
  }
}
