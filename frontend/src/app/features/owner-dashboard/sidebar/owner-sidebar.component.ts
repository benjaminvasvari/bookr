import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-owner-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './owner-sidebar.component.html',
  styleUrls: ['./owner-sidebar.component.css'],
})
export class OwnerSidebar {
  isMobileView = input<boolean>(false);
  mobileOpen = input<boolean>(false);
  requestClose = output<void>();

  isExpanded = true;

  toggleSidebar(): void {
    if (this.isMobileView()) {
      return;
    }

    this.isExpanded = !this.isExpanded;
  }

  closeSidebar(): void {
    this.requestClose.emit();
  }

  onNavClick(): void {
    if (this.isMobileView()) {
      this.closeSidebar();
    }
  }
}
