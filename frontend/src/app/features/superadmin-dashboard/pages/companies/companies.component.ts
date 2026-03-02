import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SuperadminService } from '../../../../core/services/superadmin.service';

@Component({
  selector: 'app-superadmin-companies',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './companies.component.html',
  styleUrls: ['./companies.component.css'],
})
export class SuperadminCompaniesComponent {
  constructor(private superadminService: SuperadminService) {}

  onCreateCompany(): void {
    this.superadminService.runAction('create-company');
  }

  onExportCompanies(): void {
    this.superadminService.runAction('export-companies');
  }

  onChangeOwner(company: string): void {
    this.superadminService.confirmAction(
      'change-owner',
      'Biztosan tulajdonost cserélsz ennél a cégnél?',
      company
    );
  }

  onViewStaff(company: string): void {
    this.superadminService.runAction('view-staff', company);
  }

  onSuspendCompany(company: string): void {
    this.superadminService.confirmAction(
      'suspend-company',
      'Biztosan letiltod ezt a céget?',
      company
    );
  }

  onOverrideRole(company: string): void {
    this.superadminService.confirmAction(
      'role-override',
      'Biztosan felül akarod írni a szerepkört?',
      company
    );
  }

  onViewBookings(company: string): void {
    this.superadminService.runAction('view-bookings', company);
  }

  onLockCompany(company: string): void {
    this.superadminService.confirmAction(
      'lock-company',
      'Biztosan zárolod ezt a céget?',
      company
    );
  }
}
