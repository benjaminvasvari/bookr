import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SuperadminService } from '../../../../core/services/superadmin.service';

type OwnerStatus = 'Aktív' | 'Figyelmeztetett' | 'Felfüggesztett';
type OwnerVerification = 'Hitelesített' | 'Függőben' | 'Biztonsági review';
type OwnerAccess = 'Teljes hozzáférés' | 'Korlátozott admin' | 'Megfigyelés alatt';

interface OwnerCard {
  name: string;
  email: string;
  company: string;
  companiesManaged: number;
  staffCount: number;
  status: OwnerStatus;
  verification: OwnerVerification;
  access: OwnerAccess;
  internalNote: string;
  lastAdminUpdate?: string;
}

interface OwnerEditDraft {
  company: string;
  status: OwnerStatus;
  verification: OwnerVerification;
  access: OwnerAccess;
  internalNote: string;
  changeReason: string;
}

@Component({
  selector: 'app-superadmin-owners',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './owners.component.html',
  styleUrls: ['./owners.component.css'],
})
export class SuperadminOwnersComponent {
  isOwnerActionModalOpen = false;
  isOwnerEditModalOpen = false;
  selectedOwner = '';
  selectedOwnerCompany = '';
  editingOwnerName = '';
  ownerEditDraft: OwnerEditDraft | null = null;

  readonly statusOptions: OwnerStatus[] = ['Aktív', 'Figyelmeztetett', 'Felfüggesztett'];
  readonly verificationOptions: OwnerVerification[] = ['Hitelesített', 'Függőben', 'Biztonsági review'];
  readonly accessOptions: OwnerAccess[] = ['Teljes hozzáférés', 'Korlátozott admin', 'Megfigyelés alatt'];

  owners: OwnerCard[] = [
    {
      name: 'Kiss Péter',
      email: 'peter.kiss@glamourstudio.hu',
      company: 'Glamour Studio Kft.',
      companiesManaged: 2,
      staffCount: 12,
      status: 'Aktív',
      verification: 'Hitelesített',
      access: 'Teljes hozzáférés',
      internalNote: 'Több telephelyet kezel, stabil compliance státusszal.',
      lastAdminUpdate: '03.17. 13:30',
    },
    {
      name: 'Nagy Anna',
      email: 'anna.nagy@nailbarpecs.hu',
      company: 'NailBar Pécs',
      companiesManaged: 1,
      staffCount: 6,
      status: 'Figyelmeztetett',
      verification: 'Függőben',
      access: 'Megfigyelés alatt',
      internalNote: 'E-mail hitelesítés lezárására vár.',
      lastAdminUpdate: '03.18. 09:12',
    },
    {
      name: 'Horváth Gábor',
      email: 'gabor.horvath@relaxzone.hu',
      company: 'Relax Zone Győr',
      companiesManaged: 3,
      staffCount: 18,
      status: 'Felfüggesztett',
      verification: 'Biztonsági review',
      access: 'Korlátozott admin',
      internalNote: 'Auth anomália után csak korlátozott műveletek engedettek.',
      lastAdminUpdate: '03.18. 08:08',
    },
    {
      name: 'Farkas Dóra',
      email: 'dora.farkas@pureskin.hu',
      company: 'Pure Skin Szalon',
      companiesManaged: 1,
      staffCount: 5,
      status: 'Aktív',
      verification: 'Hitelesített',
      access: 'Teljes hozzáférés',
      internalNote: 'Nincs nyitott admin teendő.',
      lastAdminUpdate: '03.15. 10:40',
    },
  ];

  constructor(private superadminService: SuperadminService) {}

  get canSaveOwnerEdit(): boolean {
    return Boolean(
      this.ownerEditDraft &&
        this.ownerEditDraft.company.trim().length > 0 &&
        this.ownerEditDraft.changeReason.trim().length > 0
    );
  }

  getStatusClass(status: OwnerStatus): string {
    if (status === 'Aktív') {
      return 'status-pill-active';
    }

    if (status === 'Felfüggesztett') {
      return 'status-pill-suspended';
    }

    return 'status-pill-warning';
  }

  getVerificationClass(verification: OwnerVerification): string {
    if (verification === 'Hitelesített') {
      return 'verification-pill-verified';
    }

    if (verification === 'Biztonsági review') {
      return 'verification-pill-review';
    }

    return 'verification-pill-pending';
  }

  getAccessClass(access: OwnerAccess): string {
    if (access === 'Teljes hozzáférés') {
      return 'access-pill-full';
    }

    if (access === 'Korlátozott admin') {
      return 'access-pill-limited';
    }

    return 'access-pill-watch';
  }

  openOwnerEditModal(ownerName: string): void {
    const owner = this.owners.find((item) => item.name === ownerName);

    if (!owner) {
      return;
    }

    this.closeOwnerActionMenu();
    this.editingOwnerName = owner.name;
    this.ownerEditDraft = {
      company: owner.company,
      status: owner.status,
      verification: owner.verification,
      access: owner.access,
      internalNote: owner.internalNote,
      changeReason: '',
    };
    this.isOwnerEditModalOpen = true;
  }

  closeOwnerEditModal(): void {
    this.isOwnerEditModalOpen = false;
    this.editingOwnerName = '';
    this.ownerEditDraft = null;
  }

  saveOwnerEdit(): void {
    if (!this.ownerEditDraft) {
      return;
    }

    const reason = this.ownerEditDraft.changeReason.trim();
    const company = this.ownerEditDraft.company.trim();

    if (!reason || !company) {
      return;
    }

    const owner = this.owners.find((item) => item.name === this.editingOwnerName);

    if (!owner) {
      this.closeOwnerEditModal();
      return;
    }

    owner.company = company;
    owner.status = this.ownerEditDraft.status;
    owner.verification = this.ownerEditDraft.verification;
    owner.access = this.ownerEditDraft.access;
    owner.internalNote = this.ownerEditDraft.internalNote.trim();
    owner.lastAdminUpdate = this.formatAdminTimestamp();

    this.superadminService.runAction(
      'save-owner-admin-edit',
      `${owner.name} | ok: ${reason} | statusz: ${owner.status} | access: ${owner.access}`
    );

    this.closeOwnerEditModal();
  }

  private formatAdminTimestamp(): string {
    return new Date().toLocaleString('hu-HU', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  openOwnerActionMenu(ownerName: string, companyName: string): void {
    this.closeOwnerEditModal();
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
