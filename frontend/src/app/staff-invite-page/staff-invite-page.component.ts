import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { AuthService } from '../core/services/auth.service';
import { StaffService } from '../core/services/staff.service';

type InviteAction = 'accept' | 'reject';

@Component({
  selector: 'app-staff-invite-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './staff-invite-page.component.html',
  styleUrl: './staff-invite-page.component.css',
})
export class StaffInvitePageComponent implements OnInit {
  token = '';

  isCheckingAuth = true;
  isSubmitting = false;
  actionCompleted = false;

  successMessage = '';
  errorMessage = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly staffService: StaffService,
  ) {}

  ngOnInit(): void {
    const tokenFromUrl = this.route.snapshot.queryParamMap.get('token')?.trim() || '';

    if (!tokenFromUrl) {
      this.isCheckingAuth = false;
      this.errorMessage = 'Hiányzó vagy érvénytelen meghívó link.';
      return;
    }

    this.token = tokenFromUrl;

    if (!this.authService.isAuthenticated()) {
      const returnUrl = this.router.url;
      this.router.navigate(['/login'], { queryParams: { returnUrl } });
      return;
    }

    this.isCheckingAuth = false;
  }

  acceptInvite(): void {
    this.submitAction('accept');
  }

  rejectInvite(): void {
    this.submitAction('reject');
  }

  goToHome(): void {
    this.router.navigate(['/']);
  }

  private submitAction(action: InviteAction): void {
    if (this.actionCompleted || this.isSubmitting || !this.token) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const request$ =
      action === 'accept'
        ? this.staffService.acceptPendingStaffInvite(this.token)
        : this.staffService.rejectPendingStaffInvite(this.token);

    request$.subscribe({
      next: () => {
        this.isSubmitting = false;
        this.actionCompleted = true;
        this.successMessage =
          action === 'accept'
            ? 'Sikeresen elfogadtad a meghívót. Most már látnod kell a staff felületet a jogosultságaid alapján.'
            : 'A meghívót elutasítottad.';
      },
      error: (error) => {
        this.isSubmitting = false;
        this.errorMessage = this.resolveErrorMessage(error);
      },
    });
  }

  private resolveErrorMessage(error: unknown): string {
    if (typeof error !== 'object' || error === null) {
      return 'A művelet nem sikerült. Próbáld újra később.';
    }

    const httpError = error as {
      status?: number;
      error?: { message?: string };
    };

    if (httpError.error?.message) {
      return httpError.error.message;
    }

    if (httpError.status === 400) {
      return 'A meghívó link lejárt vagy már fel lett használva.';
    }

    if (httpError.status === 401) {
      return 'A művelethez be kell jelentkezned.';
    }

    if (httpError.status === 403) {
      return 'Ezzel a fiókkal nem kezelheted ezt a meghívót.';
    }

    return 'A művelet nem sikerült. Próbáld újra később.';
  }
}
