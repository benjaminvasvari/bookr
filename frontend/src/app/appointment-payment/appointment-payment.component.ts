// src/app/appointment-payment/appointment-payment.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CartService, CartItem, SelectedSpecialist, SelectedAppointment } from '../core/services/cart.service';
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
  company: any = null;
  specialist: SelectedSpecialist | null = null;
  appointment: SelectedAppointment | null = null;
  cart: CartItem[] = [];
  
  // Fizetési mód
  selectedPaymentMethod: string | null = null;

  // Success overlay
  showSuccessOverlay = false;

  constructor(
    private router: Router,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
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

    this.company = {
      id: 1,
      name: 'Szalon neve',
      address: 'Újhelyi u. 86',
      rating: 5.0,
      imageUrl: 'assets/placeholder.jpg',
    };
  }

  validateBookingData(): void {
    if (!this.cart || this.cart.length === 0 || !this.specialist || !this.appointment) {
      console.warn('Hiányos foglalási adatok, visszanavigálás...');
      this.router.navigate(['/']);
    }
  }

  selectPaymentMethod(method: string): void {
    this.selectedPaymentMethod = method;
  }

  confirmBooking(): void {
    if (!this.selectedPaymentMethod) {
      return;
    }

    const booking = {
      company: this.company,
      specialist: this.specialist,
      appointment: this.appointment,
      services: this.cart,
      paymentMethod: this.selectedPaymentMethod,
      totalPrice: this.getCartTotal(),
    };

    console.log('Véglegesített foglalás:', booking);
     console.log('showSuccessOverlay beállítva TRUE-ra'); // Debug

    // TODO: API hívás a foglalás mentéséhez
    // this.bookingService.createBooking(booking).subscribe(...)

    // Success overlay megjelenítése
    this.showSuccessOverlay = true;

     console.log('showSuccessOverlay értéke:', this.showSuccessOverlay); // Debug
  }

  onSuccessCompleted(): void {
    // Kosár törlése
    this.cartService.clearCart();

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
}