import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { StaffService } from '../../core/services/staff.service';
import { StaffDashboardData } from '../../core/models/staff.model';

@Component({
  selector: 'app-staff-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './staff-dashboard.component.html',
  styleUrl: './staff-dashboard.component.css',
})
export class StaffDashboardComponent implements OnInit {
  dashboard: StaffDashboardData | null = null;
  isLoading = true;
  errorMessage = '';

  constructor(private authService: AuthService, private staffService: StaffService) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.errorMessage = 'Nincs bejelentkezett felhasználó.';
      this.isLoading = false;
      return;
    }

    this.staffService.getStaffDashboard(user.id).subscribe({
      next: (response) => {
        this.dashboard = response.result;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Nem sikerült betölteni a munkatársi adatokat.';
        this.isLoading = false;
      },
    });
  }
}
