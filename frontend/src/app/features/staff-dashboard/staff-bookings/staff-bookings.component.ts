import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { StaffSidebarComponent } from '../sidebar/staff-sidebar/staff-sidebar.component';

interface StaffBookingItem {
  id: number;
  date: string;
  time: string;
  serviceName: string;
  clientName: string;
  status: 'confirmed' | 'pending' | 'cancelled';
}

@Component({
  selector: 'app-staff-bookings',
  standalone: true,
  imports: [CommonModule, StaffSidebarComponent],
  templateUrl: './staff-bookings.component.html',
  styleUrl: './staff-bookings.component.css',
})
export class StaffBookingsComponent {
  bookings: StaffBookingItem[] = [
    {
      id: 1,
      date: '2026-02-05',
      time: '09:30',
      serviceName: 'Hajvágás',
      clientName: 'Kiss Anna',
      status: 'confirmed',
    },
    {
      id: 2,
      date: '2026-02-05',
      time: '11:00',
      serviceName: 'Szakáll igazítás',
      clientName: 'Nagy Bálint',
      status: 'pending',
    },
    {
      id: 3,
      date: '2026-02-06',
      time: '14:00',
      serviceName: 'Festés',
      clientName: 'Kovács Lili',
      status: 'cancelled',
    },
  ];
}
