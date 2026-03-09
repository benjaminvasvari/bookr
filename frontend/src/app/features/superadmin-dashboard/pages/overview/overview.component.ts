import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SuperadminService } from '../../../../core/services/superadmin.service';

@Component({
  selector: 'app-superadmin-overview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.css'],
})
export class SuperadminOverviewComponent {
  constructor(private superadminService: SuperadminService) {}

  onCreateCompany(): void {
    this.superadminService.runAction('create-company');
  }

  onExportLogs(): void {
    this.superadminService.runAction('export-logs');
  }

  onRoleOverride(): void {
    this.superadminService.confirmAction(
      'role-override',
      'Biztosan felül akarod írni a szerepkört?'
    );
  }

  onSuspendCompany(): void {
    this.superadminService.confirmAction(
      'suspend-company',
      'Biztosan letiltod a céget?'
    );
  }

  onChangeOwner(): void {
    this.superadminService.confirmAction(
      'change-owner',
      'Biztosan átadod a cég tulajdonosát?'
    );
  }

  onMoveStaff(): void {
    this.superadminService.confirmAction(
      'move-staff',
      'Biztosan áthelyezed a staff tagot?'
    );
  }

  onAuditLock(): void {
    this.superadminService.confirmAction(
      'audit-lock',
      'Biztosan zárolod audit módban?'
    );
  }

  onOpenEvents(): void {
    this.superadminService.runAction('open-events');
  }

  onViewCompanies(): void {
    this.superadminService.runAction('view-companies');
  }

  onViewLogs(): void {
    this.superadminService.runAction('view-logs');
  }

  onViewCriticalBookings(): void {
    this.superadminService.runAction('view-critical-bookings');
  }
}
