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
  isOwnerActionModalOpen = false;
  selectedOwner = '';
  selectedOwnerCompany = '';

  constructor(private superadminService: SuperadminService) {}

  openOwnerActionMenu(ownerName: string, companyName: string): void {
    this.selectedOwner = ownerName;
    this.selectedOwnerCompany = companyName;
    this.isOwnerActionModalOpen = true;
  }

  closeOwnerActionMenu(): void {
    this.isOwnerActionModalOpen = false;
    this.selectedOwner = '';
    this.selectedOwnerCompany = '';
  }

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
    this.closeOwnerActionMenu();
    this.superadminService.confirmAction(
      'disable-owner',
      'Biztosan letiltod ezt a tulajdonost?',
      ownerName
    );
  }

  onSuspendOwner(ownerName: string): void {
    this.closeOwnerActionMenu();
    this.superadminService.confirmAction(
      'suspend-owner',
      'Biztosan ideiglenesen felfüggeszted ezt a tulajdonost?',
      ownerName
    );
  }

  onRevokeOwnerAccess(ownerName: string): void {
    this.closeOwnerActionMenu();
    this.superadminService.confirmAction(
      'revoke-owner-access',
      'Biztosan visszavonod a tulajdonosi jogosultságokat?',
      ownerName
    );
  }

  onForceOwnerSecurityReview(ownerName: string): void {
    this.closeOwnerActionMenu();
    this.superadminService.runAction('owner-security-review', ownerName);
  }

  onTransferOwnerAssets(ownerName: string, companyName: string): void {
    this.closeOwnerActionMenu();
    this.superadminService.confirmAction(
      'transfer-owner-assets',
      'Biztosan átadod a tulajdonoshoz tartozó eszközöket?',
      `${ownerName} (${companyName})`
    );
  }
}
