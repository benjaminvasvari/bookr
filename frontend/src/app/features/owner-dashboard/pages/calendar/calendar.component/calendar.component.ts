import { Component, OnInit, OnDestroy, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../../core/services/auth.service';
import { CompaniesService } from '../../../../../core/services/companies.service';
import { OpeningHours } from '../../../../../core/models/opening-hours.model';
import { User } from '../../../../../core/models';
import { Company } from '../../../../../core/models/company.model';
import { StaffChipComponent } from './staff-chip.component';

interface TimeSlot {
  time: string;
  hour: number;
}

interface CalendarAppointment {
  id: number;
  staffId: number;
  staffName: string;
  title: string;
  clientName: string;
  dayIndex: number; // 0 = Monday, 6 = Sunday
  startTime: string;
  duration: number; // minutes
  color: string;
  phone?: string;
  service?: string;
  price?: number;
  status?: string;
  notes?: string;
}

interface StaffMember {
  id: number;
  name: string;
  color: string;
}

interface WeekDay {
  name: string;
  shortName: string; // Egybetűs/kétbetűs rövidítés (H, K, Sze, Cs, P, Szo, V)
  date: string;
  dayIndex: number;
  dayNumber: number;
  fullDate: Date;
  openingHours: string;
  isClosed: boolean;
  isToday: boolean;
}

interface StaffAvailability {
  staffId: number;
  staffName: string;
  weeklyAvailability: {
    [dayIndex: number]: {
      isAvailable: boolean;
      startTime?: string;
      endTime?: string;
    };
  };
}

@Component({
  selector: 'app-calendar.component',
  standalone: true,
  imports: [CommonModule, FormsModule, StaffChipComponent],
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.css',
})
export class CalendarComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private companiesService = inject(CompaniesService);
  
  selectedStaffIds: number[] = []; // Empty = show all
  selectedAppointment: CalendarAppointment | null = null;
  currentTimePosition: number = 0;
  currentTimeInterval: any;
  currentWeekStart: Date = this.getMonday(new Date());
  currentMobileDayIndex: number = 1; // Start with today (Tuesday = index 1)
  mobileSelectedStaffId: number = 0;
  isMobileView: boolean = false;
  companyOpeningHours: OpeningHours | null = null;
  
  // Focused day state
  focusedDayIndex: number | null = null;

  @HostListener('window:resize')
  onResize() {
    this.isMobileView = window.innerWidth <= 480;
    this.syncMobileSelectedStaffSelection();
  }

  // Staff color mapping
  staffColors: { [key: number]: string } = {
    1: '#3b82f6', // Barni Kiss - blue
    2: '#10b981', // Bálint László - green
    3: '#ec4899', // Anna Kovács - pink
    4: '#8b5cf6'  // Dóra Tóth - purple
  };

  weekDays: WeekDay[] = [
    { name: 'Hétfő', shortName: 'H', date: '2026. február 16.', dayIndex: 0, dayNumber: 16, fullDate: new Date(2026, 1, 16), openingHours: '09:00–17:00', isClosed: false, isToday: false },
    { name: 'Kedd', shortName: 'K', date: '2026. február 17.', dayIndex: 1, dayNumber: 17, fullDate: new Date(2026, 1, 17), openingHours: '09:00–17:00', isClosed: false, isToday: true },
    { name: 'Szerda', shortName: 'Sze', date: '2026. február 18.', dayIndex: 2, dayNumber: 18, fullDate: new Date(2026, 1, 18), openingHours: '09:00–17:00', isClosed: false, isToday: false },
    { name: 'Csütörtök', shortName: 'Cs', date: '2026. február 19.', dayIndex: 3, dayNumber: 19, fullDate: new Date(2026, 1, 19), openingHours: '09:00–17:00', isClosed: false, isToday: false },
    { name: 'Péntek', shortName: 'P', date: '2026. február 20.', dayIndex: 4, dayNumber: 20, fullDate: new Date(2026, 1, 20), openingHours: '09:00–17:00', isClosed: false, isToday: false },
    { name: 'Szombat', shortName: 'Szo', date: '2026. február 21.', dayIndex: 5, dayNumber: 21, fullDate: new Date(2026, 1, 21), openingHours: '', isClosed: true, isToday: false },
    { name: 'Vasárnap', shortName: 'V', date: '2026. február 22.', dayIndex: 6, dayNumber: 22, fullDate: new Date(2026, 1, 22), openingHours: '', isClosed: true, isToday: false }
  ];

  timeSlots: TimeSlot[] = [
    { time: '08:00', hour: 8 },
    { time: '09:00', hour: 9 },
    { time: '10:00', hour: 10 },
    { time: '11:00', hour: 11 },
    { time: '12:00', hour: 12 },
    { time: '13:00', hour: 13 },
    { time: '14:00', hour: 14 },
    { time: '15:00', hour: 15 },
    { time: '16:00', hour: 16 },
    { time: '17:00', hour: 17 },
    { time: '18:00', hour: 18 }
  ];

  staffMembers: StaffMember[] = [
    { id: 0, name: 'Összes szakember', color: '#64748b' },
    { id: 1, name: 'Barni Kiss', color: '#3b82f6' },
    { id: 2, name: 'Bálint László', color: '#10b981' },
    { id: 3, name: 'Anna Kovács', color: '#ec4899' },
    { id: 4, name: 'Dóra Tóth', color: '#8b5cf6' }
  ];

  // Staff munkaidő adatok - a backend-től jövő adatok mockja
  staffAvailabilityData: StaffAvailability[] = [
    {
      staffId: 1,
      staffName: 'Barni Kiss',
      weeklyAvailability: {
        0: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
        1: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
        2: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
        3: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
        4: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
        5: { isAvailable: false },
        6: { isAvailable: false }
      }
    },
    {
      staffId: 2,
      staffName: 'Bálint László',
      weeklyAvailability: {
        0: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
        1: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
        2: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
        3: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
        4: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
        5: { isAvailable: false },
        6: { isAvailable: false }
      }
    },
    {
      staffId: 3,
      staffName: 'Anna Kovács',
      weeklyAvailability: {
        0: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
        1: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
        2: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
        3: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
        4: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
        5: { isAvailable: false },
        6: { isAvailable: false }
      }
    },
    {
      staffId: 4,
      staffName: 'Dóra Tóth',
      weeklyAvailability: {
        0: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
        1: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
        2: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
        3: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
        4: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
        5: { isAvailable: false },
        6: { isAvailable: false }
      }
    }
  ];

  allAppointments: CalendarAppointment[] = [
    {
      id: 1,
      staffId: 1,
      staffName: 'Barni Kiss',
      title: 'Hajvágás',
      clientName: 'Kovács Anna',
      dayIndex: 0,
      startTime: '09:00',
      duration: 45,
      color: '#3b82f6',
      phone: '+36 30 123 4567',
      service: 'Hajvágás',
      price: 5000,
      status: 'confirmed',
      notes: ''
    },
    {
      id: 2,
      staffId: 2,
      staffName: 'Bálint László',
      title: 'Szakáll igazítás',
      clientName: 'Nagy Péter',
      dayIndex: 0,
      startTime: '10:30',
      duration: 30,
      color: '#10b981',
      phone: '+36 30 234 5678',
      service: 'Szakáll igazítás',
      price: 3500,
      status: 'confirmed',
      notes: ''
    },
    {
      id: 3,
      staffId: 3,
      staffName: 'Anna Kovács',
      title: 'Festés',
      clientName: 'Szabó Petra',
      dayIndex: 0,
      startTime: '12:00',
      duration: 90,
      color: '#ec4899',
      phone: '+36 30 345 6789',
      service: 'Festés',
      price: 12000,
      status: 'pending',
      notes: 'Világos barna'
    },
    {
      id: 4,
      staffId: 4,
      staffName: 'Dóra Tóth',
      title: 'Relax masszázs',
      clientName: 'Kiss Zita',
      dayIndex: 1,
      startTime: '09:30',
      duration: 60,
      color: '#8b5cf6',
      phone: '+36 30 456 7890',
      service: 'Relax masszázs',
      price: 8000,
      status: 'confirmed',
      notes: ''
    },
    {
      id: 5,
      staffId: 1,
      staffName: 'Barni Kiss',
      title: 'Hajvágás',
      clientName: 'Horváth Dávid',
      dayIndex: 1,
      startTime: '11:00',
      duration: 45,
      color: '#3b82f6',
      phone: '+36 30 567 8901',
      service: 'Hajvágás',
      price: 5000,
      status: 'confirmed',
      notes: ''
    },
    {
      id: 6,
      staffId: 2,
      staffName: 'Bálint László',
      title: 'Manikűr',
      clientName: 'Varga Éva',
      dayIndex: 2,
      startTime: '10:00',
      duration: 50,
      color: '#10b981',
      phone: '+36 30 678 9012',
      service: 'Manikűr',
      price: 6000,
      status: 'completed',
      notes: ''
    },
    // Overlapping appointments for testing
    {
      id: 7,
      staffId: 4,
      staffName: 'Dóra Tóth',
      title: 'Pedikűr',
      clientName: 'Molnár Rita',
      dayIndex: 0,
      startTime: '09:15',
      duration: 45,
      color: '#8b5cf6',
      phone: '+36 30 789 0123',
      service: 'Pedikűr',
      price: 7000,
      status: 'confirmed',
      notes: ''
    },
    // More overlapping for testing
    {
      id: 8,
      staffId: 2,
      staffName: 'Bálint László',
      title: 'Hajvágás',
      clientName: 'Tóth Balázs',
      dayIndex: 1,
      startTime: '11:00',
      duration: 60,
      color: '#10b981',
      phone: '+36 30 111 2222',
      service: 'Hajvágás',
      price: 5000,
      status: 'confirmed',
      notes: ''
    },
    {
      id: 9,
      staffId: 3,
      staffName: 'Anna Kovács',
      title: 'Manikűr',
      clientName: 'Kiss Júlia',
      dayIndex: 1,
      startTime: '11:15',
      duration: 50,
      color: '#ec4899',
      phone: '+36 30 222 3333',
      service: 'Manikűr',
      price: 6000,
      status: 'pending',
      notes: ''
    },
    {
      id: 10,
      staffId: 1,
      staffName: 'Barni Kiss',
      title: 'Szakáll igazítás',
      clientName: 'Szabó Gábor',
      dayIndex: 2,
      startTime: '10:00',
      duration: 30,
      color: '#3b82f6',
      phone: '+36 30 333 4444',
      service: 'Szakáll igazítás',
      price: 3500,
      status: 'confirmed',
      notes: ''
    },
    {
      id: 11,
      staffId: 4,
      staffName: 'Dóra Tóth',
      title: 'Masszázs',
      clientName: 'Nagy Zsófia',
      dayIndex: 2,
      startTime: '10:15',
      duration: 60,
      color: '#8b5cf6',
      phone: '+36 30 444 5555',
      service: 'Masszázs',
      price: 8000,
      status: 'confirmed',
      notes: ''
    },
    {
      id: 12,
      staffId: 2,
      staffName: 'Bálint László',
      title: 'Festés',
      clientName: 'Varga Lilla',
      dayIndex: 2,
      startTime: '10:00',
      duration: 90,
      color: '#10b981',
      phone: '+36 30 555 6666',
      service: 'Festés',
      price: 12000,
      status: 'confirmed',
      notes: ''
    },
    {
      id: 13,
      staffId: 1,
      staffName: 'Barni Kiss',
      title: 'Hajvágás',
      clientName: 'Kovács Tamás',
      dayIndex: 3,
      startTime: '14:00',
      duration: 45,
      color: '#3b82f6',
      phone: '+36 30 666 7777',
      service: 'Hajvágás',
      price: 5000,
      status: 'pending',
      notes: ''
    },
    {
      id: 14,
      staffId: 3,
      staffName: 'Anna Kovács',
      title: 'Manikűr',
      clientName: 'Horváth Emma',
      dayIndex: 3,
      startTime: '14:30',
      duration: 50,
      color: '#ec4899',
      phone: '+36 30 777 8888',
      service: 'Manikűr',
      price: 6000,
      status: 'confirmed',
      notes: ''
    },
    {
      id: 15,
      staffId: 4,
      staffName: 'Dóra Tóth',
      title: 'Pedikűr',
      clientName: 'Molnár Anna',
      dayIndex: 4,
      startTime: '09:00',
      duration: 60,
      color: '#8b5cf6',
      phone: '+36 30 888 9999',
      service: 'Pedikűr',
      price: 7000,
      status: 'confirmed',
      notes: ''
    },
    {
      id: 16,
      staffId: 2,
      staffName: 'Bálint László',
      title: 'Hajvágás',
      clientName: 'Tóth István',
      dayIndex: 4,
      startTime: '09:30',
      duration: 45,
      color: '#10b981',
      phone: '+36 30 999 0000',
      service: 'Hajvágás',
      price: 5000,
      status: 'confirmed',
      notes: ''
    },
    // More appointments for fuller calendar view
    {
      id: 17,
      staffId: 1,
      staffName: 'Barni Kiss',
      title: 'Festés',
      clientName: 'Kiss Laura',
      dayIndex: 0,
      startTime: '14:00',
      duration: 90,
      color: '#3b82f6',
      phone: '+36 30 111 1111',
      service: 'Festés',
      price: 12000,
      status: 'confirmed',
      notes: ''
    },
    {
      id: 18,
      staffId: 3,
      staffName: 'Anna Kovács',
      title: 'Pedikűr',
      clientName: 'Nagy Bea',
      dayIndex: 0,
      startTime: '14:15',
      duration: 60,
      color: '#ec4899',
      phone: '+36 30 222 2222',
      service: 'Pedikűr',
      price: 7000,
      status: 'confirmed',
      notes: ''
    },
    {
      id: 19,
      staffId: 2,
      staffName: 'Bálint László',
      title: 'Hajvágás',
      clientName: 'Szabó Máté',
      dayIndex: 1,
      startTime: '14:00',
      duration: 45,
      color: '#10b981',
      phone: '+36 30 333 3333',
      service: 'Hajvágás',
      price: 5000,
      status: 'pending',
      notes: ''
    },
    {
      id: 20,
      staffId: 4,
      staffName: 'Dóra Tóth',
      title: 'Masszázs',
      clientName: 'Varga Kata',
      dayIndex: 1,
      startTime: '14:30',
      duration: 60,
      color: '#8b5cf6',
      phone: '+36 30 444 4444',
      service: 'Masszázs',
      price: 8000,
      status: 'confirmed',
      notes: ''
    },
    {
      id: 21,
      staffId: 1,
      staffName: 'Barni Kiss',
      title: 'Hajvágás',
      clientName: 'Tóth Márk',
      dayIndex: 2,
      startTime: '13:00',
      duration: 45,
      color: '#3b82f6',
      phone: '+36 30 555 5555',
      service: 'Hajvágás',
      price: 5000,
      status: 'confirmed',
      notes: ''
    },
    {
      id: 22,
      staffId: 3,
      staffName: 'Anna Kovács',
      title: 'Manikűr',
      clientName: 'Kovács Réka',
      dayIndex: 2,
      startTime: '13:15',
      duration: 50,
      color: '#ec4899',
      phone: '+36 30 666 6666',
      service: 'Manikűr',
      price: 6000,
      status: 'confirmed',
      notes: ''
    },
    {
      id: 23,
      staffId: 2,
      staffName: 'Bálint László',
      title: 'Szakáll igazítás',
      clientName: 'Nagy András',
      dayIndex: 3,
      startTime: '09:00',
      duration: 30,
      color: '#10b981',
      phone: '+36 30 777 7777',
      service: 'Szakáll igazítás',
      price: 3500,
      status: 'confirmed',
      notes: ''
    },
    {
      id: 24,
      staffId: 4,
      staffName: 'Dóra Tóth',
      title: 'Pedikűr',
      clientName: 'Horváth Éva',
      dayIndex: 3,
      startTime: '09:15',
      duration: 60,
      color: '#8b5cf6',
      phone: '+36 30 888 8888',
      service: 'Pedikűr',
      price: 7000,
      status: 'pending',
      notes: ''
    },
    {
      id: 25,
      staffId: 1,
      staffName: 'Barni Kiss',
      title: 'Hajvágás',
      clientName: 'Kiss Dániel',
      dayIndex: 3,
      startTime: '09:30',
      duration: 45,
      color: '#3b82f6',
      phone: '+36 30 999 9999',
      service: 'Hajvágás',
      price: 5000,
      status: 'confirmed',
      notes: ''
    },
    {
      id: 26,
      staffId: 3,
      staffName: 'Anna Kovács',
      title: 'Festés',
      clientName: 'Szabó Nóra',
      dayIndex: 4,
      startTime: '13:00',
      duration: 90,
      color: '#ec4899',
      phone: '+36 30 101 0101',
      service: 'Festés',
      price: 12000,
      status: 'confirmed',
      notes: 'Szőke árnyalat'
    },
    {
      id: 27,
      staffId: 2,
      staffName: 'Bálint László',
      title: 'Hajvágás',
      clientName: 'Molnár Péter',
      dayIndex: 4,
      startTime: '13:15',
      duration: 45,
      color: '#10b981',
      phone: '+36 30 202 0202',
      service: 'Hajvágás',
      price: 5000,
      status: 'confirmed',
      notes: ''
    },
    {
      id: 28,
      staffId: 4,
      staffName: 'Dóra Tóth',
      title: 'Masszázs',
      clientName: 'Varga Zoltán',
      dayIndex: 4,
      startTime: '13:30',
      duration: 60,
      color: '#8b5cf6',
      phone: '+36 30 303 0303',
      service: 'Masszázs',
      price: 8000,
      status: 'confirmed',
      notes: ''
    },
    {
      id: 29,
      staffId: 1,
      staffName: 'Barni Kiss',
      title: 'Szakáll igazítás',
      clientName: 'Tóth Gergő',
      dayIndex: 1,
      startTime: '16:00',
      duration: 30,
      color: '#3b82f6',
      phone: '+36 30 404 0404',
      service: 'Szakáll igazítás',
      price: 3500,
      status: 'pending',
      notes: ''
    },
    {
      id: 30,
      staffId: 3,
      staffName: 'Anna Kovács',
      title: 'Manikűr',
      clientName: 'Kiss Eszter',
      dayIndex: 1,
      startTime: '16:15',
      duration: 50,
      color: '#ec4899',
      phone: '+36 30 505 0505',
      service: 'Manikűr',
      price: 6000,
      status: 'confirmed',
      notes: ''
    }
  ];

  ngOnInit(): void {
    this.isMobileView = window.innerWidth <= 480;
    this.loadCompanyData();
    this.updateWeekDays();
    this.updateCurrentTimePosition();
    this.currentTimeInterval = setInterval(() => {
      this.updateCurrentTimePosition();
    }, 60000); // Update every minute
  }

  loadCompanyData(): void {
    const user: User | null = this.authService.getCurrentUser();
    if (user && user.companyId) {
      this.companiesService.getCompanyById(user.companyId).subscribe({
        next: (company: Company) => {
          this.companyOpeningHours = company.openingHours || null;
          this.updateWeekDays(); // Refresh with new data
        },
        error: (err: any) => {
          console.error('Failed to load company data:', err);
        }
      });
    }
  }

  ngOnDestroy(): void {
    if (this.currentTimeInterval) {
      clearInterval(this.currentTimeInterval);
    }
  }

  getMonday(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  updateWeekDays(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const days = ['Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat', 'Vasárnap'];
    const dayShortNames = ['H', 'K', 'Sze', 'Cs', 'P', 'Szo', 'V'];
    const dayKeys: (keyof OpeningHours)[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const months = ['január', 'február', 'március', 'április', 'május', 'június', 
                    'július', 'augusztus', 'szeptember', 'október', 'november', 'december'];
    
    this.weekDays = [];
    let todayIndex: number | null = null;
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(this.currentWeekStart);
      date.setDate(date.getDate() + i);
      date.setHours(0, 0, 0, 0);
      
      const isToday = date.getTime() === today.getTime();
      if (isToday) {
        todayIndex = i;
      }
      
      // Dinamikus zárt/nyitott állapot számítása staff availability adatok alapján
      const isDayClosed = this.isDayClosedForAllStaff(i);
      
      // Nyitvatartási idő meghatározása
      let openingHours = '';
      if (!isDayClosed) {
        // Ha van elérhető staff, gyűjtsük össze a munkaidőket
        const availableHours = this.getAvailableHoursForDay(i);
        openingHours = availableHours.length > 0 ? availableHours[0] : '09:00–17:00';
      }
      
      this.weekDays.push({
        name: days[i],
        shortName: dayShortNames[i],
        date: `${date.getFullYear()}. ${months[date.getMonth()]} ${date.getDate()}.`,
        dayIndex: i,
        dayNumber: date.getDate(),
        fullDate: date,
        openingHours: openingHours,
        isClosed: isDayClosed,
        isToday: isToday
      });
    }
    
    // Set default focused day
    this.setDefaultFocusedDay(todayIndex);
    this.setDefaultMobileDay(todayIndex);
  }

  /**
   * Alapértelmezett fókuszált nap beállítása
   * - Ha a mai nap a héten van, az legyen fókuszban
   * - Ha nincs, az első nyitott nap legyen fókuszban
   */
  private setDefaultFocusedDay(todayIndex: number | null): void {
    if (todayIndex !== null && !this.weekDays[todayIndex]?.isClosed) {
      this.focusedDayIndex = todayIndex;
    } else {
      // Keressük meg az első nyitott napot
      const firstOpenDay = this.weekDays.findIndex(day => !day.isClosed);
      this.focusedDayIndex = firstOpenDay !== -1 ? firstOpenDay : null;
    }
  }

  private setDefaultMobileDay(todayIndex: number | null): void {
    if (todayIndex !== null && !this.weekDays[todayIndex]?.isClosed) {
      this.currentMobileDayIndex = todayIndex;
      return;
    }

    const firstOpenDay = this.weekDays.findIndex(day => !day.isClosed);
    this.currentMobileDayIndex = firstOpenDay !== -1 ? firstOpenDay : 0;
  }

  /**
   * Ellenőrzi, hogy egy adott nap zárt-e (minden staff unavailable)
   */
  private isDayClosedForAllStaff(dayIndex: number): boolean {
    // Ha nincs staff adat, fallback a hétvégékre
    if (this.staffAvailabilityData.length === 0) {
      return dayIndex === 5 || dayIndex === 6; // Szombat/Vasárnap
    }

    // Ha minden staff isAvailable = false, akkor zárt a nap
    return this.staffAvailabilityData.every(staff => {
      const dayData = staff.weeklyAvailability[dayIndex];
      return !dayData || !dayData.isAvailable;
    });
  }

  /**
   * Visszaadja az elérhető munkaidőket egy adott napra
   */
  private getAvailableHoursForDay(dayIndex: number): string[] {
    const hours: string[] = [];
    
    this.staffAvailabilityData.forEach(staff => {
      const dayData = staff.weeklyAvailability[dayIndex];
      if (dayData && dayData.isAvailable && dayData.startTime && dayData.endTime) {
        const timeRange = `${dayData.startTime}–${dayData.endTime}`;
        if (!hours.includes(timeRange)) {
          hours.push(timeRange);
        }
      }
    });
    
    return hours;
  }

  previousWeek(): void {
    this.currentWeekStart.setDate(this.currentWeekStart.getDate() - 7);
    this.updateWeekDays();
  }

  nextWeek(): void {
    this.currentWeekStart.setDate(this.currentWeekStart.getDate() + 7);
    this.updateWeekDays();
  }

  goToToday(): void {
    this.currentWeekStart = this.getMonday(new Date());
    this.updateWeekDays();
  }

  // Mobile navigation methods
  previousMobileDay(): void {
    if (this.currentMobileDayIndex > 0) {
      this.currentMobileDayIndex--;
    }
  }

  nextMobileDay(): void {
    if (this.currentMobileDayIndex < 6) {
      this.currentMobileDayIndex++;
    }
  }

  getMobileDayName(): string {
    return this.weekDays[this.currentMobileDayIndex]?.name || '';
  }

  getMobileDayNumber(): number {
    return this.weekDays[this.currentMobileDayIndex]?.dayNumber || 0;
  }

  setMobileDay(index: number): void {
    const day = this.weekDays[index];
    if (!day || day.isClosed) {
      return;
    }
    this.currentMobileDayIndex = index;
  }

  getWeekDateRange(): string {
    const start = this.weekDays[0];
    const end = this.weekDays[6];
    if (!start || !end) return '';
    
    const months = ['január', 'február', 'március', 'április', 'május', 'június', 
                    'július', 'augusztus', 'szeptember', 'október', 'november', 'december'];
    const startMonth = months[start.fullDate.getMonth()];
    
    return `${start.fullDate.getFullYear()}. ${startMonth} ${start.dayNumber}–${end.dayNumber}.`;
  }

  updateCurrentTimePosition(): void {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    
    if (hours >= 8 && hours < 19) {
      const totalMinutes = (hours - 8) * 60 + minutes;
      this.currentTimePosition = (totalMinutes / 60) * 60; // 60px per hour
    }
  }

  get filteredAppointments(): CalendarAppointment[] {
    if (this.selectedStaffIds.length === 0) {
      return this.allAppointments;
    }
    return this.allAppointments.filter(apt => this.selectedStaffIds.includes(apt.staffId));
  }

  isStaffSelected(staffId: number): boolean {
    return this.selectedStaffIds.includes(staffId);
  }

  toggleStaff(staffId: number): void {
    const index = this.selectedStaffIds.indexOf(staffId);
    if (index > -1) {
      // Remove from selection
      this.selectedStaffIds.splice(index, 1);
    } else {
      // Add to selection
      this.selectedStaffIds.push(staffId);
    }
    this.selectedAppointment = null;
    this.syncMobileSelectedStaffSelection();
  }

  onMobileStaffSelectionChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const staffId = Number(selectElement.value);

    this.mobileSelectedStaffId = staffId;
    this.selectedStaffIds = staffId === 0 ? [] : [staffId];
    this.selectedAppointment = null;
  }

  getMobileSelectedStaffColor(): string {
    if (this.mobileSelectedStaffId === 0) {
      return '#64748b';
    }

    return this.staffMembers.find(staff => staff.id === this.mobileSelectedStaffId)?.color || '#64748b';
  }

  private syncMobileSelectedStaffSelection(): void {
    this.mobileSelectedStaffId = this.selectedStaffIds.length === 1 ? this.selectedStaffIds[0] : 0;
  }

  onStaffColorChanged(event: { staffId: number; color: string }): void {
    const { staffId, color } = event;

    this.staffMembers = this.staffMembers.map(staff =>
      staff.id === staffId ? { ...staff, color } : staff
    );

    this.staffColors = {
      ...this.staffColors,
      [staffId]: color
    };

    this.allAppointments = this.allAppointments.map(appointment =>
      appointment.staffId === staffId ? { ...appointment, color } : appointment
    );

    if (this.selectedAppointment && this.selectedAppointment.staffId === staffId) {
      this.selectedAppointment = {
        ...this.selectedAppointment,
        color
      };
    }

    this.persistStaffColor(staffId, color);
  }

  private persistStaffColor(staffId: number, color: string): void {
    console.info('Staff color saved locally', { staffId, color });
  }

  getShortName(fullName: string): string {
    const parts = fullName.split(' ');
    if (parts.length >= 2) {
      return parts[0]; // Return first name only
    }
    return fullName;
  }

  getAppointmentsForDay(dayIndex: number): CalendarAppointment[] {
    const dayAppts = this.allAppointments.filter(apt => apt.dayIndex === dayIndex);
    
    // If no staff selected, show all
    if (this.selectedStaffIds.length === 0) {
      return dayAppts;
    }
    
    // Show only selected staff
    return dayAppts.filter(apt => this.selectedStaffIds.includes(apt.staffId));
  }

  // Column layout - overflow allowed for better visibility
  getAppointmentStyleWithOverlap(appointment: CalendarAppointment, dayIndex: number): any {
    const [hours, minutes] = appointment.startTime.split(':').map(Number);
    const startMinutes = (hours - 8) * 60 + minutes;
    const endMinutes = startMinutes + appointment.duration;
    const top = startMinutes;
    const height = appointment.duration;

    // Find appointments that overlap in time
    const dayAppointments = this.getAppointmentsForDay(dayIndex);
    const overlapping = dayAppointments.filter(apt => {
      const [aptHours, aptMinutes] = apt.startTime.split(':').map(Number);
      const aptStart = (aptHours - 8) * 60 + aptMinutes;
      const aptEnd = aptStart + apt.duration;
      return apt.id !== appointment.id && aptStart < endMinutes && aptEnd > startMinutes;
    });

    // Check if this day is closed or unfocused
    const isClosed = this.weekDays[dayIndex]?.isClosed || false;
    const isUnfocused = !this.isFocused(dayIndex);
    
    let width = 'calc(100% - 4px)';
    let left = '2px';
    let zIndex = 1;
    
    // Zárt napok - vastagabb csíkok (18px) egymás mellett
    if (isClosed && overlapping.length > 0) {
      const allAppointments = [appointment, ...overlapping].sort((a, b) => {
        const [aH, aM] = a.startTime.split(':').map(Number);
        const [bH, bM] = b.startTime.split(':').map(Number);
        const aStart = aH * 60 + aM;
        const bStart = bH * 60 + bM;
        if (aStart !== bStart) return aStart - bStart;
        return a.id - b.id;
      });
      
      const totalColumns = allAppointments.length;
      const columnIndex = allAppointments.findIndex(a => a.id === appointment.id);
      
      // Zárt napokon: 18px széles csíkok
      const stripWidth = 18;
      const spacing = 1; // Pixel távolság a csíkok között
      const totalWidth = totalColumns * stripWidth + (totalColumns - 1) * spacing;
      const startOffset = `calc(50% - ${totalWidth / 2}px)`;
      
      width = `${stripWidth}px`;
      left = `calc(${startOffset} + ${columnIndex * (stripWidth + spacing)}px)`;
      zIndex = columnIndex + 1;
    }
    // Zárt nap, nincs overlap - középre igazított egyetlen vastagabb csík
    else if (isClosed) {
      width = '18px';
      left = 'calc(50% - 9px)';
    }
    // Unfocused napok - vékony csíkok egymás mellett
    else if (isUnfocused && overlapping.length > 0) {
      const allAppointments = [appointment, ...overlapping].sort((a, b) => {
        const [aH, aM] = a.startTime.split(':').map(Number);
        const [bH, bM] = b.startTime.split(':').map(Number);
        const aStart = aH * 60 + aM;
        const bStart = bH * 60 + bM;
        if (aStart !== bStart) return aStart - bStart;
        return a.id - b.id;
      });
      
      const totalColumns = allAppointments.length;
      const columnIndex = allAppointments.findIndex(a => a.id === appointment.id);
      
      // Ha unfocused: 14px széles csíkok, egymás mellett
      const stripWidth = 14;
      const spacing = 1; // Pixel távolság a csíkok között
      const totalWidth = totalColumns * stripWidth + (totalColumns - 1) * spacing;
      const startOffset = `calc(50% - ${totalWidth / 2}px)`;
      
      width = `${stripWidth}px`;
      left = `calc(${startOffset} + ${columnIndex * (stripWidth + spacing)}px)`;
      zIndex = columnIndex + 1;
    }
    // Focused napok - normál széles overlap kezelés
    else if (overlapping.length > 0) {
      const allAppointments = [appointment, ...overlapping].sort((a, b) => {
        const [aH, aM] = a.startTime.split(':').map(Number);
        const [bH, bM] = b.startTime.split(':').map(Number);
        const aStart = aH * 60 + aM;
        const bStart = bH * 60 + bM;
        if (aStart !== bStart) return aStart - bStart;
        return a.id - b.id;
      });
      
      const totalColumns = allAppointments.length;
      const columnIndex = allAppointments.findIndex(a => a.id === appointment.id);
      
      // Calculate width - ensure minimum 85px
      const columnWidth = 100 / totalColumns;
      width = `max(${columnWidth}%, 85px)`;
      left = `calc(${columnWidth}% * ${columnIndex})`;
      zIndex = columnIndex + 1;
    }
    // Unfocused, nincs overlap - középre igazított egyetlen csík
    else if (isUnfocused) {
      width = '14px';
      left = 'calc(50% - 7px)';
    }

    // Convert hex to RGBA
    const hexToRgba = (hex: string, opacity: number) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      if (!result) return `rgba(99, 102, 241, ${opacity})`;
      return `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${opacity})`;
    };

    return {
      top: `${top}px`,
      height: `${height}px`,
      width: width,
      left: left,
      zIndex: zIndex,
      background: hexToRgba(appointment.color, 0.12),
      borderLeft: `6px solid ${appointment.color}`,
      '--hover-bg': hexToRgba(appointment.color, 0.22),
      '--border-color': appointment.color
    };
  }

  selectAppointment(appointment: CalendarAppointment): void {
    this.selectedAppointment = appointment;
  }

  closeDetails(): void {
    this.selectedAppointment = null;
  }

  shouldShowService(appointment: CalendarAppointment, dayIndex: number): boolean {
    // Only show if duration >= 30 minutes AND no overlapping appointments
    if (appointment.duration < 30) return false;
    
    const [hours, minutes] = appointment.startTime.split(':').map(Number);
    const startMinutes = (hours - 8) * 60 + minutes;
    const endMinutes = startMinutes + appointment.duration;
    
    const dayAppointments = this.getAppointmentsForDay(dayIndex);
    const hasOverlap = dayAppointments.some(apt => {
      if (apt.id === appointment.id) return false;
      
      const [aptHours, aptMinutes] = apt.startTime.split(':').map(Number);
      const aptStart = (aptHours - 8) * 60 + aptMinutes;
      const aptEnd = aptStart + apt.duration;
      
      return aptStart < endMinutes && aptEnd > startMinutes;
    });
    
    return !hasOverlap;
  }

  getStatusLabel(status?: string): string {
    const labels: { [key: string]: string } = {
      'pending': 'Függőben',
      'confirmed': 'Megerősítve',
      'completed': 'Befejezve',
      'cancelled': 'Lemondva'
    };
    return labels[status || 'pending'] || status || '';
  }

  getAvatarInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  shouldShowClientName(appointment: CalendarAppointment): boolean {
    return appointment.duration >= 45;
  }

  /**
   * Fókusz beállítása egy adott napra
   */
  setFocusedDay(dayIndex: number): void {
    const day = this.weekDays[dayIndex];
    if (!day || day.isClosed) {
      return; // Zárt napokra nem lehet fókuszálni
    }
    this.focusedDayIndex = dayIndex;
  }

  /**
   * Ellenőrzi, hogy egy nap fókuszban van-e
   */
  isFocused(dayIndex: number): boolean {
    return this.focusedDayIndex === dayIndex;
  }
}
