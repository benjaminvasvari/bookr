import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Service {
  name: string;
  rating: number;
  reviewCount: number;
  address: string;
  imageUrl: string;
}

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
  styleUrls: ['./main-page.component.css']
})
export class MainPageComponent implements OnInit {
  searchQuery: string = '';

  topRecommendations: Service[] = [
    {
      name: 'Forost',
      rating: 5.0,
      reviewCount: 21,
      address: 'Pécs, Király utca 26-28',
      imageUrl: 'assets/images/first.png'
    },
    {
      name: 'Tonsur',
      rating: 5.0,
      reviewCount: 23,
      address: 'Pécs, Király utca 26-28',
      imageUrl: 'assets/images/second.png'
    },
    {
      name: 'Hijeny',
      rating: 5.0,
      reviewCount: 17,
      address: 'Pécs, Király utca 26-28',
      imageUrl: 'assets/images/third.png'
    },
    {
      name: 'Fukره',
      rating: 5.0,
      reviewCount: 19,
      address: 'Pécs, Király utca 26-28',
      imageUrl: 'assets/images/fourth.png'
    }
  ];

  newServices: Service[] = [
    {
      name: 'Fukره',
      rating: 5.0,
      reviewCount: 19,
      address: 'Pécs, Király utca 26-28',
      imageUrl: 'assets/images/fukre.jpg'
    },
    {
      name: 'Hijeny',
      rating: 5.0,
      reviewCount: 17,
      address: 'Pécs, Király utca 26-28',
      imageUrl: 'assets/images/hijeny.jpg'
    },
    {
      name: 'Forost',
      rating: 5.0,
      reviewCount: 21,
      address: 'Pécs, Király utca 26-28',
      imageUrl: 'assets/images/forost.jpg'
    },
    {
      name: 'Tonsur',
      rating: 5.0,
      reviewCount: 23,
      address: 'Pécs, Király utca 26-28',
      imageUrl: 'assets/images/tonsur.jpg'
    }
  ];

  featuredServices: Service[] = [
    {
      name: 'Tonsur',
      rating: 5.0,
      reviewCount: 23,
      address: 'Pécs, Király utca 26-28',
      imageUrl: 'assets/images/tonsur.jpg'
    },
    {
      name: 'Forost',
      rating: 5.0,
      reviewCount: 21,
      address: 'Pécs, Király utca 26-28',
      imageUrl: 'assets/images/forost.jpg'
    },
    {
      name: 'Fukره',
      rating: 5.0,
      reviewCount: 19,
      address: 'Pécs, Király utca 26-28',
      imageUrl: 'assets/images/fukre.jpg'
    },
    {
      name: 'Hijeny',
      rating: 5.0,
      reviewCount: 17,
      address: 'Pécs, Király utca 26-28',
      imageUrl: 'assets/images/hijeny.jpg'
    }
  ];

  reviews: Review[] = [
    {
      author: 'Kovács Klára',
      authorImage: 'assets/images/user1.jpg',
      title: 'Legjobb oldal amit használhatok',
      content: 'Nagyon jó az oldal, egyszerű és gyors foglalásokat csinálni. Az oldal átlátható és könnyen kezelhető. Mindenkinek ajánlom, aki szeretne foglalni.',
      rating: 5
    },
    {
      author: 'Nagy Gábor',
      authorImage: 'assets/images/user2.jpg',
      title: 'Könnyű használhatóság és felfedezhetőség',
      content: 'Szép dizájnnal rendelkezik az oldal, könnyen találtam meg amit kerestem. Gyors foglalási folyamat és segítőkész ügyfélszolgálat.',
      rating: 5
    },
    {
      author: 'Tóth Bence',
      authorImage: 'assets/images/user3.jpg',
      title: 'Gyors és egyszerű keresés rendszere',
      content: 'Jól áttekinthető, minden fogalomhoz könnyű eljutni, nagyon szeretem. Nagyon tetszik a design és a felhasználói élmény.',
      rating: 5
    },
    {
      author: 'Szabó Márton',
      authorImage: 'assets/images/user4.jpg',
      title: 'Saját cégem promóciója használattal időmegtakarítás',
      content: 'A bookr-t megszoktam az időpontfoglalásra, egyszerű az online rendszer, ami segíti a vállalkozásomat. Könnyen kezelhető és hatékony.',
      rating: 5
    }
  ];

  ngOnInit(): void {
    // Initialize component
  }

  onSearch(): void {
    console.log('Searching for:', this.searchQuery);
    // Implement search logic
  }

  getRatingStars(rating: number): number[] {
    return Array(Math.floor(rating)).fill(0);
  }

  learnMore(): void {
    console.log('Learn more clicked');
    // Navigate to business info page
  }
}