import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SuperadminService } from '../../../../core/services/superadmin.service';

@Component({
  selector: 'app-superadmin-owners',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './owners.component.html',
  styleUrls: ['./owners.component.css'],
})
export class SuperadminOwnersComponent {
  constructor(private superadminService: SuperadminService) {}

  onInviteOwner(): void {
    this.superadminService.runAction('invite-owner');
  }

  onAuditRoles(): void {
    this.superadminService.runAction('audit-roles');
  }

  onChangeOwner(ownerName: string): void {
    this.superadminService.confirmAction(
      'change-owner',
      'Biztosan tulajdonost cserélsz ennél a cégnél?',
      ownerName
    );
  }

  onViewStaff(company: string): void {
    this.superadminService.runAction('view-staff', company);
  }

  onDisableOwner(ownerName: string): void {
    this.superadminService.confirmAction(
      'disable-owner',
      'Biztosan letiltod ezt a tulajdonost?',
      ownerName
    );
  }
}
