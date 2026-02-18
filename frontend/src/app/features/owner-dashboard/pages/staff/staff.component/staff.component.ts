import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface StaffInviteForm {
  email: string;
  role: string;
}

interface PendingInvite {
  id: number;
  email: string;
  role: string;
  sentAtLabel: string;
}

@Component({
  selector: 'app-staff.component',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './staff.component.html',
  styleUrl: './staff.component.css',
})
export class StaffComponent {
  showInviteModal = false;
  isSendingInvite = false;
  inviteSent = false;
  emailTouched = false;
  roleTouched = false;

  inviteForm: StaffInviteForm = {
    email: '',
    role: '',
  };

  pendingInvites: PendingInvite[] = [];

  get isValidEmail(): boolean {
    const email = this.inviteForm.email.trim();
    return /^[^\s@]+@[^\s@]+\.(com|hu)$/i.test(email);
  }

  get canSubmitInvite(): boolean {
    return this.isValidEmail && !!this.inviteForm.role.trim() && !this.isSendingInvite;
  }

  openInviteModal(): void {
    this.resetInviteState();
    this.showInviteModal = true;
  }

  closeInviteModal(): void {
    if (this.isSendingInvite) {
      return;
    }

    this.showInviteModal = false;
  }

  submitInvite(): void {
    this.emailTouched = true;
    this.roleTouched = true;

    if (!this.canSubmitInvite) {
      return;
    }

    this.isSendingInvite = true;

    setTimeout(() => {
      this.addPendingInvite();
      this.isSendingInvite = false;
      this.inviteSent = true;

      setTimeout(() => {
        this.showInviteModal = false;
        this.resetInviteState();
      }, 1600);
    }, 900);
  }

  onEmailBlur(): void {
    this.emailTouched = true;
  }

  onRoleBlur(): void {
    this.roleTouched = true;
  }

  getInviteInitials(email: string): string {
    const localPart = email.split('@')[0]?.trim() ?? '';
    if (!localPart) {
      return 'PD';
    }

    const chunks = localPart
      .split(/[._-]+/)
      .map((part) => part.trim())
      .filter(Boolean);

    if (chunks.length >= 2) {
      return `${chunks[0][0]}${chunks[1][0]}`.toUpperCase();
    }

    return localPart.slice(0, 2).toUpperCase();
  }

  trackByPendingInvite(_: number, invite: PendingInvite): number {
    return invite.id;
  }

  private addPendingInvite(): void {
    const trimmedEmail = this.inviteForm.email.trim();
    const role = this.inviteForm.role.trim();

    if (!trimmedEmail || !role) {
      return;
    }

    const pendingInvite: PendingInvite = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      email: trimmedEmail,
      role,
      sentAtLabel: new Date().toLocaleString('hu-HU', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    this.pendingInvites = [pendingInvite, ...this.pendingInvites];
  }

  private resetInviteState(): void {
    this.isSendingInvite = false;
    this.inviteSent = false;
    this.emailTouched = false;
    this.roleTouched = false;
    this.inviteForm = {
      email: '',
      role: '',
    };
  }

}
