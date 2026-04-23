import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SuperadminService } from '../../../../core/services/superadmin.service';

type BookingStatus = 'Összes' | 'Függőben' | 'Aktív' | 'Lemondott';
type DateFilter = 'all' | 'today' | 'tomorrow' | 'week';

interface BookingItem {
  id: string;
  clientName: string;
  clientEmail: string;
  service: string;
  durationMinutes: number;
  company: string;
  startsAt: string;
  status: Exclude<BookingStatus, 'Összes'>;
}

interface BookingGroup {
  dateKey: string;
  title: string;
  subtitle: string;
  items: BookingItem[];
}

@Component({
  selector: 'app-superadmin-bookings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bookings.component.html',
  styleUrls: ['./bookings.component.css'],
})
export class SuperadminBookingsComponent {
  isDeleteModalOpen = false;
  selectedBookingId = '';
  searchTerm = '';
  selectedStatus: BookingStatus = 'Összes';
  selectedCompany = 'all';
  selectedDateFilter: DateFilter = 'all';

  readonly todayBookingsCount = 138;
  private readonly referenceDate = new Date('2026-03-18T08:00:00');

  readonly statusFilters: BookingStatus[] = ['Összes', 'Függőben', 'Aktív', 'Lemondott'];
  readonly dateFilters: Array<{ value: DateFilter; label: string }> = [
    { value: 'all', label: 'Összes dátum' },
    { value: 'today', label: 'Ma' },
    { value: 'tomorrow', label: 'Holnap' },
    { value: 'week', label: '7 nap' },
  ];

  bookings: BookingItem[] = [
    {
      id: 'BOOK-100',
      clientName: 'Kovács Éva',
      clientEmail: 'eva.kovacs@email.com',
      service: 'Hajvágás',
      durationMinutes: 45,
      company: 'Glamour Studio',
      startsAt: '2026-03-18T10:00:00',
      status: 'Aktív',
    },
    {
      id: 'BOOK-101',
      clientName: 'Fekete Dávid',
      clientEmail: 'david.fekete@email.com',
      service: 'Körmözés',
      durationMinutes: 60,
      company: 'NailBar Pécs',
      startsAt: '2026-03-18T11:00:00',
      status: 'Függőben',
    },
    {
      id: 'BOOK-102',
      clientName: 'Molnár Péter',
      clientEmail: 'peter.molnar@email.com',
      service: 'Masszázs',
      durationMinutes: 30,
      company: 'Zen Spa',
      startsAt: '2026-03-18T14:30:00',
      status: 'Lemondott',
    },
    {
      id: 'BOOK-103',
      clientName: 'Szabó Luca',
      clientEmail: 'luca.szabo@email.com',
      service: 'Arckezelés',
      durationMinutes: 50,
      company: 'Pure Skin Szalon',
      startsAt: '2026-03-18T16:00:00',
      status: 'Aktív',
    },
    {
      id: 'BOOK-104',
      clientName: 'Takács Nóra',
      clientEmail: 'nora.takacs@email.com',
      service: 'Hajfestés',
      durationMinutes: 90,
      company: 'Glamour Studio',
      startsAt: '2026-03-19T09:00:00',
      status: 'Függőben',
    },
    {
      id: 'BOOK-105',
      clientName: 'Pál Ádám',
      clientEmail: 'adam.pal@email.com',
      service: 'Szakálligazítás',
      durationMinutes: 30,
      company: 'Barber Hub',
      startsAt: '2026-03-19T12:30:00',
      status: 'Aktív',
    },
    {
      id: 'BOOK-106',
      clientName: 'Varga Réka',
      clientEmail: 'reka.varga@email.com',
      service: 'Pedikűr',
      durationMinutes: 60,
      company: 'NailBar Pécs',
      startsAt: '2026-03-20T10:15:00',
      status: 'Aktív',
    },
  ];

  constructor(private superadminService: SuperadminService) {}

  get companyOptions(): string[] {
    return ['all', ...new Set(this.bookings.map((booking) => booking.company))];
  }

  get filteredBookings(): BookingItem[] {
    const normalizedSearch = this.searchTerm.trim().toLocaleLowerCase();

    return this.bookings.filter((booking) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        booking.clientName.toLocaleLowerCase().includes(normalizedSearch) ||
        booking.clientEmail.toLocaleLowerCase().includes(normalizedSearch) ||
        booking.company.toLocaleLowerCase().includes(normalizedSearch) ||
        booking.service.toLocaleLowerCase().includes(normalizedSearch);

      const matchesStatus = this.selectedStatus === 'Összes' || booking.status === this.selectedStatus;
      const matchesCompany = this.selectedCompany === 'all' || booking.company === this.selectedCompany;
      const matchesDate = this.matchesDateFilter(booking);

      return matchesSearch && matchesStatus && matchesCompany && matchesDate;
    });
  }

  get groupedBookings(): BookingGroup[] {
    const groups = new Map<string, BookingItem[]>();

    for (const booking of this.filteredBookings.sort((left, right) => left.startsAt.localeCompare(right.startsAt))) {
      const dateKey = booking.startsAt.slice(0, 10);
      groups.set(dateKey, [...(groups.get(dateKey) ?? []), booking]);
    }

    return [...groups.entries()].map(([dateKey, items]) => ({
      dateKey,
      title: this.getGroupTitle(dateKey),
      subtitle: this.formatDate(dateKey),
      items,
    }));
  }

  setStatusFilter(status: BookingStatus): void {
    this.selectedStatus = status;
  }

  onRefreshBookings(): void {
    this.superadminService.runAction('refresh-bookings');
  }

  getStatusClass(status: Exclude<BookingStatus, 'Összes'>): string {
    if (status === 'Aktív') {
      return 'status-active';
    }

    if (status === 'Lemondott') {
      return 'status-cancelled';
    }

    return 'status-pending';
  }

  getStatusIcon(status: Exclude<BookingStatus, 'Összes'>): string {
    if (status === 'Aktív') {
      return '●';
    }

    if (status === 'Lemondott') {
      return '✕';
    }

    return '○';
  }

  formatTime(startsAt: string): string {
    return new Intl.DateTimeFormat('hu-HU', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date(startsAt));
  }

  private formatDate(dateKey: string): string {
    const date = new Date(`${dateKey}T00:00:00`);
    return new Intl.DateTimeFormat('hu-HU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  }

  private getGroupTitle(dateKey: string): string {
    const reference = new Date(this.referenceDate);
    reference.setHours(0, 0, 0, 0);

    const target = new Date(`${dateKey}T00:00:00`);
    const diffDays = Math.round((target.getTime() - reference.getTime()) / 86400000);

    if (diffDays === 0) {
      return 'MA';
    }

    if (diffDays === 1) {
      return 'HOLNAP';
    }

    return 'KÖVETKEZŐ NAPOK';
  }

  private matchesDateFilter(booking: BookingItem): boolean {
    if (this.selectedDateFilter === 'all') {
      return true;
    }

    const bookingDate = new Date(booking.startsAt);
    const reference = new Date(this.referenceDate);
    reference.setHours(0, 0, 0, 0);
    bookingDate.setHours(0, 0, 0, 0);

    const diffDays = Math.round((bookingDate.getTime() - reference.getTime()) / 86400000);

    if (this.selectedDateFilter === 'today') {
      return diffDays === 0;
    }

    if (this.selectedDateFilter === 'tomorrow') {
      return diffDays === 1;
    }

    return diffDays >= 0 && diffDays <= 6;
  }

  openBookingDeleteModal(bookingId: string): void {
    this.selectedBookingId = bookingId;
    this.isDeleteModalOpen = true;
  }

  closeBookingDeleteModal(): void {
    this.isDeleteModalOpen = false;
    this.selectedBookingId = '';
  }

  onExportBookings(): void {
    this.superadminService.runAction('export-bookings');
  }

  onBulkStatusUpdate(): void {
    this.superadminService.confirmAction(
      'bulk-status-update',
      'Biztosan frissíted a foglalások státuszát?'
    );
  }

  onViewBooking(bookingId: string): void {
    this.superadminService.runAction('view-booking', bookingId);
  }

  onApproveBooking(bookingId: string): void {
    this.superadminService.runAction('approve-booking', bookingId);
  }

  onCancelBooking(bookingId: string): void {
    this.superadminService.confirmAction(
      'cancel-booking',
      'Biztosan törlöd ezt a foglalást?',
      bookingId
    );
  }

  confirmDeleteBooking(): void {
    const bookingId = this.selectedBookingId;
    this.closeBookingDeleteModal();
    if (!bookingId) {
      return;
    }

    this.onCancelBooking(bookingId);
  }
}
