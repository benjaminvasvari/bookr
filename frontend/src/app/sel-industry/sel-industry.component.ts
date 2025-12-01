import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

interface Service {
  id: number;
  name: string;
  duration: string;
  price: number;
  currency: string;
}

interface Review {
  id: number;
  userName: string;
  userImage?: string;
  rating: number;
  comment: string;
  date: string;
}

interface CompanyDetails {
  id: number;
  name: string;
  category: string;
  description: string;
  rating: number;
  mainImage: string;
  galleryImages: string[];
  services: Service[];
  reviews: Review[];
  isFavorite: boolean;
}

@Component({
  selector: 'app-sel-industry',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sel-industry.component.html',
  styleUrls: ['./sel-industry.component.css'],
})
export class SelIndustryComponent implements OnInit {
  companyId: number | null = null;
  company: CompanyDetails | null = null;
  selectedTab: 'services' | 'beard' | 'facial' | 'combined' = 'services';

  mockCompanyData: CompanyDetails = {
    id: 1,
    name: 'Future',
    category: 'Cég adatok',
    description:
      'Lorem ipsum dolor sit amet consectetur. Ut id tellus bibendum massa et tristique elit.',
    rating: 4.5,
    mainImage: 'assets/images/barbershop-main.jpg',
    galleryImages: [
      'assets/images/barbershop-1.jpg',
      'assets/images/barbershop-2.jpg',
      'assets/images/barbershop-3.jpg',
    ],
    services: [
      {
        id: 1,
        name: 'Klasszikus hajvágás',
        duration: '45 p - 1 ó',
        price: 4500,
        currency: 'Ft',
      },
      {
        id: 2,
        name: 'Modern fade',
        duration: '45 p - 1 ó',
        price: 6000,
        currency: 'Ft',
      },
      {
        id: 3,
        name: 'Gyermek hajvágás',
        duration: '30 p - 45 p',
        price: 4000,
        currency: 'Ft',
      },
      {
        id: 4,
        name: 'Hajformázás',
        duration: '15 p - 20 p',
        price: 3500,
        currency: 'Ft',
      },
    ],
    reviews: [
      {
        id: 1,
        userName: 'Kovács Anna',
        userImage: '',
        rating: 5,
        comment:
          'Kiváló szolgáltatás, nagyon profik! Mindenképpen ajánlom mindenkinek, aki minőségi munkát keres.',
        date: '2024. 11. 15.',
      },
      {
        id: 2,
        userName: 'Nagy Péter',
        userImage: '',
        rating: 4,
        comment:
          'Nagyon elégedett vagyok az eredménnyel. Precíz munka, barátságos kiszolgálás. Csak ajánlani tudom!',
        date: '2024. 11. 10.',
      },
      {
        id: 3,
        userName: 'Szabó Eszter',
        userImage: '',
        rating: 5,
        comment:
          'Tökéletes élmény volt! A stylist pontosan azt csinálta, amit kértem. Biztos visszamegyek!',
        date: '2024. 11. 05.',
      },
    ],
    isFavorite: false,
  };

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.companyId = +params['id'];
      this.loadCompanyDetails();
    });
    window.scrollTo(0, 0);
  }

  loadCompanyDetails(): void {
    this.company = this.mockCompanyData;
  }

  selectTab(tab: 'services' | 'beard' | 'facial' | 'combined'): void {
    this.selectedTab = tab;
  }

  toggleFavorite(): void {
    if (this.company) {
      this.company.isFavorite = !this.company.isFavorite;
    }
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

  bookService(service: any): void {
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
}
