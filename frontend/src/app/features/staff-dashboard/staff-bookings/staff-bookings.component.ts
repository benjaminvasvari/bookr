import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MatNativeDateModule, NativeDateAdapter } from '@angular/material/core';
import { MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';

interface StaffBookingItem {
  id: number;
  date: string;
  time: string;
  serviceName: string;
  clientName: string;
  status: 'confirmed' | 'pending' | 'cancelled';
}

const STAFF_BOOKINGS_DATE_FORMATS = {
  parse: {
    dateInput: 'staffBookingsDateInput',
  },
  display: {
    dateInput: 'staffBookingsDateInput',
    monthYearLabel: { year: 'numeric', month: 'short' },
    dateA11yLabel: { year: 'numeric', month: 'long', day: 'numeric' },
    monthYearA11yLabel: { year: 'numeric', month: 'long' },
  },
};

class StaffBookingsDateAdapter extends NativeDateAdapter {
  override parse(value: unknown): Date | null {
    if (typeof value === 'string') {
      const normalized = value.trim().replace(/\s+/g, '');

      if (!normalized) {
        return null;
      }

      const isoLikeMatch = normalized.match(/^(\d{4})[.\/-](\d{1,2})[.\/-](\d{1,2})$/);
      if (isoLikeMatch) {
        return this.createValidatedDate(
          Number(isoLikeMatch[1]),
          Number(isoLikeMatch[2]),
          Number(isoLikeMatch[3])
        );
      }
    }

    return super.parse(value);
  }

  override format(date: Date, displayFormat: unknown): string {
    if (displayFormat === 'staffBookingsDateInput') {
      if (!this.isValid(date)) {
        return '';
      }

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}.${month}.${day}`;
    }

    return super.format(date, displayFormat as object);
  }

  private createValidatedDate(year: number, month: number, day: number): Date | null {
    if (
      !Number.isInteger(year) ||
      !Number.isInteger(month) ||
      !Number.isInteger(day) ||
      month < 1 ||
      month > 12 ||
      day < 1 ||
      day > 31
    ) {
      return null;
    }

    const parsedDate = new Date(year, month - 1, day);

    if (
      parsedDate.getFullYear() !== year ||
      parsedDate.getMonth() !== month - 1 ||
      parsedDate.getDate() !== day
    ) {
      return null;
    }

    return parsedDate;
  }
}

type StaffBookingStatus = StaffBookingItem['status'];

interface StaffBookingEditDraft {
  date: string;
  time: string;
  serviceName: string;
  clientName: string;
  status: StaffBookingStatus;
}

@Component({
  selector: 'app-staff-bookings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  providers: [
    { provide: DateAdapter, useClass: StaffBookingsDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_LOCALE, useValue: 'hu-HU' },
    { provide: MAT_DATE_FORMATS, useValue: STAFF_BOOKINGS_DATE_FORMATS },
  ],
  templateUrl: './staff-bookings.component.html',
  styleUrl: './staff-bookings.component.css',
})
export class StaffBookingsComponent {
  selectedBooking: StaffBookingItem | null = null;
  isEditing = false;
  editDraft: StaffBookingEditDraft | null = null;
  editDateModel: Date | null = null;

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
    this.isEditing = false;
    this.editDraft = null;
    this.editDateModel = null;
  }

  startEditingSelectedBooking(): void {
    if (!this.selectedBooking) {
      return;
    }

    this.isEditing = true;
    this.editDraft = {
      date: this.selectedBooking.date,
      time: this.selectedBooking.time,
      serviceName: this.selectedBooking.serviceName,
      clientName: this.selectedBooking.clientName,
      status: this.selectedBooking.status,
    };
    this.editDateModel = this.parseIsoDate(this.selectedBooking.date);
  }

  cancelEditingSelectedBooking(): void {
    this.isEditing = false;
    this.editDraft = null;
    this.editDateModel = null;
  }

  saveSelectedBookingChanges(): void {
    if (!this.selectedBooking || !this.editDraft || !this.canSaveEdit) {
      return;
    }

    const bookingIndex = this.bookings.findIndex(
      (booking) => booking.id === this.selectedBooking?.id
    );

    if (bookingIndex < 0) {
      return;
    }

    const updatedBooking: StaffBookingItem = {
      ...this.selectedBooking,
      ...this.editDraft,
      serviceName: this.editDraft.serviceName.trim(),
      clientName: this.editDraft.clientName.trim(),
    };

    this.bookings = this.bookings.map((booking, index) =>
      index === bookingIndex ? updatedBooking : booking
    );
    this.selectedBooking = updatedBooking;
    this.isEditing = false;
    this.editDraft = null;
    this.editDateModel = null;
  }

  deleteSelectedBooking(): void {
    if (!this.selectedBooking) {
      return;
    }

    const shouldDelete = window.confirm('Biztosan torolni szeretned ezt az idopontot?');

    if (!shouldDelete) {
      return;
    }

    const selectedBookingId = this.selectedBooking.id;
    this.bookings = this.bookings.filter((booking) => booking.id !== selectedBookingId);
    this.clearSelectedBooking();
  }

  get canSaveEdit(): boolean {
    if (!this.editDraft) {
      return false;
    }

    return Boolean(
      this.editDraft.date &&
      this.editDraft.time &&
      this.editDraft.serviceName.trim() &&
      this.editDraft.clientName.trim()
    );
  }

  onEditDatePickerChange(value: Date | null): void {
    if (!this.editDraft) {
      return;
    }

    this.editDateModel = value;

    if (!value) {
      return;
    }

    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    this.editDraft.date = `${year}-${month}-${day}`;
  }

  private parseIsoDate(value: string): Date | null {
    if (!value) {
      return null;
    }

    const parsed = new Date(`${value}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
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
