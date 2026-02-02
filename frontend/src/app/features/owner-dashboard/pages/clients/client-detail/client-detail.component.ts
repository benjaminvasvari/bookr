import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

type ClientProfile = {
  id: number;
  name: string;
  email: string;
  phone: string;
  lastVisit: string;
  totalBookings: number;
  totalSpent: string;
  notes: string;
};

const MOCK_CLIENTS: ClientProfile[] = [
  {
    id: 1,
    name: 'Kovács Anna',
    email: 'anna.kovacs@email.com',
    phone: '+36 30 456 7821',
    lastVisit: '2025. szept. 8.',
    totalBookings: 15,
    totalSpent: '98 500 Ft',
    notes: 'Kedveli a délutáni időpontokat, hajfestés + vágás.'
  },
  {
    id: 2,
    name: 'Nagy Péter',
    email: 'peter.nagy@email.com',
    phone: '+36 20 512 9934',
    lastVisit: '2025. szept. 6.',
    totalBookings: 9,
    totalSpent: '62 000 Ft',
    notes: 'Rendszeres szakáll igazítás, rövid időpontok.'
  },
  {
    id: 3,
    name: 'Tóth László',
    email: 'toth.laszlo@email.com',
    phone: '+36 70 874 2265',
    lastVisit: '2025. szept. 5.',
    totalBookings: 12,
    totalSpent: '81 300 Ft',
    notes: 'Gyors vágás, fix 2 hetente.'
  },
  {
    id: 4,
    name: 'Szabó Petra',
    email: 'szabo.petra@email.com',
    phone: '+36 30 112 3344',
    lastVisit: '2025. szept. 3.',
    totalBookings: 7,
    totalSpent: '45 000 Ft',
    notes: 'Kedvenc szolgáltatás: balayage.'
  }
];

@Component({
  selector: 'app-client-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './client-detail.component.html',
  styleUrl: './client-detail.component.css',
})
export class ClientDetailComponent implements OnInit {
  client?: ClientProfile;

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('id'));
      this.client = MOCK_CLIENTS.find((item) => item.id === id);
    });
  }
}
