import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { StaffDashboardAppointment, StaffDashboardData } from '../../core/models/staff.model';

@Component({
  selector: 'app-staff-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './staff-dashboard.component.html',
  styleUrl: './staff-dashboard.component.css',
})
export class StaffDashboardComponent implements OnInit {
  private readonly staffCalendarDefaultColor = '#4338ca';

  dashboard: StaffDashboardData | null = null;
  isLoading = true;
  errorMessage = '';

  constructor() {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  get displayName(): string {
    return this.dashboard?.staffName || 'Staff';
  }

  get companyName(): string {
    return this.dashboard?.companyName || 'Nincs hozzárendelt cég';
  }

  get staffInitials(): string {
    const words = this.displayName
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (words.length === 0) {
      return 'ST';
    }

    if (words.length === 1) {
      return words[0].slice(0, 2).toUpperCase();
    }

    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }

  get todayCount(): number {
    return this.dashboard?.todayAppointments.length ?? 0;
  }

  get upcomingCount(): number {
    return this.dashboard?.upcomingAppointments.length ?? 0;
  }

  get serviceCount(): number {
    return this.dashboard?.services.length ?? 0;
  }

  get plannedMinutes(): number {
    const todayMinutes = this.dashboard?.todayAppointments.reduce((sum, item) => sum + item.durationMinutes, 0) ?? 0;
    const upcomingMinutes =
      this.dashboard?.upcomingAppointments.reduce((sum, item) => sum + item.durationMinutes, 0) ?? 0;

    return todayMinutes + upcomingMinutes;
  }

  get nextAppointment(): StaffDashboardAppointment | null {
    const allAppointments = [
      ...(this.dashboard?.todayAppointments ?? []),
      ...(this.dashboard?.upcomingAppointments ?? []),
    ];

    if (allAppointments.length === 0) {
      return null;
    }

    return allAppointments
      .slice()
      .sort((a, b) => this.toTimestamp(a) - this.toTimestamp(b))[0] ?? null;
  }

  get nextAppointmentColor(): string {
    const appointment = this.nextAppointment;

    if (!appointment) {
      return this.staffCalendarDefaultColor;
    }

    return this.getCalendarColorForService(appointment.serviceName);
  }

  get nextAppointmentBackground(): string {
    return this.hexToRgba(this.nextAppointmentColor, 0.12);
  }

  getAppointmentColor(appointment: StaffDashboardAppointment): string {
    return this.getCalendarColorForService(appointment.serviceName);
  }

  getAppointmentBackground(appointment: StaffDashboardAppointment): string {
    return this.hexToRgba(this.getAppointmentColor(appointment), 0.12);
  }

  get sortedTodayAppointments(): StaffDashboardAppointment[] {
    return (this.dashboard?.todayAppointments ?? [])
      .slice()
      .sort((a, b) => this.toTimestamp(a) - this.toTimestamp(b));
  }

  get sortedUpcomingAppointments(): StaffDashboardAppointment[] {
    return (this.dashboard?.upcomingAppointments ?? [])
      .slice()
      .sort((a, b) => this.toTimestamp(a) - this.toTimestamp(b));
  }

  formatDate(dateValue: string): string {
    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return dateValue;
    }

    return date.toLocaleDateString('hu-HU', {
      month: 'short',
      day: 'numeric',
      weekday: 'short',
    });
  }

  formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} perc`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
      return `${hours} óra`;
    }

    return `${hours} óra ${remainingMinutes} perc`;
  }

  trackByAppointment(_: number, appointment: StaffDashboardAppointment): number {
    return appointment.id;
  }

  private loadDashboard(): void {
    this.dashboard = this.createMockDashboard();
    this.errorMessage = '';
    this.isLoading = false;
  }

  private createMockDashboard(): StaffDashboardData {
    const today = new Date();
    const tomorrow = new Date(Date.now() + 86400000);
    const twoDaysLater = new Date(Date.now() + 172800000);

    return {
      staffId: 12,
      staffName: 'Ujhelyi Hunor',
      companyName: 'Bookr Studio',
      todayAppointments: [
        {
          id: 1001,
          date: today.toISOString().split('T')[0],
          time: '10:00',
          serviceName: 'Prémium hajvágás',
          clientName: 'Kiss Anna',
          durationMinutes: 45,
        },
        {
          id: 1002,
          date: today.toISOString().split('T')[0],
          time: '12:30',
          serviceName: 'Szakáll formázás',
          clientName: 'Nagy Bálint',
          durationMinutes: 30,
        },
      ],
      upcomingAppointments: [
        {
          id: 1003,
          date: tomorrow.toISOString().split('T')[0],
          time: '14:30',
          serviceName: 'Hajfestés',
          clientName: 'Kovács Lili',
          durationMinutes: 90,
        },
        {
          id: 1004,
          date: twoDaysLater.toISOString().split('T')[0],
          time: '09:15',
          serviceName: 'Női hajvágás',
          clientName: 'Szabó Petra',
          durationMinutes: 50,
        },
        {
          id: 1005,
          date: twoDaysLater.toISOString().split('T')[0],
          time: '16:00',
          serviceName: 'Hot towel + szakáll',
          clientName: 'Horváth Dávid',
          durationMinutes: 30,
        },
      ],
      services: [
        {
          id: 1,
          name: 'Prémium hajvágás',
          durationMinutes: 45,
          price: 8500,
        },
        {
          id: 2,
          name: 'Szakáll formázás',
          durationMinutes: 30,
          price: 6500,
        },
        {
          id: 3,
          name: 'Hajfestés',
          durationMinutes: 90,
          price: 18000,
        },
        {
          id: 4,
          name: 'Hot towel + szakáll',
          durationMinutes: 30,
          price: 7800,
        },
      ],
    };
  }

  private getCalendarColorForService(serviceName: string): string {
    const normalized = serviceName.trim().toLowerCase();

    const colorMap: Record<string, string> = {
      'hajvágás': '#3b82f6',
      'prémium hajvágás': '#3b82f6',
      'női hajvágás': '#3b82f6',
      'szakáll formázás': '#8b5cf6',
      'hot towel + szakáll': '#8b5cf6',
      'hajfestés': '#06b6d4',
      'frizura + szakáll igazítás': '#ef4444',
      'szépülés nőknek': '#06b6d4',
      'relax': '#14b8a6',
      'manikűr': '#ec4899',
      'szigor': '#8b5cf6',
    };

    return colorMap[normalized] ?? this.staffCalendarDefaultColor;
  }

  private hexToRgba(hex: string, alpha: number): string {
    const cleanHex = hex.replace('#', '');
    const isShort = cleanHex.length === 3;
    const fullHex = isShort
      ? `${cleanHex[0]}${cleanHex[0]}${cleanHex[1]}${cleanHex[1]}${cleanHex[2]}${cleanHex[2]}`
      : cleanHex;

    const num = Number.parseInt(fullHex, 16);
    if (Number.isNaN(num)) {
      return `rgba(67, 56, 202, ${alpha})`;
    }

    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  private toTimestamp(appointment: StaffDashboardAppointment): number {
    const isoCandidate = `${appointment.date}T${appointment.time}:00`;
    const parsed = new Date(isoCandidate);

    if (!Number.isNaN(parsed.getTime())) {
      return parsed.getTime();
    }

    return Number.MAX_SAFE_INTEGER;
  }
}
