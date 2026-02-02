import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-staff-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './staff-sidebar.component.html',
  styleUrl: './staff-sidebar.component.css',
})
export class StaffSidebarComponent {
  isPinned = false;

  togglePin(): void {
    this.isPinned = !this.isPinned;
  }
}
