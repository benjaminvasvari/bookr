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
  constructor(private superadminService: SuperadminService) {}

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
    this.superadminService.confirmAction(
      'disable-staff',
      'Biztosan letiltod ezt a staff tagot?',
      staffName
    );
  }
}
