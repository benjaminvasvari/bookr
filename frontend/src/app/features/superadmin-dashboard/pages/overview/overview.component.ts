import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

type LogFilter = 'all' | 'error' | 'auth';

interface CommandKpi {
  value: number;
  label: string;
  note: string;
  route: string;
  accent: 'emerald' | 'amber' | 'red' | 'slate';
}

interface RecentBooking {
  client: string;
  service: string;
  company: string;
  time: string;
  status: 'Megerősített' | 'Új' | 'Vizsgálandó';
}

interface AuditLogItem {
  title: string;
  detail: string;
  time: string;
  type: 'error' | 'auth' | 'info';
}

interface ActionItem {
  count: number;
  label: string;
  description: string;
  route: string;
}

@Component({
  selector: 'app-superadmin-overview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.css'],
})
export class SuperadminOverviewComponent {
  selectedLogFilter: LogFilter = 'all';

  kpis: CommandKpi[] = [
    {
      value: 24,
      label: 'Aktív cég',
      note: '3 cég figyelmeztetett állapotban van.',
      route: 'companies',
      accent: 'emerald',
    },
    {
      value: 138,
      label: 'Mai foglalás',
      note: '12 lemondás és 3 vitatott eset ma.',
      route: 'bookings',
      accent: 'amber',
    },
    {
      value: 7,
      label: 'Kritikus log',
      note: 'Auth és API hibák azonnali ellenőrzésre.',
      route: 'logs',
      accent: 'red',
    },
    {
      value: 12,
      label: 'Függőben',
      note: 'Staff és tulajdonos verifikáció várakozik.',
      route: 'staff',
      accent: 'slate',
    },
  ];

  recentBookings: RecentBooking[] = [
    {
      client: 'Molnár Zsuzsa',
      service: 'Hajvágás',
      company: 'Glamour Studio',
      time: '09:30',
      status: 'Megerősített',
    },
    {
      client: 'Fekete Dávid',
      service: 'Körmözés',
      company: 'NailBar Pécs',
      time: '10:10',
      status: 'Új',
    },
    {
      client: 'Simon Lilla',
      service: 'Masszázs',
      company: 'Relax Zone Győr',
      time: '11:45',
      status: 'Megerősített',
    },
    {
      client: 'Kerekes Ádám',
      service: 'Szakálligazítás',
      company: 'Barber Hub',
      time: '13:20',
      status: 'Vizsgálandó',
    },
    {
      client: 'Pálfi Dóra',
      service: 'Arckezelés',
      company: 'Pure Skin Szalon',
      time: '15:00',
      status: 'Új',
    },
    {
      client: 'Lakatos Márk',
      service: 'Manikűr',
      company: 'Color Bar',
      time: '16:40',
      status: 'Megerősített',
    },
  ];

  logFilters: Array<{ value: LogFilter; label: string }> = [
    { value: 'all', label: 'Összes' },
    { value: 'error', label: 'Hiba' },
    { value: 'auth', label: 'Auth' },
  ];

  auditLogs: AuditLogItem[] = [
    {
      title: 'Auth hiba - sikertelen tulajdonosi belépés',
      detail: 'Három egymást követő sikertelen belépés a Relax Zone Győr fióknál.',
      time: '8 perce',
      type: 'error',
    },
    {
      title: 'Jogkör módosítás manuális jóváhagyással',
      detail: 'Egy staff felhasználó szerepköre megváltozott céges audit után.',
      time: '21 perce',
      type: 'info',
    },
    {
      title: 'Auth ellenőrzés - e-mail hitelesítés függőben',
      detail: 'Négy tulajdonosi profil még nem fejezte be a hitelesítést.',
      time: '39 perce',
      type: 'auth',
    },
    {
      title: 'API hiba - foglalás mentése megszakadt',
      detail: 'Két foglalás újrapróbálást igényel a délutáni idősávban.',
      time: '1 órája',
      type: 'error',
    },
    {
      title: 'Auth figyelmeztetés - jelszócsere kényszerítve',
      detail: 'Öt staff fiók kapott kötelező jelszófrissítést.',
      time: '2 órája',
      type: 'auth',
    },
  ];

  actionItems: ActionItem[] = [
    {
      count: 3,
      label: 'felfüggesztett cég',
      description: 'Azonnali céges felülvizsgálat szükséges.',
      route: 'companies',
    },
    {
      count: 5,
      label: 'függőben lévő staff',
      description: 'Jogosultság és cég-hozzárendelés vár jóváhagyásra.',
      route: 'staff',
    },
    {
      count: 4,
      label: 'nem hitelesített tulajdonos',
      description: 'Auth státusz ellenőrzése és emlékeztető küldése ajánlott.',
      route: 'owners',
    },
    {
      count: 2,
      label: 'lejáró előfizetés',
      description: 'Kapcsolatfelvétel vagy csomagváltás szükséges.',
      route: 'companies',
    },
  ];

  constructor(private router: Router) {}

  get filteredAuditLogs(): AuditLogItem[] {
    if (this.selectedLogFilter === 'all') {
      return this.auditLogs;
    }

    return this.auditLogs.filter((log) => log.type === this.selectedLogFilter);
  }

  setLogFilter(filter: LogFilter): void {
    this.selectedLogFilter = filter;
  }

  navigateTo(page: string): void {
    void this.router.navigate(['/superadmin', page]);
  }
}
