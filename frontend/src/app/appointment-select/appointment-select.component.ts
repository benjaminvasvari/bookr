import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  CartService,
  CartItem,
  SelectedSpecialist,
  SelectedAppointment,
} from '../core/services/cart.service';

interface Specialist {
  id: number;
  name: string;
  imageUrl: string;
  specialization?: string;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

interface DayColumn {
  date: Date;
  dayName: string;
  dayNumber: number;
  isDisabled: boolean;
  isToday: boolean;
}

@Component({
  selector: 'app-appointment-select',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './appointment-select.component.html',
  styleUrl: './appointment-select.component.css',
})
export class AppointmentSelectComponent implements OnInit {
  companyId: number = 0;
  company: any = null;

  // Szakemberek
  specialists: Specialist[] = [];
  selectedSpecialist: Specialist | null = null;

  // Naptár
  currentWeekStart: Date = new Date();
  weekDays: DayColumn[] = [];
  selectedDate: Date | null = null;

  // Időpontok
  timeSlots: TimeSlot[] = [];
  selectedTimeSlot: TimeSlot | null = null;

  // Kosár
  cart: CartItem[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    this.companyId = Number(this.route.snapshot.paramMap.get('companyId'));
    this.loadMockData();
    this.initializeWeek();
    this.loadCart();

    // Oldal tetejére görgetés
    window.scrollTo(0, 0);
  }

  loadMockData(): void {
    // Mock cég adatok
    this.company = {
      id: this.companyId,
      name: 'Szalon neve',
      address: 'újhelyi u. 86',
      rating: 5.0,
      imageUrl: 'assets/placeholder.jpg',
    };

    // Mock szakemberek
    this.specialists = [
      {
        id: 1,
        name: 'Kiss Anna',
        imageUrl: 'https://i.pravatar.cc/150?img=1',
        specialization: 'Fodrász',
      },
      {
        id: 2,
        name: 'Nagy Péter',
        imageUrl: 'https://i.pravatar.cc/150?img=2',
        specialization: 'Fodrász',
      },
      {
        id: 3,
        name: 'Szabó Eszter',
        imageUrl: 'https://i.pravatar.cc/150?img=3',
        specialization: 'Kozmetikus',
      },
      {
        id: 4,
        name: 'Tóth László',
        imageUrl: 'https://i.pravatar.cc/150?img=4',
        specialization: 'Masszőr',
      },
    ];
  }

  loadCart(): void {
    this.cartService.cart$.subscribe((cart) => {
      this.cart = cart;
    });
  }

  // Hét inicializálása (mai naptól kezdve)
  initializeWeek(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Mai nap a hét eleje
    this.currentWeekStart = new Date(today);
    this.generateWeekDays();
  }

  // 7 nap generálása
  generateWeekDays(): void {
    this.weekDays = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const date = new Date(this.currentWeekStart);
      date.setDate(this.currentWeekStart.getDate() + i);

      const dayOfWeek = date.getDay();
      const isDisabled = dayOfWeek === 0 || dayOfWeek === 3 || dayOfWeek === 6; // Vasárnap, Szerda, Szombat
      const isPast = date < today;

      this.weekDays.push({
        date: date,
        dayName: this.getDayName(dayOfWeek),
        dayNumber: date.getDate(),
        isDisabled: isDisabled || isPast,
        isToday: date.getTime() === today.getTime(),
      });
    }
  }

  getDayName(dayOfWeek: number): string {
    const days = ['Vas', 'Hét', 'Kedd', 'Szer', 'Csüt', 'Pén', 'Szo'];
    return days[dayOfWeek];
  }

  //Előző hét
  previousWeek(): void {
    this.currentWeekStart.setDate(this.currentWeekStart.getDate() - 7);
    this.generateWeekDays();
    this.selectedDate = null;
    this.selectedTimeSlot = null;
  }

  // Következő hét
  nextWeek(): void {
    this.currentWeekStart.setDate(this.currentWeekStart.getDate() + 7);
    this.generateWeekDays();
    this.selectedDate = null;
    this.selectedTimeSlot = null;
  }

  // Szakember kiválasztása
  selectSpecialist(specialist: Specialist): void {
    if (this.selectedSpecialist?.id === specialist.id) {
      // Ha már ki van választva, akkor toggle off
      this.selectedSpecialist = null;
      this.selectedDate = null;
      this.selectedTimeSlot = null;
      this.cartService.setSpecialist(null);
    } else {
      this.selectedSpecialist = specialist;
      this.selectedDate = null;
      this.selectedTimeSlot = null;

      this.cartService.setSpecialist({
        id: specialist.id,
        name: specialist.name,
        imageUrl: specialist.imageUrl,
      });
    }
  }

  // Nap kiválasztása
  selectDay(day: DayColumn): void {
    if (day.isDisabled || !this.selectedSpecialist) {
      return;
    }

    this.selectedDate = day.date;
    this.selectedTimeSlot = null;
    this.generateTimeSlots();
  }

  // Időpontok generálása (8:00-16:15, 45 perces slotok)
  generateTimeSlots(): void {
    this.timeSlots = [];
    const times = [
      '8:00',
      '8:45',
      '9:30',
      '10:15',
      '11:00',
      '11:45',
      '12:30',
      '13:15',
      '14:00',
      '14:45',
      '15:30',
      '16:15',
    ];

    times.forEach((time) => {
      this.timeSlots.push({
        time: time,
        available: true, // TODO: később API-ból jön a foglaltság
      });
    });
  }

  // Időpont kiválasztása
  selectTimeSlot(slot: TimeSlot): void {
    if (!slot.available) {
      return;
    }

    this.selectedTimeSlot = slot;

    if (this.selectedDate) {
      this.cartService.setAppointment({
        date: this.selectedDate,
        time: slot.time,
      });
    }
  }

  // Kosár műveletek
  removeFromCart(itemId: number): void {
    this.cartService.removeFromCart(itemId);
  }

  getCartTotal(): number {
    return this.cartService.getTotal();
  }

  

  // Folytatás (későbbi lépés)
  continue(): void {
    // TODO: Navigálás a következő lépésre
    this.router.navigate(['/appointment-payment']);
    console.log('Foglalás:', {
      company: this.company,
      services: this.cart,
      specialist: this.selectedSpecialist,
      date: this.selectedDate,
      time: this.selectedTimeSlot?.time,
    });

    alert('Következő lépés (összesítő/megerősítés) még nincs kész!');
  }

  // Formázó függvények
  formatDate(date: Date): string {
    const months = [
      'jan',
      'feb',
      'már',
      'ápr',
      'máj',
      'jún',
      'júl',
      'aug',
      'szep',
      'okt',
      'nov',
      'dec',
    ];
    return `${months[date.getMonth()]}. ${date.getDate()}.`;
  }
}
