import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface CartItem {
  id: number;
  name: string;
  duration: number;
  price: number;
  categoryId: number;
}

export interface SelectedSpecialist {
  id: number;
  name: string;
  imageUrl: string;
  specialization?: string;
}

export interface SelectedAppointment {
  date: Date;
  time: string;
}

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private cartItems = new BehaviorSubject<CartItem[]>([]);
  private selectedSpecialist = new BehaviorSubject<SelectedSpecialist | null>(null);
  private selectedAppointment = new BehaviorSubject<SelectedAppointment | null>(null);

  cart$: Observable<CartItem[]> = this.cartItems.asObservable();
  specialist$: Observable<SelectedSpecialist | null> = this.selectedSpecialist.asObservable();
  appointment$: Observable<SelectedAppointment | null> = this.selectedAppointment.asObservable();

  constructor() {}

  // Kosár metódusok
  getCart(): CartItem[] {
    return this.cartItems.value;
  }

  addToCart(item: CartItem): void {
    const currentCart = this.cartItems.value;
    const exists = currentCart.some((i) => i.id === item.id);

    if (!exists) {
      this.cartItems.next([...currentCart, item]);
    }
  }

  removeFromCart(itemId: number): void {
    const currentCart = this.cartItems.value;
    this.cartItems.next(currentCart.filter((item) => item.id !== itemId));
  }

  isInCart(itemId: number): boolean {
    return this.cartItems.value.some((item) => item.id === itemId);
  }

  getTotal(): number {
    return this.cartItems.value.reduce((total, item) => total + item.price, 0);
  }

  clearCart(): void {
    this.cartSubject.next([]);
    this.specialistSubject.next(null);
    this.appointmentSubject.next(null);
  }

  // Szakember metódusok
  setSpecialist(specialist: SelectedSpecialist | null): void {
    this.selectedSpecialist.next(specialist);
  }

  getSpecialist(): SelectedSpecialist | null {
    return this.selectedSpecialist.value;
  }

  // Időpont metódusok
  setAppointment(appointment: SelectedAppointment | null): void {
    this.selectedAppointment.next(appointment);
  }

  getAppointment(): SelectedAppointment | null {
    return this.selectedAppointment.value;
  }

  // Teljes foglalás törlése
  clearBooking(): void {
    this.clearCart();
    this.selectedSpecialist.next(null);
    this.selectedAppointment.next(null);
  }
}
