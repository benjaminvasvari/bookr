import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

import { AuthService } from '../../../../core/services/auth.service';
import { DashboardChatComponent } from '../../../../shared/components/dashboard-chat/dashboard-chat.component';

@Component({
  selector: 'app-owner-chat-page',
  standalone: true,
  imports: [CommonModule, DashboardChatComponent],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css',
})
export class OwnerChatPageComponent {
  constructor(private readonly authService: AuthService) {}

  get currentUser() {
    return this.authService.getCurrentUser();
  }
}
