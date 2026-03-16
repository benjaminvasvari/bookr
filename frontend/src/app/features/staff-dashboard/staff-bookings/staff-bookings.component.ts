import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface StaffBookingItem {
  id: number;
  date: string;
  time: string;
  serviceName: string;
  clientName: string;
  status: 'confirmed' | 'pending' | 'cancelled';
}

type StaffBookingStatus = StaffBookingItem['status'];

@Component({
  selector: 'app-staff-bookings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './staff-bookings.component.html',
  styleUrl: './staff-bookings.component.css',
})
export class StaffBookingsComponent {
  private readonly today = new Date();
  private readonly todayIso = this.toIsoDate(this.today);
  private readonly tomorrowIso = this.toIsoDate(this.addDays(this.today, 1));

  bookings: StaffBookingItem[] = [
    {
      id: 1,
      date: this.todayIso,
      time: '09:30',
      serviceName: 'Hajvágás',
      clientName: 'Kiss Anna',
      status: 'confirmed',
    },
    {
      id: 2,
      date: this.todayIso,
      time: '11:00',
      serviceName: 'Szakáll igazítás',
      clientName: 'Nagy Bálint',
      status: 'pending',
    },
    {
      id: 3,
      date: this.todayIso,
      time: '14:00',
      serviceName: 'Festés',
      clientName: 'Kovács Lili',
      status: 'cancelled',
    },
    {
      id: 4,
      date: this.tomorrowIso,
      time: '10:00',
      serviceName: 'Hajmosás',
      clientName: 'Tóth Emese',
      status: 'confirmed',
    },
  ];

  get sortedBookings(): StaffBookingItem[] {
    return this.bookings
      .slice()
      .sort((a, b) => this.toTimestamp(a) - this.toTimestamp(b));
  }

  get todayBookings(): StaffBookingItem[] {
    return this.sortedBookings.filter((booking) => booking.date === this.todayIso);
  }

  get hasTodayBookings(): boolean {
    return this.todayBookings.length > 0;
  }

  get todayLabel(): string {
    return this.formatLongDate(this.todayIso);
  }

  get totalBookings(): number {
    return this.todayBookings.length;
  }

  get confirmedBookingsCount(): number {
    return this.getBookingCountByStatus('confirmed');
  }

  get pendingBookingsCount(): number {
    return this.getBookingCountByStatus('pending');
  }

  get cancelledBookingsCount(): number {
    return this.getBookingCountByStatus('cancelled');
  }

  getStatusLabel(status: StaffBookingItem['status']): string {
    if (status === 'confirmed') {
      return 'Visszaigazolt';
    }

    if (status === 'pending') {
      return 'Folyamatban';
    }

    return 'Lemondva';
  }

  formatDate(dateValue: string): string {
    const date = this.parseDateValue(dateValue);

    if (!date) {
      return dateValue;
    }

    return date.toLocaleDateString('hu-HU', {
      month: 'short',
      day: 'numeric',
      weekday: 'short',
    });
  }

  formatLongDate(dateValue: string): string {
    const date = this.parseDateValue(dateValue);

    if (!date) {
      return dateValue;
    }

    return date.toLocaleDateString('hu-HU', {
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
  }

  trackByBooking(_: number, booking: StaffBookingItem): number {
    return booking.id;
  }

  private getBookingCountByStatus(status: StaffBookingStatus): number {
    return this.todayBookings.filter((booking) => booking.status === status).length;
  }

  private parseDateValue(value: string): Date | null {
    if (!value) {
      return null;
    }

    const parsed = new Date(`${value}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private addDays(date: Date, days: number): Date {
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + days);
    return nextDate;
  }

  private toIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private toTimestamp(booking: StaffBookingItem): number {
    const isoCandidate = `${booking.date}T${booking.time}:00`;
    const parsed = new Date(isoCandidate);

    if (Number.isNaN(parsed.getTime())) {
      return Number.MAX_SAFE_INTEGER;
    }

    return parsed.getTime();
  }
}
