import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../../core/services/auth.service';
import { StaffService } from '../../../core/services/staff.service';

interface TimeSlot {
  time: string;
  hour: number;
}

interface WeekDay {
  name: string;
  shortName: string;
  date: string;
  dayIndex: number;
  dayNumber: number;
  fullDate: Date;
  openingHours: string;
  isClosed: boolean;
  isToday: boolean;
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
}

interface StaffMember {
  id: number;
  name: string;
}

@Component({
  selector: 'app-staff-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './staff-calendar.component.html',
  styleUrl: './staff-calendar.component.css',
})
export class StaffCalendarComponent implements OnInit, OnDestroy {
  isLoading = false;
  private readonly appointmentBorderColor = '#4338ca';
  currentTimePosition: number = 0;
  currentTimeInterval: any;
  currentWeekStart: Date = this.getMonday(new Date());
  focusedDayIndex: number | null = null;
  
  selectedStaffId: number = 1;
  staffMembers: StaffMember[] = [
    { id: 1, name: 'Hunor Ujhelyi' },
    { id: 2, name: 'Barni Kiss' },
    { id: 3, name: 'Anna Kovács' },
    { id: 4, name: 'Dóra Tóth' }
  ];

  weekDays: WeekDay[] = [];

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
    { time: '18:00', hour: 18 },
    { time: '19:00', hour: 19 }
  ];

  allAppointments: CalendarAppointment[] = [
    {
      id: 1,
      staffId: 1,
      staffName: 'Hunor Ujhelyi',
      title: 'Hajvágás',
      clientName: 'Mészáros Anna',
      dayIndex: 0,
      startTime: '09:00',
      duration: 45,
      color: '#3b82f6',
      phone: '+36 30 123 4567',
      service: 'Hajvágás'
    },
    {
      id: 2,
      staffId: 1,
      staffName: 'Hunor Ujhelyi',
      title: 'Manikűr',
      clientName: 'Kovács Éva',
      dayIndex: 0,
      startTime: '10:00',
      duration: 50,
      color: '#ec4899',
      service: 'Manikűr'
    },
    {
      id: 3,
      staffId: 1,
      staffName: 'Hunor Ujhelyi',
      title: 'Frizura + Szakáll igazítás',
      clientName: 'Nagy Péter',
      dayIndex: 1,
      startTime: '09:00',
      duration: 60,
      color: '#ef4444',
      service: 'Frizura + Szakáll'
    },
    {
      id: 4,
      staffId: 1,
      staffName: 'Hunor Ujhelyi',
      title: 'Szigor',
      clientName: 'Kovács András',
      dayIndex: 1,
      startTime: '11:00',
      duration: 30,
      color: '#8b5cf6',
      service: 'Szigor'
    },
    {
      id: 5,
      staffId: 1,
      staffName: 'Hunor Ujhelyi',
      title: 'Szépülés nőknek',
      clientName: 'Szabó Petra',
      dayIndex: 1,
      startTime: '12:00',
      duration: 90,
      color: '#06b6d4',
      service: 'Szépülés'
    },
    {
      id: 6,
      staffId: 1,
      staffName: 'Hunor Ujhelyi',
      title: 'Hajvágás',
      clientName: 'Horváth Dávid',
      dayIndex: 2,
      startTime: '13:30',
      duration: 45,
      color: '#10b981',
      service: 'Hajvágás'
    },
    {
      id: 7,
      staffId: 1,
      staffName: 'Hunor Ujhelyi',
      title: 'Relax',
      clientName: 'Kiss Zita',
      dayIndex: 2,
      startTime: '15:00',
      duration: 60,
      color: '#14b8a6',
      service: 'Relax masszázs'
    },
    {
      id: 8,
      staffId: 1,
      staffName: 'Hunor Ujhelyi',
      title: 'Hajvágás, szakáll borotva',
      clientName: 'Tóth László',
      dayIndex: 3,
      startTime: '14:30',
      duration: 75,
      color: '#f59e0b',
      service: 'Hajvágás + szakáll'
    },
    {
      id: 9,
      staffId: 1,
      staffName: 'Hunor Ujhelyi',
      title: 'Festés+Vágás',
      clientName: 'Varga Éva',
      dayIndex: 4,
      startTime: '15:00',
      duration: 120,
      color: '#3b82f6',
      service: 'Festés+Vágás'
    },
    // Staff 2 appointments
    {
      id: 11,
      staffId: 2,
      staffName: 'Barni Kiss',
      title: 'Hajvágás',
      clientName: 'Balogh István',
      dayIndex: 0,
      startTime: '10:00',
      duration: 45,
      color: '#3b82f6',
      service: 'Hajvágás'
    },
    {
      id: 12,
      staffId: 2,
      staffName: 'Barni Kiss',
      title: 'Szakáll igazítás',
      clientName: 'Németh Gábor',
      dayIndex: 1,
      startTime: '14:00',
      duration: 30,
      color: '#8b5cf6',
      service: 'Szakáll igazítás'
    }
  ];

  selectedAppointment: CalendarAppointment | null = null;

  constructor(private authService: AuthService, private staffService: StaffService) {}

  ngOnInit(): void {
    this.updateWeekDays();
    this.updateCurrentTimePosition();
    this.currentTimeInterval = setInterval(() => {
      this.updateCurrentTimePosition();
    }, 60000);
  }

  ngOnDestroy(): void {
    if (this.currentTimeInterval) {
      clearInterval(this.currentTimeInterval);
    }
  }

  get filteredAppointments(): CalendarAppointment[] {
    return this.allAppointments.filter(apt => apt.staffId === this.selectedStaffId);
  }

  onStaffChange(): void {
    this.selectedAppointment = null;
    this.updateWeekDays();
  }

  getAppointmentsForDay(dayIndex: number): CalendarAppointment[] {
    return this.filteredAppointments.filter(apt => apt.dayIndex === dayIndex);
  }

  getAppointmentStyleWithOverlap(appointment: CalendarAppointment, dayIndex: number): any {
    const [hours, minutes] = appointment.startTime.split(':').map(Number);
    const startMinutes = (hours - 8) * 60 + minutes;
    const endMinutes = startMinutes + appointment.duration;

    const dayAppointments = this.getAppointmentsForDay(dayIndex);
    const overlapping = dayAppointments.filter(apt => {
      const [aptHours, aptMinutes] = apt.startTime.split(':').map(Number);
      const aptStart = (aptHours - 8) * 60 + aptMinutes;
      const aptEnd = aptStart + apt.duration;
      return apt.id !== appointment.id && aptStart < endMinutes && aptEnd > startMinutes;
    });

    const isClosed = this.weekDays[dayIndex]?.isClosed || false;
    const isUnfocused = !this.isFocused(dayIndex);

    let width = 'calc(100% - 4px)';
    let left = '2px';
    let zIndex = 1;

    if (isClosed && overlapping.length > 0) {
      const columns = this.getOrderedOverlapColumns(appointment, overlapping);
      const columnIndex = columns.findIndex(a => a.id === appointment.id);
      const stripWidth = 18;
      const spacing = 1;
      const totalWidth = columns.length * stripWidth + (columns.length - 1) * spacing;
      width = `${stripWidth}px`;
      left = `calc(50% - ${totalWidth / 2}px + ${columnIndex * (stripWidth + spacing)}px)`;
      zIndex = columnIndex + 1;
    } else if (isClosed) {
      width = '18px';
      left = 'calc(50% - 9px)';
    } else if (isUnfocused && overlapping.length > 0) {
      const columns = this.getOrderedOverlapColumns(appointment, overlapping);
      const columnIndex = columns.findIndex(a => a.id === appointment.id);
      const stripWidth = 14;
      const spacing = 1;
      const totalWidth = columns.length * stripWidth + (columns.length - 1) * spacing;
      width = `${stripWidth}px`;
      left = `calc(50% - ${totalWidth / 2}px + ${columnIndex * (stripWidth + spacing)}px)`;
      zIndex = columnIndex + 1;
    } else if (overlapping.length > 0) {
      const columns = this.getOrderedOverlapColumns(appointment, overlapping);
      const columnIndex = columns.findIndex(a => a.id === appointment.id);
      const columnWidth = 100 / columns.length;
      width = `max(${columnWidth}%, 85px)`;
      left = `calc(${columnWidth}% * ${columnIndex})`;
      zIndex = columnIndex + 1;
    } else if (isUnfocused) {
      width = '14px';
      left = 'calc(50% - 7px)';
    }

    return {
      top: `${startMinutes}px`,
      height: `${appointment.duration}px`,
      width,
      left,
      zIndex,
      background: 'rgba(79, 70, 229, 0.12)',
      borderLeft: `6px solid ${this.appointmentBorderColor}`,
      '--hover-bg': 'rgba(79, 70, 229, 0.22)',
      '--border-color': this.appointmentBorderColor
    };
  }

  private getOrderedOverlapColumns(
    appointment: CalendarAppointment,
    overlapping: CalendarAppointment[]
  ): CalendarAppointment[] {
    return [appointment, ...overlapping].sort((a, b) => {
      const [aH, aM] = a.startTime.split(':').map(Number);
      const [bH, bM] = b.startTime.split(':').map(Number);
      const aStart = aH * 60 + aM;
      const bStart = bH * 60 + bM;
      if (aStart !== bStart) {
        return aStart - bStart;
      }
      return a.id - b.id;
    });
  }

  selectAppointment(appointment: CalendarAppointment): void {
    this.selectedAppointment = appointment;
  }

  closeDetails(): void {
    this.selectedAppointment = null;
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

  getWeekDateRange(): string {
    const start = this.weekDays[0];
    const end = this.weekDays[6];
    if (!start || !end) return '';

    const months = ['január', 'február', 'március', 'április', 'május', 'június',
      'július', 'augusztus', 'szeptember', 'október', 'november', 'december'];
    const startMonth = months[start.fullDate.getMonth()];

    return `${start.fullDate.getFullYear()}. ${startMonth} ${start.dayNumber}–${end.dayNumber}.`;
  }

  setFocusedDay(dayIndex: number): void {
    const day = this.weekDays[dayIndex];
    if (!day || day.isClosed) {
      return;
    }
    this.focusedDayIndex = dayIndex;
  }

  isFocused(dayIndex: number): boolean {
    return this.focusedDayIndex === dayIndex;
  }

  private setDefaultFocusedDay(todayIndex: number | null): void {
    if (todayIndex !== null && !this.weekDays[todayIndex]?.isClosed) {
      this.focusedDayIndex = todayIndex;
      return;
    }

    const firstOpenDay = this.weekDays.findIndex(day => !day.isClosed);
    this.focusedDayIndex = firstOpenDay !== -1 ? firstOpenDay : null;
  }

  private updateWeekDays(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days = ['Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat', 'Vasárnap'];
    const dayShortNames = ['H', 'K', 'Sze', 'Cs', 'P', 'Szo', 'V'];
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

      const isClosed = i === 5 || i === 6;
      this.weekDays.push({
        name: days[i],
        shortName: dayShortNames[i],
        date: `${date.getFullYear()}. ${months[date.getMonth()]} ${date.getDate()}.`,
        dayIndex: i,
        dayNumber: date.getDate(),
        fullDate: date,
        openingHours: isClosed ? '' : '09:00–17:00',
        isClosed,
        isToday,
      });
    }

    this.setDefaultFocusedDay(todayIndex);
  }

  private updateCurrentTimePosition(): void {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();

    if (hours >= 8 && hours < 19) {
      const totalMinutes = (hours - 8) * 60 + minutes;
      this.currentTimePosition = totalMinutes;
      return;
    }

    this.currentTimePosition = 0;
  }

  getStatusLabel(status?: string): string {
    const labels: { [key: string]: string } = {
      pending: 'Függőben',
      confirmed: 'Megerősítve',
      completed: 'Befejezve',
      cancelled: 'Lemondva',
    };
    return labels[status || 'pending'] || status || '';
  }

  private getMonday(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  getSelectedStaffName(): string {
    return this.staffMembers.find(s => s.id === this.selectedStaffId)?.name || '';
  }
}
