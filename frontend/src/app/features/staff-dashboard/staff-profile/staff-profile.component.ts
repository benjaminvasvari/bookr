import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models';
import { StaffSidebarComponent } from '../sidebar/staff-sidebar/staff-sidebar.component';

@Component({
  selector: 'app-staff-profile',
  standalone: true,
  imports: [CommonModule, StaffSidebarComponent],
  templateUrl: './staff-profile.component.html',
  styleUrl: './staff-profile.component.css',
})
export class StaffProfileComponent implements OnInit {
  currentUser: User | null = null;
  displayName = 'Staff Profil';

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();

    if (this.currentUser?.firstName || this.currentUser?.lastName) {
      const firstName = this.currentUser.firstName || '';
      const lastName = this.currentUser.lastName || '';
      this.displayName = `${firstName} ${lastName}`.trim();
    }
  }
}
