import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-superadmin-overview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.css'],
})
export class SuperadminOverviewComponent {
  companySummary = {
    active: 24,
    suspended: 3,
    expiringSoon: 2,
    recent: [
      { name: 'Glamour Studio Kft.', status: 'Aktív', plan: 'Pro' },
      { name: 'NailBar Pécs', status: 'Új', plan: 'Alap' },
      { name: 'Relax Zone Győr', status: 'Felfüggesztett', plan: 'Pro' },
    ],
  };

  staffSummary = {
    total: 87,
    pending: 5,
    withoutCompany: 3,
    recent: [
      { name: 'Kovács Éva', company: 'Glamour Studio', role: 'Fodrász' },
      { name: 'Tóth Balázs', company: 'NailBar Pécs', role: 'Körmös' },
      { name: 'Varga Réka', company: '—', role: 'Masszőr' },
    ],
  };

  ownerSummary = {
    total: 24,
    unverified: 4,
    multiCompany: 3,
    recent: [
      { name: 'Kiss Péter', companies: 2, verified: true },
      { name: 'Nagy Anna', companies: 1, verified: false },
      { name: 'Horváth Gábor', companies: 3, verified: true },
    ],
  };

  bookingSummary = {
    todayTotal: 138,
    cancelled: 12,
    disputed: 3,
    upcoming: [
      {
        client: 'Molnár Zsuzsa',
        service: 'Hajvágás',
        time: '10:30',
        company: 'Glamour Studio',
      },
      {
        client: 'Fekete Dávid',
        service: 'Körmözés',
        time: '11:00',
        company: 'NailBar Pécs',
      },
      {
        client: 'Simon Lilla',
        service: 'Masszázs',
        time: '13:15',
        company: 'Relax Zone',
      },
    ],
  };

  logSummary = {
    total24h: 312,
    errors: 7,
    warnings: 18,
    recent: [
      {
        message: 'Auth hiba – sikertelen bejelentkezés',
        time: '10 perce',
        type: 'error',
      },
      { message: 'Szerepkör módosítás', time: '1 órája', type: 'warning' },
      { message: 'Új foglalás létrehozva', time: '2 órája', type: 'info' },
    ],
  };

  onNavigate(page: string): void {
    console.log('Navigálás:', page);
  }
}
