import { Component, OnInit } from '@angular/core';
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
export class MainPageComponent implements OnInit {
  searchQuery: string = '';

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
      author: 'Kovács Klára',
      authorImage: 'assets/images/user1.jpg',
      title: 'Legjobb oldal amit használhatok',
      content:
        'Nagyon jó az oldal, egyszerű és gyors foglalásokat csinálni. Az oldal átlátható és könnyen kezelhető. Mindenkinek ajánlom, aki szeretne foglalni.',
      rating: 5,
    },
    {
      author: 'Nagy Gábor',
      authorImage: 'assets/images/user2.jpg',
      title: 'Könnyű használhatóság és felfedezhetőség',
      content:
        'Szép dizájnnal rendelkezik az oldal, könnyen találtam meg amit kerestem. Gyors foglalási folyamat és segítőkész ügyfélszolgálat.',
      rating: 5,
    },
    {
      author: 'Tóth Bence',
      authorImage: 'assets/images/user3.jpg',
      title: 'Gyors és egyszerű keresés rendszere',
      content:
        'Jól áttekinthető, minden fogalomhoz könnyű eljutni, nagyon szeretem. Nagyon tetszik a design és a felhasználói élmény.',
      rating: 5,
    },
    {
      author: 'Szabó Márton',
      authorImage: 'assets/images/user4.jpg',
      title: 'Saját cégem promóciója használattal időmegtakarítás',
      content:
        'A bookr-t megszoktam az időpontfoglalásra, egyszerű az online rendszer, ami segíti a vállalkozásomat. Könnyen kezelhető és hatékony.',
      rating: 5,
    },
  ];

  constructor(private router: Router, private companiesService: CompaniesService, private title: Title) {}

  ngOnInit(): void {
    this.loadTopRecommendations();
    this.loadNewServices();
    this.loadFeaturedServices();
        this.title.setTitle(`Bookr`);

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

  getRatingStars(rating: number): number[] {
    return Array(Math.floor(rating)).fill(0);
  }

  learnMore(): void {
    console.log('Learn more clicked');
    // TODO: Navigate to business info page
  }
}
