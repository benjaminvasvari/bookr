import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { OwnerSidebar } from '../sidebar/owner-sidebar/owner-sidebar.component';

@Component({
  selector: 'app-owner-dashboard',
  standalone: true,
  imports: [CommonModule, RouterOutlet, OwnerSidebar],
  templateUrl: './owner-dashboard.component.html',
  styleUrl: './owner-dashboard.component.css',
})
export class OwnerDashboardComponent implements OnInit {
  isMobileView = false;
  isSidebarOpen = false;
  showMobileTopStrip = true;

  private lastContentScrollTop = 0;
  private lastToggleScrollTop = 0;

  ngOnInit(): void {
    this.updateViewportState();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.updateViewportState();
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  closeSidebar(): void {
    this.isSidebarOpen = false;
  }

  onContentScroll(event: Event): void {
    if (!this.isMobileView || this.isSidebarOpen) {
      return;
    }

    const target = event.target as HTMLElement;
    const scrollTop = target.scrollTop;

    if (scrollTop <= 10) {
      this.showMobileTopStrip = true;
      this.lastContentScrollTop = scrollTop;
      this.lastToggleScrollTop = scrollTop;
      return;
    }

    const delta = scrollTop - this.lastContentScrollTop;
    const movedSinceToggle = Math.abs(scrollTop - this.lastToggleScrollTop);

    if (this.showMobileTopStrip && delta > 10 && scrollTop > 34 && movedSinceToggle > 52) {
      this.showMobileTopStrip = false;
      this.lastToggleScrollTop = scrollTop;
    } else if (!this.showMobileTopStrip && delta < -10 && movedSinceToggle > 52) {
      this.showMobileTopStrip = true;
      this.lastToggleScrollTop = scrollTop;
    }

    this.lastContentScrollTop = scrollTop;
  }

  private updateViewportState(): void {
    this.isMobileView = window.innerWidth <= 820;
    if (!this.isMobileView) {
      this.isSidebarOpen = false;
      this.showMobileTopStrip = true;
      this.lastContentScrollTop = 0;
      this.lastToggleScrollTop = 0;
    }
  }

}
