// src/app/appointment-payment/appointment-payment.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  CartService,
  CartItem,
  SelectedSpecialist,
  SelectedAppointment,
} from '../core/services/cart.service';
import { BookingService } from '../core/services/booking.service';
import { CompaniesService } from '../core/services/companies.service';
import { CompanyShort } from '../core/models/company.model';
import { SuccessOverlayComponent } from '../shared/components/success-overlay/success-overlay.component';

@Component({
  selector: 'app-appointment-payment',
  standalone: true,
  imports: [CommonModule, SuccessOverlayComponent],
  templateUrl: './appointment-payment.component.html',
  styleUrl: './appointment-payment.component.css',
})
export class AppointmentPaymentComponent implements OnInit {
  // Adatok
  company: CompanyShort | null = null;
  companyId: number | null = null;
  specialist: SelectedSpecialist | null = null;
  appointment: SelectedAppointment | null = null;
  cart: CartItem[] = [];
  
  // Fizetési mód
  selectedPaymentMethod: string | null = null;

  // Success overlay
  showSuccessOverlay = false;
  isSubmitting = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private cartService: CartService,
    private bookingService: BookingService,
    private companiesService: CompaniesService
  ) {}

  ngOnInit(): void {
    const companyId = Number(this.route.snapshot.paramMap.get('companyId'));
    this.companyId = Number.isNaN(companyId) ? null : companyId;
    this.loadBookingData();
    window.scrollTo(0, 0);
    this.validateBookingData();
  }

  loadBookingData(): void {
    this.cartService.cart$.subscribe(cart => {
      this.cart = cart;
    });

    this.cartService.specialist$.subscribe(specialist => {
      this.specialist = specialist;
    });

    this.cartService.appointment$.subscribe(appointment => {
      this.appointment = appointment;
    });

    if (this.companyId) {
      this.companiesService.getCompanyShort(this.companyId).subscribe({
        next: (company) => {
          this.company = company;
        },
        error: (error) => {
          console.error('Hiba a ceg betoltese soran:', error);
        },
      });
    }
  }

  validateBookingData(): void {
    if (!this.companyId || !this.cart || this.cart.length === 0 || !this.specialist || !this.appointment) {
      console.warn('Hiányos foglalási adatok, visszanavigálás...');
      this.router.navigate(['/']);
    }
  }

  selectPaymentMethod(method: string): void {
    this.selectedPaymentMethod = method;
  }

  confirmBooking(): void {
    if (!this.selectedPaymentMethod || !this.companyId || !this.specialist || !this.appointment) {
      return;
    }

    if (this.isSubmitting) {
      return;
    }

    const startDateTime = this.toDateTime(this.appointment.date, this.appointment.time);
    const endDateTime = new Date(startDateTime.getTime() + this.getTotalDurationMinutes() * 60000);

    const payload = {
      companyId: this.companyId,
      serviceIds: this.cart.map((item) => item.id),
      staffId: this.specialist.id,
      startTime: this.formatDateTime(startDateTime),
      endTime: this.formatDateTime(endDateTime),
      notes: '',
      price: this.getCartTotal(),
    };

    this.isSubmitting = true;
    this.bookingService.createAppointment(payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.showSuccessOverlay = true;
      },
      error: (error) => {
        this.isSubmitting = false;
        console.error('Hiba a foglalas veglegesitese soran:', error);
        alert('Nem sikerult a foglalas veglegesitese. Kerlek probald ujra.');
      },
    });
  }

  onSuccessCompleted(): void {
    // Kosár törlése
    this.cartService.clearBooking();

    // Navigálás a főoldalra (main page)
    this.router.navigate(['/']);
  }

  getCartTotal(): number {
    return this.cartService.getTotal();
  }

  formatAppointmentDateTime(): string {
    if (!this.appointment) {
      return '';
    }

    const date = this.appointment.date;
    const months = ['jan', 'feb', 'már', 'ápr', 'máj', 'jún', 'júl', 'aug', 'szep', 'okt', 'nov', 'dec'];
    
    return `${months[date.getMonth()]}. ${date.getDate()}. ${this.appointment.time}`;
  }

  private toDateTime(date: Date, time: string): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const result = new Date(date);
    result.setHours(hours, minutes, 0, 0);
    return result;
  }

  private formatDateTime(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:00`;
  }

  private getTotalDurationMinutes(): number {
    return this.cart.reduce((sum, item) => sum + this.parseDuration(item.duration), 0);
  }

  private parseDuration(duration: string): number {
    const match = duration.match(/(\d+)\s*perc/);
    return match ? parseInt(match[1], 10) : 60;
  }
}