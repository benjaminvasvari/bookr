import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../../core/services/auth.service';
import { OwnerClientsService } from '../../../../../core/services/owner-clients.service';
import { OwnerClientApiItem } from '../../../../../core/models';

interface ClientListItem {
  id: number;
  name: string;
  email: string;
  bookings: number;
}

@Component({
  selector: 'app-clients.component',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './clients.component.html',
  styleUrl: './clients.component.css',
})
export class ClientsComponent {
  clients: ClientListItem[] = [];
  pageSize = 4;
  currentPage = 1;
  totalClients = 0;
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
    this.loadClients(this.currentPage - 1);
  }

  goNextPage(): void {
    if (!this.canGoNext) {
      return;
    }
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
          const items = payload?.result ?? [];

          this.clients = items.map((item) => this.mapClientItem(item));
          this.totalClients = payload?.totalClients ?? 0;
          this.currentPage = page;
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
    const id = item.id ?? item.clientId ?? item.userId ?? 0;
    const firstName = item.firstName?.trim() ?? '';
    const lastName = item.lastName?.trim() ?? '';
    const fullName = `${lastName} ${firstName}`.trim();
    const fallbackName = item.name?.trim() || '';

    return {
      id,
      name: fullName || fallbackName || 'Névtelen ügyfél',
      email: item.email?.trim() || '-',
      bookings: item.totalBookings ?? item.bookingCount ?? item.appointmentsCount ?? 0,
    };
  }
}
