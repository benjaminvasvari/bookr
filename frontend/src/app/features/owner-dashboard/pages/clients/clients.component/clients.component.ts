import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../../core/services/auth.service';
import { OwnerClientsService } from '../../../../../core/services/owner-clients.service';
import { OwnerClientApiItem } from '../../../../../core/models';

interface ClientListItem {
  id: number;
  name: string;
  email: string;
  bookings: number;
  phone: string;
  lastVisit: string;
  totalSpending: number;
}

@Component({
  selector: 'app-clients.component',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './clients.component.html',
  styleUrl: './clients.component.css',
})
export class ClientsComponent {
  clients: ClientListItem[] = [];
  pageSize = 16;
  currentPage = 1;
  totalClients = 0;
  pageDirection: 'next' | 'prev' | 'none' = 'none';
  selectedClient: ClientListItem | null = null;
  isLoading = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private ownerClientsService: OwnerClientsService
  ) {
    this.loadClients(1);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalClients / this.pageSize));
  }

  get pagedClients() {
    return this.clients;
  }

  get canGoPrev(): boolean {
    return this.currentPage > 1 && !this.isLoading;
  }

  get canGoNext(): boolean {
    return this.currentPage < this.totalPages && !this.isLoading;
  }

  goPrevPage(): void {
    if (!this.canGoPrev) {
      return;
    }
    this.pageDirection = 'prev';
    this.loadClients(this.currentPage - 1);
  }

  goNextPage(): void {
    if (!this.canGoNext) {
      return;
    }
    this.pageDirection = 'next';
    this.loadClients(this.currentPage + 1);
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map((part) => part.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  openClientPopup(client: ClientListItem): void {
    this.selectedClient = client;
  }

  closeClientPopup(): void {
    this.selectedClient = null;
  }

  formatSpending(amount: number): string {
    return new Intl.NumberFormat('hu-HU').format(amount);
  }

  formatPhone(value: string): string {
    if (!value || value === '-') return '-';
    const digits = value.replace(/\D/g, '');
    // Hungarian: +36 XX XXX XXXX (12 digits with country code) or 06 XX XXX XXXX
    if (digits.startsWith('36') && digits.length === 11) {
      return `+36 ${digits.slice(2, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
    }
    if (digits.startsWith('06') && digits.length === 11) {
      return `+36 ${digits.slice(2, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
    }
    if (digits.length === 9) {
      return `+36 ${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
    }
    return value;
  }

  formatLastVisit(value: string): string {
    if (!value || value === '-') return '-';
    const normalized = value.trim().replace(' ', 'T');
    const date = new Date(normalized);
    if (Number.isNaN(date.getTime())) return value;
    const dateStr = date.toLocaleDateString('hu-HU', { year: 'numeric', month: '2-digit', day: '2-digit' });
    const timeStr = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    return `${dateStr} ${timeStr}`;
  }

  private loadClients(page: number): void {
    const currentUser = this.authService.getCurrentUser();

    if (!currentUser?.companyId) {
      this.errorMessage = 'A cégazonosító nem elérhető a lekéréshez.';
      this.clients = [];
      this.totalClients = 0;
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.ownerClientsService
      .getClientsByCompany(currentUser.companyId, page, this.pageSize)
      .subscribe({
        next: (response) => {
          const payload = response?.result;
          const items = payload?.clients ?? payload?.result ?? [];

          this.clients = items.map((item) => this.mapClientItem(item));
          this.totalClients = payload?.totalClients ?? items.length;
          this.currentPage = page;
          this.selectedClient = null;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Clients loading error:', error);
          this.errorMessage = 'Nem sikerült betölteni az ügyfeleket.';
          this.clients = [];
          this.totalClients = 0;
          this.isLoading = false;
        },
      });
  }

  private mapClientItem(item: OwnerClientApiItem): ClientListItem {
    const payload = item as Record<string, unknown>;
    const id = this.getNumberValue(
      payload,
      ['id', 'clientId', 'userId', 'Id', 'ClientId', 'UserId'],
      0
    );

    const firstName = this.getStringValue(payload, ['firstName', 'FirstName', 'first_name']);
    const lastName = this.getStringValue(payload, ['lastName', 'LastName', 'last_name']);
    const fullName = `${lastName} ${firstName}`.trim();
    const fallbackName = this.getStringValue(payload, ['name', 'Name', 'fullName']);
    const bookings = this.getBookingsCount(payload);
    const email = this.getStringValue(payload, ['email', 'Email']) || '-';
    const phone = this.getStringValue(payload, ['phone', 'Phone']) || '-';
    const lastVisit = this.getStringValue(payload, ['lastVisit', 'LastVisit']) || '-';
    const totalSpending = this.getNumberValue(payload, ['totalSpending', 'TotalSpending'], 0);

    return {
      id,
      name: fullName || fallbackName || 'Névtelen ügyfél',
      email,
      bookings,
      phone,
      lastVisit,
      totalSpending,
    };
  }

  private getBookingsCount(payload: Record<string, unknown>): number {
    const numericCount = this.getNumberValue(payload, [
      'totalBookings',
      'totalAppointments',
      'bookingCount',
      'appointmentsCount',
      'TotalBookings',
      'TotalAppointments',
      'BookingCount',
      'AppointmentsCount',
    ]);

    if (numericCount > 0) {
      return numericCount;
    }

    const appointments = payload['appointments'] ?? payload['Appointments'];
    if (Array.isArray(appointments)) {
      return appointments.length;
    }

    return 0;
  }

  private getStringValue(payload: Record<string, unknown>, keys: string[]): string {
    for (const key of keys) {
      const value = payload[key];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }

    return '';
  }

  private getNumberValue(payload: Record<string, unknown>, keys: string[], fallback = 0): number {
    for (const key of keys) {
      const value = payload[key];
      if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
      }
      if (typeof value === 'string') {
        const parsed = Number(value);
        if (!Number.isNaN(parsed)) {
          return parsed;
        }
      }
    }

    return fallback;
  }
}
