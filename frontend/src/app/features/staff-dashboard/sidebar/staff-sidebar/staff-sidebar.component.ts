import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { StaffSidebarStateService } from './staff-sidebar-state.service';

@Component({
  selector: 'app-staff-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './staff-sidebar.component.html',
  styleUrl: './staff-sidebar.component.css',
})
export class StaffSidebarComponent {
  isExpanded: boolean;

  constructor(private readonly staffSidebarStateService: StaffSidebarStateService) {
    this.isExpanded = this.staffSidebarStateService.getExpanded();
  }

  toggleSidebar(): void {
    this.isExpanded = !this.isExpanded;
    this.staffSidebarStateService.setExpanded(this.isExpanded);
  }
}
