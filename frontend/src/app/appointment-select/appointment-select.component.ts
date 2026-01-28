import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// ========================================
// SERVICE IMPORTOK (feltöltött fájlok)
// ========================================
import {
  CartService,
  CartItem,
  SelectedSpecialist,
  SelectedAppointment,
} from '../core/services/cart.service';

import { CompaniesService } from '../core/services/companies.service';
import { BookingService } from '../core/services/booking.service';
import { StaffService } from '../core/services/staff.service';

// ========================================
// MODEL IMPORTOK (feltöltött fájlok)
// ========================================
import { CompanyShort } from '../core/models/company.model';
import { StaffMember } from '../core/models/staff.model';
import { UnavailableDate, WorkingHours, OccupiedSlot } from '../core/models/booking.model';

// ========================================
// BEÉPÍTETT KOMPONENS-SPECIFIKUS INTERFÉSZEK
// ========================================

/**
 * Heti naptár nap reprezentációja
 */
interface WeekDay {
  date: Date;
  dayName: string; // "HÉT", "KEDD", stb.
  dayNumber: number; // 1-31
  isToday: boolean;
  isDisabled: boolean;
}

/**
 * Időpont slot (15 perces intervallumok)
 */
interface TimeSlot {
  time: string; // "HH:mm" formátum (pl. "09:00")
  available: boolean; // Szabad-e
  duration: number; // Teljes szolgáltatás időtartama percekben
}

// ========================================
// COMPONENT
// ========================================

@Component({
  selector: 'app-appointment-select',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './appointment-select.component.html',
  styleUrl: './appointment-select.component.css',
})
export class AppointmentSelectComponent implements OnInit, OnDestroy {
  // ========================================
  // CLEANUP
  // ========================================
  private destroy$ = new Subject<void>();

  // ========================================
  // STATE PROPERTIES
  // ========================================
  companyId!: number;
  cart: CartItem[] = [];
  company: CompanyShort | null = null;
  specialists: StaffMember[] = [];
  selectedSpecialist: StaffMember | null = null;

  // Naptár
  weekDays: WeekDay[] = [];
  selectedDate: Date | null = null;
  currentWeekStart: Date = new Date();
  currentMonthYear: string = '';
  canGoBack: boolean = false;
  canGoForward: boolean = false;

  // Időpontok
  timeSlots: TimeSlot[] = [];
  selectedTimeSlot: TimeSlot | null = null;

  // Backend adatok
  unavailableDates: Set<string> = new Set(); // YYYY-MM-DD formátum
  advanceDays: number = 30; // Hány nappal előre lehet foglalni (backend-től jön)

  // Loading states
  loadingSpecialists: boolean = false;
  loadingTimeSlots: boolean = false;
  loadingCompany: boolean = false;

  // Error handling
  errorMessage: string = '';

  // ========================================
  // KONSTANSOK
  // ========================================
  private static readonly MONTHS_SHORT = [
    'jan.',
    'feb.',
    'már.',
    'ápr.',
    'máj.',
    'jún.',
    'júl.',
    'aug.',
    'szept.',
    'okt.',
    'nov.',
    'dec.',
  ];

  private static readonly MONTHS_FULL = [
    'január',
    'február',
    'március',
    'április',
    'május',
    'június',
    'július',
    'augusztus',
    'szeptember',
    'október',
    'november',
    'december',
  ];

  private static readonly DAYS = ['VAS', 'HÉT', 'KEDD', 'SZER', 'CSÜT', 'PÉN', 'SZO'];

  // Időpont generálás beállítások
  private static readonly SLOT_INTERVAL = 15; // 15 perces intervallumok

  // ========================================
  // CONSTRUCTOR
  // ========================================
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cartService: CartService,
    private companiesService: CompaniesService,
    private bookingService: BookingService,
    private staffService: StaffService
  ) {}

  // ========================================
  // LIFECYCLE HOOKS
  // ========================================
  ngOnInit(): void {
    // Route params validálás
    const id = this.route.snapshot.paramMap.get('companyId');
    if (!id || isNaN(Number(id))) {
      console.error('Invalid company ID');
      this.router.navigate(['/']);
      return;
    }

    this.companyId = Number(id);

    // Adatbetöltés
    this.loadCompanyData();
    this.loadCart();
    this.initializeWeek();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ========================================
  // DATA LOADING
  // ========================================

  /**
   * Cég rövid adatainak betöltése
   */
  private loadCompanyData(): void {
    this.loadingCompany = true;
    this.errorMessage = '';

    this.companiesService
      .getCompanyShort(this.companyId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.company = data;
          this.loadingCompany = false;
        },
        error: (error) => {
          console.error('Error loading company:', error);
          this.errorMessage = 'Hiba történt a cég adatainak betöltésekor';
          this.loadingCompany = false;
        },
      });
  }

  /**
   * Kosár betöltése és szakemberek lekérése
   */
  private loadCart(): void {
    this.cartService.cart$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (items) => {
        this.cart = items;
        if (items.length > 0) {
          this.loadSpecialists();
        } else {
          // Ha üres a kosár, reset
          this.specialists = [];
          this.selectedSpecialist = null;
          this.unavailableDates.clear();
        }
      },
      error: (error) => {
        console.error('Error loading cart:', error);
        this.errorMessage = 'Hiba történt a kosár betöltésekor';
      },
    });
  }

  /**
   * Szakemberek betöltése a kosárban lévő szolgáltatások alapján
   *
   * TODO: Implementáld a StaffService-t és az alábbi endpoint-ot:
   * GET /api/staff/by-services?companyId={id}&serviceIds={id1},{id2}
   *
   * Response format: StaffByServicesResponse
   */
  private loadSpecialists(): void {
    this.loadingSpecialists = true;
    this.errorMessage = '';

    const serviceIds = this.cart.map((item) => item.id);

    this.staffService
      .getStaffByServices(this.companyId, serviceIds)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.specialists = response.result || [];
          this.loadingSpecialists = false;

          if (this.specialists.length === 1) {
            this.selectSpecialist(this.specialists[0]);
          }
        },
        error: (error) => {
          console.error('Error loading specialists:', error);
          this.errorMessage = 'Hiba történt a szakemberek betöltésekor';
          this.loadingSpecialists = false;
        },
      });
  }

  /**
   * Tiltott dátumok betöltése (unavailable dates)
   */
  private loadUnavailableDates(staffId: number): void {
    this.bookingService
      .getUnavailableDates(this.companyId, staffId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dates: UnavailableDate[]) => {
          // Backend-től kapott tiltott dátumok
          this.unavailableDates = new Set(dates.map((d) => d.date));

          // Ha már van kiválasztott dátum és az tiltott, törölni kell
          if (this.selectedDate && this.isDateUnavailable(this.selectedDate)) {
            this.selectedDate = null;
            this.selectedTimeSlot = null;
            this.timeSlots = [];
          }

          // Hét napok újragenerálása (disabled flag frissítése)
          this.generateWeekDays();
        },
        error: (error) => {
          console.error('Error loading unavailable dates:', error);
          // Nem blokkoljuk a folyamatot, csak logoljuk
        },
      });
  }

  /**
   * Időpontok betöltése egy adott napra (occupied slots + working hours)
   */
  /**
   * Időpontok betöltése egy adott napra (occupied slots + working hours)
   */
  private loadTimeSlots(date: Date, staffId: number): void {
    this.loadingTimeSlots = true;
    this.errorMessage = '';

    const dateString = this.formatDateForAPI(date);

    this.bookingService
      .getOccupiedSlots(this.companyId, staffId, dateString)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          const { workingHours, occupiedSlots } = data;

          // ⚠️ JAVÍTÁS: workingHours TÖMB! Vegyük az első elemet
          if (!workingHours || workingHours.length === 0 || !workingHours[0].isAvailable) {
            this.timeSlots = [];
            this.loadingTimeSlots = false;
            return;
          }

          // Időpontok generálása az első working hours alapján
          this.timeSlots = this.generateTimeSlots(workingHours[0], occupiedSlots);
          this.loadingTimeSlots = false;
        },
        error: (error) => {
          console.error('Error loading time slots:', error);
          this.errorMessage = 'Hiba történt az időpontok betöltésekor';
          this.loadingTimeSlots = false;
          this.timeSlots = [];
        },
      });
  }

  // ========================================
  // TIME SLOT GENERATION
  // ========================================

  /**
   * Időpontok generálása working hours + occupied slots alapján
   */
  private generateTimeSlots(workingHours: WorkingHours, occupiedSlots: OccupiedSlot[]): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const { startTime, endTime } = workingHours;

    // Kezdő és befejező idő parse
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    // Teljes szolgáltatás időtartam (kosár összes eleme)
    const totalDuration = this.cart.reduce((sum, item) => {
      const duration = this.parseDuration(item.duration);
      return sum + duration;
    }, 0);

    // 15 perces lépésekkel generálás
    for (
      let currentMinutes = startMinutes;
      currentMinutes + totalDuration <= endMinutes;
      currentMinutes += AppointmentSelectComponent.SLOT_INTERVAL
    ) {
      const slotTime = this.minutesToTime(currentMinutes);
      const slotEndMinutes = currentMinutes + totalDuration;

      // Ellenőrizzük, hogy ez az időablak szabad-e
      const isAvailable = !this.isSlotOccupied(currentMinutes, slotEndMinutes, occupiedSlots);

      slots.push({
        time: slotTime,
        available: isAvailable,
        duration: totalDuration,
      });
    }

    return slots;
  }

  /**
   * Ellenőrzi, hogy egy adott időablak foglalt-e
   */
  private isSlotOccupied(
    startMinutes: number,
    endMinutes: number,
    occupiedSlots: OccupiedSlot[]
  ): boolean {
    return occupiedSlots.some((slot) => {
      const [occupiedStartHour, occupiedStartMin] = slot.startTime.split(':').map(Number);
      const [occupiedEndHour, occupiedEndMin] = slot.endTime.split(':').map(Number);

      const occupiedStart = occupiedStartHour * 60 + occupiedStartMin;
      const occupiedEnd = occupiedEndHour * 60 + occupiedEndMin;

      // Átfedés ellenőrzés
      return startMinutes < occupiedEnd && endMinutes > occupiedStart;
    });
  }

  /**
   * Duration string parse (pl. "60 perc" → 60)
   */
  private parseDuration(duration: string): number {
    const match = duration.match(/(\d+)\s*perc/);
    return match ? parseInt(match[1], 10) : 60; // Default 60 perc
  }

  /**
   * Percek konvertálása HH:mm formátumra
   */
  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  // ========================================
  // SPECIALIST SELECTION
  // ========================================

  selectSpecialist(specialist: StaffMember): void {
    this.selectedSpecialist = specialist;
    this.selectedDate = null;
    this.selectedTimeSlot = null;
    this.timeSlots = [];

    // CartService-be is mentjük (összegzés oldalhoz kell)
    const selectedSpec: SelectedSpecialist = {
      id: specialist.id,
      name: specialist.displayName,
      imageUrl: specialist.imageUrl || 'assets/placeholder-user.jpg',
      specialization: specialist.specialties,
    };

    this.cartService.setSpecialist(selectedSpec);

    // Tiltott dátumok betöltése
    this.loadUnavailableDates(specialist.id);
  }

  // ========================================
  // CALENDAR LOGIC
  // ========================================

  private initializeWeek(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    this.currentWeekStart = this.getWeekStart(today);
    this.generateWeekDays();
    this.updateMonthYear();
    this.checkCanGoBack();
    this.checkCanGoForward();
  }

  private getWeekStart(date: Date): Date {
    const day = date.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(date);
    monday.setDate(date.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  }

  private generateWeekDays(): void {
    const days: WeekDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + this.advanceDays);

    for (let i = 0; i < 7; i++) {
      const date = new Date(this.currentWeekStart);
      date.setDate(this.currentWeekStart.getDate() + i);

      const isPast = date < today;
      const isBeyondAdvance = date > maxDate;
      const isUnavailable = this.isDateUnavailable(date);

      days.push({
        date: date,
        dayName: AppointmentSelectComponent.DAYS[date.getDay()],
        dayNumber: date.getDate(),
        isToday: date.getTime() === today.getTime(),
        isDisabled: isPast || isBeyondAdvance || isUnavailable,
      });
    }

    this.weekDays = days;
  }

  /**
   * Ellenőrzi, hogy egy dátum tiltott-e (backend unavailable dates alapján)
   */
  private isDateUnavailable(date: Date): boolean {
    const dateString = this.formatDateForAPI(date);
    return this.unavailableDates.has(dateString);
  }

  /**
   * Dátum formázása API-hoz (YYYY-MM-DD)
   */
  private formatDateForAPI(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private updateMonthYear(): void {
    const firstDay = this.weekDays[0]?.date;
    const lastDay = this.weekDays[6]?.date;

    if (!firstDay || !lastDay) return;

    if (firstDay.getMonth() === lastDay.getMonth()) {
      this.currentMonthYear = `${firstDay.getFullYear()}. ${
        AppointmentSelectComponent.MONTHS_FULL[firstDay.getMonth()]
      }`;
    } else {
      this.currentMonthYear = `${firstDay.getFullYear()}. ${
        AppointmentSelectComponent.MONTHS_SHORT[firstDay.getMonth()]
      } - ${AppointmentSelectComponent.MONTHS_SHORT[lastDay.getMonth()]}`;
    }
  }

  private checkCanGoBack(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTime = today.getTime();

    const firstDayOfWeek = this.weekDays[0]?.date;
    if (!firstDayOfWeek) {
      this.canGoBack = false;
      return;
    }

    const firstDayTime = firstDayOfWeek.getTime();

    this.canGoBack = firstDayTime > todayTime;
  }

  private checkCanGoForward(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTime = today.getTime();

    const lastDayOfWeek = this.weekDays[6]?.date;
    if (!lastDayOfWeek) {
      this.canGoForward = false;
      return;
    }

    const lastDayTime = lastDayOfWeek.getTime();

    this.canGoForward = lastDayTime < this.getMaxAdvanceDate().getTime();
  }

  // Segédfüggvény a maximális előre foglalható dátumhoz
  private getMaxAdvanceDate(): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + this.advanceDays);
    return maxDate;
  }

  nextWeek(): void {
    if (!this.canGoForward) return;

    this.currentWeekStart.setDate(this.currentWeekStart.getDate() + 7);
    this.generateWeekDays();
    this.updateMonthYear();
    this.checkCanGoBack();
    this.checkCanGoForward();
    this.selectedDate = null;
    this.selectedTimeSlot = null;
    this.timeSlots = [];
  }

  previousWeek(): void {
    if (!this.canGoBack) return;

    this.currentWeekStart.setDate(this.currentWeekStart.getDate() - 7);
    this.generateWeekDays();
    this.updateMonthYear();
    this.checkCanGoBack();
    this.checkCanGoForward();
    this.selectedDate = null;
    this.selectedTimeSlot = null;
    this.timeSlots = [];
  }

  selectDay(day: WeekDay): void {
    if (day.isDisabled) return;

    this.selectedDate = day.date;
    this.selectedTimeSlot = null;

    if (this.selectedSpecialist) {
      this.loadTimeSlots(day.date, this.selectedSpecialist.id);
    }
  }

  // ========================================
  // TIME SLOT SELECTION
  // ========================================

  selectTimeSlot(slot: TimeSlot): void {
    if (!slot.available) return;

    this.selectedTimeSlot = slot;

    // CartService-be is mentjük (összegzés oldalhoz kell)
    if (this.selectedDate) {
      const selectedAppt: SelectedAppointment = {
        date: this.selectedDate,
        time: slot.time,
      };

      this.cartService.setAppointment(selectedAppt);
    }
  }

  // ========================================
  // CART MANAGEMENT
  // ========================================

  removeFromCart(itemId: number): void {
    this.cartService.removeFromCart(itemId);

    // Ha üressé vált a kosár, reset
    if (this.cart.length === 0) {
      this.selectedSpecialist = null;
      this.selectedDate = null;
      this.selectedTimeSlot = null;
      this.specialists = [];
      this.timeSlots = [];
      this.unavailableDates.clear();
    }
  }

  getCartTotal(): number {
    return this.cart.reduce((sum, item) => sum + item.price, 0);
  }

  // ========================================
  // NAVIGATION
  // ========================================

  goBackToServices(): void {
    this.router.navigate(['/company', this.companyId]);
  }

  continue(): void {
    // Validálás
    if (
      !this.selectedSpecialist ||
      !this.selectedDate ||
      !this.selectedTimeSlot ||
      this.cart.length === 0
    ) {
      this.errorMessage = 'Kérlek tölts ki minden mezőt a folytatáshoz';
      return;
    }

    // Navigálás az összegzés oldalra
    this.router.navigate(['/appointment-payment', this.companyId]);
  }

  // ========================================
  // UTILITY
  // ========================================

  /**
   * Dátum formázása megjelenítéshez (2026. jan. 12.)
   */
  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = AppointmentSelectComponent.MONTHS_SHORT[date.getMonth()];
    const day = date.getDate();

    return `${year}. ${month} ${day}.`;
  }

  /**
   * Error banner bezárása
   */
  dismissError(): void {
    this.errorMessage = '';
  }
}
