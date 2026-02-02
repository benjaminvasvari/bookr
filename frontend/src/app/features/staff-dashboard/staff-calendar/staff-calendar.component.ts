import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AuthService } from '../../../core/services/auth.service';
import { StaffService } from '../../../core/services/staff.service';
import { StaffDashboardData } from '../../../core/models/staff.model';
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

  constructor(private authService: AuthService, private staffService: StaffService) {}

  ngOnInit(): void {
    this.dashboard = {
      staffId: 12,
      staffName: 'Ujhelyi Hunor',
      companyName: 'Bookr Studio',
      todayAppointments: [],
      upcomingAppointments: [
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
      ],
      services: [],
    };
    this.isLoading = false;
  }
}
