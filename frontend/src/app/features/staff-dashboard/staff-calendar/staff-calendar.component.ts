import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../../core/services/auth.service';
import { StaffService } from '../../../core/services/staff.service';

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
export class StaffCalendarComponent implements OnInit {
  isLoading = false;
  
  selectedStaffId: number = 1;
  staffMembers: StaffMember[] = [
    { id: 1, name: 'Hunor Ujhelyi' },
    { id: 2, name: 'Barni Kiss' },
    { id: 3, name: 'Anna Kovács' },
    { id: 4, name: 'Dóra Tóth' }
  ];

  weekDays = [
    { name: 'Hétfő', date: '2026. február 16.' },
    { name: 'Kedd', date: '2026. február 17.' },
    { name: 'Szerda', date: '2026. február 18.' },
    { name: 'Csütörtök', date: '2026. február 19.' },
    { name: 'Péntek', date: '2026. február 20.' },
    { name: 'Szombat', date: '2026. február 21.' },
    { name: 'Vasárnap', date: '2026. február 22.' }
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
    {
      id: 10,
      staffId: 1,
      staffName: 'Hunor Ujhelyi',
      title: 'Ráhangolás',
      clientName: 'Molnár Zoltán',
      dayIndex: 5,
      startTime: '08:30',
      duration: 30,
      color: '#ec4899',
      service: 'Ráhangolás'
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
    // Initial load
  }

  get filteredAppointments(): CalendarAppointment[] {
    return this.allAppointments.filter(apt => apt.staffId === this.selectedStaffId);
  }

  onStaffChange(): void {
    this.selectedAppointment = null;
  }

  getAppointmentsForDay(dayIndex: number): CalendarAppointment[] {
    return this.filteredAppointments.filter(apt => apt.dayIndex === dayIndex);
  }

  getAppointmentStyle(appointment: CalendarAppointment): any {
    const [hours, minutes] = appointment.startTime.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    const startHour = 8; // Calendar starts at 8:00
    const pixelsPerHour = 60; // Height of each hour slot in pixels
    
    const topPosition = ((startMinutes - (startHour * 60)) / 60) * pixelsPerHour;
    const height = (appointment.duration / 60) * pixelsPerHour;

    return {
      'top.px': topPosition,
      'height.px': height,
      'background-color': appointment.color
    };
  }

  selectAppointment(appointment: CalendarAppointment): void {
    this.selectedAppointment = appointment;
  }

  closeDetails(): void {
    this.selectedAppointment = null;
  }

  getSelectedStaffName(): string {
    return this.staffMembers.find(s => s.id === this.selectedStaffId)?.name || '';
  }
}
