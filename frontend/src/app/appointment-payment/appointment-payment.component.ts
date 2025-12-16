import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CartService, CartItem, SelectedSpecialist, SelectedAppointment } from '../core/services/cart.service';

@Component({
  selector: 'app-appointment-payment',
  standalone: true,
  imports: [CommonModule],
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

  constructor(
    private router: Router,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    this.loadBookingData();
    
    // Oldal tetejére görgetés
    window.scrollTo(0, 0);
    
    // Ellenőrzés: ha nincs minden adat meg, visszanavigálás
    this.validateBookingData();
  }

  loadBookingData(): void {
    // Kosár betöltése
    this.cartService.cart$.subscribe(cart => {
      this.cart = cart;
    });

    // Szakember betöltése
    this.cartService.specialist$.subscribe(specialist => {
      this.specialist = specialist;
    });

    // Időpont betöltése
    this.cartService.appointment$.subscribe(appointment => {
      this.appointment = appointment;
    });

    // Mock céginformációk (később API-ból jön)
    this.company = {
      id: 1,
      name: 'Szalon neve',
      address: 'Újhelyi u. 86',
      rating: 5.0,
      imageUrl: 'assets/placeholder.jpg',
    };
  }

  validateBookingData(): void {
    // Ha hiányzik valamelyik kötelező adat, visszanavigálás
    if (!this.cart || this.cart.length === 0 || !this.specialist || !this.appointment) {
      console.warn('Hiányos foglalási adatok, visszanavigálás...');
      this.router.navigate(['/']);
    }
  }

  // Fizetési mód kiválasztása
  selectPaymentMethod(method: string): void {
    this.selectedPaymentMethod = method;
  }

  // Foglalás véglegesítése
  confirmBooking(): void {
    if (!this.selectedPaymentMethod) {
      return;
    }

    // Foglalási objektum összeállítása
    const booking = {
      company: this.company,
      specialist: this.specialist,
      appointment: this.appointment,
      services: this.cart,
      paymentMethod: this.selectedPaymentMethod,
      totalPrice: this.getCartTotal(),
    };

    console.log('Véglegesített foglalás:', booking);

    // TODO: API hívás a foglalás mentéséhez
    // this.bookingService.createBooking(booking).subscribe(...)

    // Kosár törlése
    this.cartService.clearCart();

    // Navigálás a főoldalra
    this.router.navigate(['/']);
    
    // TODO: Success üzenet vagy toast notification
    alert('Foglalás sikeresen leadva!');
  }

  // Kosár összesen
  getCartTotal(): number {
    return this.cartService.getTotal();
  }

  // Időpont formázása (pl. "dec. 11. 8:00")
  formatAppointmentDateTime(): string {
    if (!this.appointment) {
      return '';
    }

    const date = this.appointment.date;
    const months = ['jan', 'feb', 'már', 'ápr', 'máj', 'jún', 'júl', 'aug', 'szep', 'okt', 'nov', 'dec'];
    
    return `${months[date.getMonth()]}. ${date.getDate()}. ${this.appointment.time}`;
  }
}