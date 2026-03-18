import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SuperadminService } from '../../../../core/services/superadmin.service';

@Component({
  selector: 'app-superadmin-staff',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './staff.component.html',
  styleUrls: ['./staff.component.css'],
})
export class SuperadminStaffComponent {
  isStaffActionModalOpen = false;
  selectedStaff = '';

  constructor(private superadminService: SuperadminService) {}

  openStaffActionMenu(staffName: string): void {
    this.selectedStaff = staffName;
    this.isStaffActionModalOpen = true;
  }

  closeStaffActionMenu(): void {
    this.isStaffActionModalOpen = false;
    this.selectedStaff = '';
  }

  onAddStaff(): void {
    this.superadminService.runAction('add-staff');
  }

  onBulkRoleUpdate(): void {
    this.superadminService.runAction('bulk-role-update');
  }

  onChangeRole(staffName: string): void {
    this.superadminService.confirmAction(
      'change-role',
      'Biztosan szerepkört cserélsz ennél a felhasználónál?',
      staffName
    );
  }

  onChangeCompany(staffName: string): void {
    this.superadminService.confirmAction(
      'change-company',
      'Biztosan céget cserélsz ennél a felhasználónál?',
      staffName
    );
  }

  onDisableStaff(staffName: string): void {
    this.closeStaffActionMenu();
    this.superadminService.confirmAction(
      'disable-staff',
      'Biztosan letiltod ezt a staff tagot?',
      staffName
    );
  }

  onSuspendStaff(staffName: string): void {
    this.closeStaffActionMenu();
    this.superadminService.confirmAction(
      'suspend-staff',
      'Biztosan ideiglenesen felfüggeszted ezt a staff tagot?',
      staffName
    );
  }

  onRestrictStaffPermissions(staffName: string): void {
    this.closeStaffActionMenu();
    this.superadminService.confirmAction(
      'restrict-staff-permissions',
      'Biztosan korlátozod a staff felhasználó jogosultságait?',
      staffName
    );
  }

  onForcePasswordReset(staffName: string): void {
    this.closeStaffActionMenu();
    this.superadminService.confirmAction(
      'force-staff-password-reset',
      'Biztosan jelszócserét kényszerítesz ennél a staff felhasználónál?',
      staffName
    );
  }

  onAuditStaffActivity(staffName: string): void {
    this.closeStaffActionMenu();
    this.superadminService.runAction('audit-staff-activity', staffName);
  }
}
