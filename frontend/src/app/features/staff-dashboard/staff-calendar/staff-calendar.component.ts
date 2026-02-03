import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AuthService } from '../../../core/services/auth.service';
import { StaffService } from '../../../core/services/staff.service';
import { StaffDashboardAppointment, StaffDashboardData } from '../../../core/models/staff.model';
import { StaffSidebarComponent } from '../sidebar/staff-sidebar/staff-sidebar.component';

@Component({
  selector: 'app-staff-calendar',
  standalone: true,
  imports: [CommonModule, StaffSidebarComponent],
  templateUrl: './staff-calendar.component.html',
  styleUrl: './staff-calendar.component.css',
})
export class StaffCalendarComponent implements OnInit {
  dashboard: StaffDashboardData | null = null;
  isLoading = true;
  errorMessage = '';
  weekColumns: Array<{ date: string; label: string; items: StaffDashboardAppointment[] }> = [];
  private dragId: number | null = null;
  private dragFromDate: string | null = null;
  private readonly dayLabels = ['Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat', 'Vasárnap'];
  private readonly timeSlots = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:30', '17:00'];
  private appointments: StaffDashboardAppointment[] = [];
  currentWeekStart = this.startOfWeek(new Date());

  constructor(private authService: AuthService, private staffService: StaffService) {}

  ngOnInit(): void {
    this.appointments = [
      {
        id: 1,
        date: '2026-02-03',
        time: '09:30',
        serviceName: 'Hajvágás',
        clientName: 'Kiss Anna',
        durationMinutes: 45,
      },
      {
        id: 2,
        date: '2026-02-03',
        time: '11:00',
        serviceName: 'Szakáll igazítás',
        clientName: 'Nagy Bálint',
        durationMinutes: 30,
      },
      {
        id: 3,
        date: '2026-02-04',
        time: '14:00',
        serviceName: 'Festés',
        clientName: 'Kovács Lili',
        durationMinutes: 90,
      },
      {
        id: 4,
        date: '2026-02-05',
        time: '10:00',
        serviceName: 'Hot towel',
        clientName: 'Horváth Dávid',
        durationMinutes: 20,
      },
    ];

    this.dashboard = {
      staffId: 12,
      staffName: 'Ujhelyi Hunor',
      companyName: 'Bookr Studio',
      todayAppointments: [],
      upcomingAppointments: this.appointments,
      services: [],
    };

    this.buildWeekColumns();
    this.isLoading = false;
  }

  get weekRangeLabel(): string {
    const end = new Date(this.currentWeekStart);
    end.setDate(end.getDate() + 6);
    return `${this.formatDate(this.currentWeekStart)} - ${this.formatDate(end)}`;
  }

  prevWeek(): void {
    const newDate = new Date(this.currentWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    this.currentWeekStart = this.startOfWeek(newDate);
    this.buildWeekColumns();
  }

  nextWeek(): void {
    const newDate = new Date(this.currentWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    this.currentWeekStart = this.startOfWeek(newDate);
    this.buildWeekColumns();
  }

  private buildWeekColumns(): void {
    const days = this.getWeekDays(this.currentWeekStart);
    this.weekColumns = days.map((day, index) => {
      const dateKey = this.toDateKey(day);
      const items = this.appointments
        .filter((appointment) => appointment.date === dateKey)
        .sort((a, b) => a.time.localeCompare(b.time));
      return {
        date: dateKey,
        label: this.dayLabels[index],
        items: items.map((item) => ({ ...item })),
      };
    });
  }

  private getWeekDays(start: Date): Date[] {
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      return date;
    });
  }

  private startOfWeek(date: Date): Date {
    const result = new Date(date);
    const day = result.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    result.setDate(result.getDate() + diff);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  private toDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}.`;
  }

  onDragStart(date: string, appointmentId: number): void {
    this.dragFromDate = date;
    this.dragId = appointmentId;
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onDrop(date: string, targetIndex: number): void {
    if (!this.dragId || !this.dragFromDate) {
      return;
    }

    const sourceColumn = this.weekColumns.find((column) => column.date === this.dragFromDate);
    const targetColumn = this.weekColumns.find((column) => column.date === date);
    if (!sourceColumn || !targetColumn) {
      return;
    }

    const draggedIndex = sourceColumn.items.findIndex((item) => item.id === this.dragId);
    if (draggedIndex === -1) {
      return;
    }

    const [dragged] = sourceColumn.items.splice(draggedIndex, 1);
    dragged.date = date;
    targetColumn.items.splice(targetIndex, 0, dragged);

    this.applyTimesForDate(sourceColumn);
    this.applyTimesForDate(targetColumn);

    this.syncAppointmentsFromColumns();
    this.buildWeekColumns();

    this.dragId = null;
    this.dragFromDate = null;
  }

  private applyTimesForDate(column: { date: string; items: StaffDashboardAppointment[] }): void {
    column.items.forEach((item, index) => {
      item.time = this.timeSlots[index] ?? item.time;
      item.date = column.date;
    });
  }

  private syncAppointmentsFromColumns(): void {
    const updated: StaffDashboardAppointment[] = [];
    this.weekColumns.forEach((column) => {
      column.items.forEach((item) => updated.push({ ...item }));
    });

    const outsideWeek = this.appointments.filter(
      (appointment) => !this.weekColumns.some((column) => column.date === appointment.date)
    );

    this.appointments = [...updated, ...outsideWeek];
    if (this.dashboard) {
      this.dashboard.upcomingAppointments = this.appointments;
    }
  }
}
