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

@Component({
  selector: 'app-staff-bookings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './staff-bookings.component.html',
  styleUrl: './staff-bookings.component.css',
})
export class StaffBookingsComponent {
  selectedBooking: StaffBookingItem | null = null;

  bookings: StaffBookingItem[] = [
    {
      id: 1,
      date: '2026-02-05',
      time: '09:30',
      serviceName: 'Hajvágás',
      clientName: 'Kiss Anna',
      status: 'confirmed',
    },
    {
      id: 2,
      date: '2026-02-05',
      time: '11:00',
      serviceName: 'Szakáll igazítás',
      clientName: 'Nagy Bálint',
      status: 'pending',
    },
    {
      id: 3,
      date: '2026-02-06',
      time: '14:00',
      serviceName: 'Festés',
      clientName: 'Kovács Lili',
      status: 'cancelled',
    },
  ];

  get sortedBookings(): StaffBookingItem[] {
    return this.bookings
      .slice()
      .sort((a, b) => this.toTimestamp(a) - this.toTimestamp(b));
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
    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return dateValue;
    }

    return date.toLocaleDateString('hu-HU', {
      month: 'short',
      day: 'numeric',
      weekday: 'short',
    });
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map((part) => part.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  trackByBooking(_: number, booking: StaffBookingItem): number {
    return booking.id;
  }

  selectBooking(booking: StaffBookingItem): void {
    this.selectedBooking = booking;
  }

  clearSelectedBooking(): void {
    this.selectedBooking = null;
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
