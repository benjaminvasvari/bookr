import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SuperadminService } from '../../../../core/services/superadmin.service';

@Component({
  selector: 'app-superadmin-bookings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bookings.component.html',
  styleUrls: ['./bookings.component.css'],
})
export class SuperadminBookingsComponent {
  constructor(private superadminService: SuperadminService) {}

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
}
