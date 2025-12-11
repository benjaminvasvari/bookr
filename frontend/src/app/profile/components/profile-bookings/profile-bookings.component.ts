import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Booking } from '../../../core/models';

type BookingTab = 'upcoming' | 'past';

@Component({
  selector: 'app-profile-bookings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-bookings.component.html',
  styleUrls: ['./profile-bookings.component.css'],
})
export class ProfileBookingsComponent implements OnInit {
  activeTab: BookingTab = 'upcoming';

  upcomingBookings: Booking[] = [];
  pastBookings: Booking[] = [];

  isLoading: boolean = false;
  showCancelModal: boolean = false;
  bookingToCancel: Booking | null = null;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadMockData();
  }

  loadMockData(): void {
    // Mock upcoming bookings
    this.upcomingBookings = [
      {
        id: 1,
        companyId: 1,
        companyName: 'Bella Szépségszalon',
        companyImage: 'https://via.placeholder.com/80x80',
        serviceName: 'Hajvágás + Mosás',
        serviceCategory: 'Fodrászat',
        specialistName: 'Nagy Anna',
        date: '2024-12-15',
        time: '14:00',
        price: 8500,
        status: 'upcoming',
      },
      {
        id: 2,
        companyId: 2,
        companyName: 'Jungle Pécs',
        companyImage: 'https://via.placeholder.com/80x80',
        serviceName: 'Szakáll igazítás',
        serviceCategory: 'Borbély',
        specialistName: 'Kovács Péter',
        date: '2024-12-18',
        time: '10:30',
        price: 4500,
        status: 'upcoming',
      },
      {
        id: 3,
        companyId: 1,
        companyName: 'Bella Szépségszalon',
        companyImage: 'https://via.placeholder.com/80x80',
        serviceName: 'Manikűr + Pedikűr',
        serviceCategory: 'Kozmetika',
        specialistName: 'Tóth Viktória',
        date: '2024-12-20',
        time: '16:00',
        price: 12000,
        status: 'upcoming',
      },
    ];

    // Mock past bookings
    this.pastBookings = [
      {
        id: 4,
        companyId: 2,
        companyName: 'Jungle Pécs',
        companyImage: 'https://via.placeholder.com/80x80',
        serviceName: 'Hajvágás',
        serviceCategory: 'Borbély',
        specialistName: 'Kiss János',
        date: '2024-11-10',
        time: '15:00',
        price: 6000,
        status: 'completed',
        canReview: true,
        reviewId: null,
      },
      {
        id: 5,
        companyId: 1,
        companyName: 'Bella Szépségszalon',
        companyImage: 'https://via.placeholder.com/80x80',
        serviceName: 'Festés',
        serviceCategory: 'Fodrászat',
        specialistName: 'Nagy Anna',
        date: '2024-10-25',
        time: '11:00',
        price: 15000,
        status: 'completed',
        canReview: false,
        reviewId: 123,
      },
      {
        id: 6,
        companyId: 3,
        companyName: 'Relax Massage',
        companyImage: 'https://via.placeholder.com/80x80',
        serviceName: 'Svéd masszázs',
        serviceCategory: 'Masszázs',
        specialistName: 'Szabó Eszter',
        date: '2024-09-15',
        time: '13:30',
        price: 9500,
        status: 'cancelled',
        canReview: false,
      },
    ];
  }

  selectTab(tab: BookingTab): void {
    this.activeTab = tab;
  }

  isActiveTab(tab: BookingTab): boolean {
    return this.activeTab === tab;
  }

  getDisplayBookings(): Booking[] {
    return this.activeTab === 'upcoming' ? this.upcomingBookings : this.pastBookings;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}. ${month}. ${day}.`;
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('hu-HU').format(price) + ' Ft';
  }

  goToCompany(companyId: number): void {
    this.router.navigate(['/sel-industry', companyId]);
  }

  openCancelModal(booking: Booking): void {
    this.bookingToCancel = booking;
    this.showCancelModal = true;
  }

  closeCancelModal(): void {
    this.showCancelModal = false;
    this.bookingToCancel = null;
  }

  confirmCancel(): void {
    if (this.bookingToCancel) {
      // TODO: API call to cancel booking
      console.log('Cancelling booking:', this.bookingToCancel.id);

      // Mock: Remove from upcoming, add to past with cancelled status
      this.upcomingBookings = this.upcomingBookings.filter(
        (b) => b.id !== this.bookingToCancel!.id
      );

      this.bookingToCancel.status = 'cancelled';
      this.pastBookings.unshift(this.bookingToCancel);

      this.closeCancelModal();
    }
  }

  viewDetails(booking: Booking): void {
    // TODO: Navigate to booking details page or open modal
    console.log('View details:', booking);
    alert(
      `Foglalás részletei:\n\nCég: ${booking.companyName}\nSzolgáltatás: ${
        booking.serviceName
      }\nIdőpont: ${this.formatDate(booking.date)} ${booking.time}`
    );
  }

  writeReview(booking: Booking): void {
    // TODO: Navigate to review page or open review modal
    console.log('Write review for booking:', booking.id);
    this.router.navigate(['/sel-industry', booking.companyId], {
      queryParams: { writeReview: true },
    });
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'upcoming':
        return 'badge-upcoming';
      case 'completed':
        return 'badge-completed';
      case 'cancelled':
        return 'badge-cancelled';
      default:
        return '';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'upcoming':
        return 'Foglalt';
      case 'completed':
        return 'Befejezve';
      case 'cancelled':
        return 'Lemondva';
      default:
        return '';
    }
  }
}
