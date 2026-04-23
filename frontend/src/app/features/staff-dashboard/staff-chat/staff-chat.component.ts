import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

import { AuthService } from '../../../core/services/auth.service';
import { DashboardChatComponent } from '../../../shared/components/dashboard-chat/dashboard-chat.component';

@Component({
  selector: 'app-staff-chat',
  standalone: true,
  imports: [CommonModule, DashboardChatComponent],
  templateUrl: './staff-chat.component.html',
  styleUrl: './staff-chat.component.css',
})
export class StaffChatComponent {
  constructor(private readonly authService: AuthService) {}

  get currentUser() {
    return this.authService.getCurrentUser();
  }
}
