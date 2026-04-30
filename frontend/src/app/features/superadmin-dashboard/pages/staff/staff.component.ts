import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SuperadminService } from '../../../../core/services/superadmin.service';

type StaffRole = 'Staff' | 'Senior Staff' | 'Manager';
type StaffStatus = 'Aktív' | 'Függőben' | 'Felfüggesztett';
type StaffVerification = 'Hitelesített' | 'Függőben' | 'Jelszócsere szükséges';
type StaffPermission = 'Standard' | 'Korlátozott' | 'Kiemelt';
type StaffStatusFilter = 'all' | StaffStatus;

interface StaffCard {
  name: string;
  email: string;
  company: string;
  role: StaffRole;
  status: StaffStatus;
  verification: StaffVerification;
  permission: StaffPermission;
  bookingsToday: number;
  internalNote: string;
  lastAdminUpdate?: string;
}

interface StaffEditDraft {
  company: string;
  role: StaffRole;
  status: StaffStatus;
  verification: StaffVerification;
  permission: StaffPermission;
  internalNote: string;
  changeReason: string;
}

@Component({
  selector: 'app-superadmin-staff',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './staff.component.html',
  styleUrls: ['./staff.component.css'],
})
export class SuperadminStaffComponent {
  isStaffActionModalOpen = false;
  isStaffEditModalOpen = false;
  selectedStaff = '';
  editingStaffName = '';
  searchTerm = '';
  selectedCompanyFilter = 'all';
  selectedStatusFilter: StaffStatusFilter = 'all';
  staffEditDraft: StaffEditDraft | null = null;

  readonly roleOptions: StaffRole[] = ['Staff', 'Senior Staff', 'Manager'];
  readonly statusOptions: StaffStatus[] = ['Aktív', 'Függőben', 'Felfüggesztett'];
  readonly verificationOptions: StaffVerification[] = ['Hitelesített', 'Függőben', 'Jelszócsere szükséges'];
  readonly permissionOptions: StaffPermission[] = ['Standard', 'Korlátozott', 'Kiemelt'];
  readonly statusFilters: Array<{ value: StaffStatusFilter; label: string }> = [
    { value: 'all', label: 'Összes' },
    { value: 'Aktív', label: 'Aktív' },
    { value: 'Függőben', label: 'Függőben' },
    { value: 'Felfüggesztett', label: 'Felfüggesztett' },
  ];

  staffMembers: StaffCard[] = [
    {
      name: 'Kovács Éva',
      email: 'eva.kovacs@glamourstudio.hu',
      company: 'Glamour Studio Kft.',
      role: 'Senior Staff',
      status: 'Aktív',
      verification: 'Hitelesített',
      permission: 'Kiemelt',
      bookingsToday: 7,
      internalNote: 'Műszakvezető jogosultság, kiemelt foglalási forgalom.',
      lastAdminUpdate: '03.18. 08:20',
    },
    {
      name: 'Tóth Balázs',
      email: 'balazs.toth@nailbarpecs.hu',
      company: 'NailBar Pécs',
      role: 'Staff',
      status: 'Függőben',
      verification: 'Függőben',
      permission: 'Standard',
      bookingsToday: 2,
      internalNote: 'Cég-hozzárendelés jóváhagyásra vár.',
      lastAdminUpdate: '03.18. 09:40',
    },
    {
      name: 'Varga Réka',
      email: 'reka.varga@relaxzone.hu',
      company: 'Relax Zone Győr',
      role: 'Manager',
      status: 'Felfüggesztett',
      verification: 'Jelszócsere szükséges',
      permission: 'Korlátozott',
      bookingsToday: 0,
      internalNote: 'Auth esemény miatt ideiglenesen korlátozott.',
      lastAdminUpdate: '03.18. 07:55',
    },
    {
      name: 'Lakatos Márk',
      email: 'mark.lakatos@barberhub.hu',
      company: 'Barber Hub Debrecen',
      role: 'Staff',
      status: 'Aktív',
      verification: 'Hitelesített',
      permission: 'Standard',
      bookingsToday: 5,
      internalNote: 'Stabil teljesítmény, nincs nyitott admin feladat.',
      lastAdminUpdate: '03.16. 15:10',
    },
  ];

  constructor(private superadminService: SuperadminService) {}

  get companyOptions(): string[] {
    return ['all', ...new Set(this.staffMembers.map((staff) => staff.company))];
  }

  get filteredStaffMembers(): StaffCard[] {
    const normalizedSearch = this.searchTerm.trim().toLocaleLowerCase();

    return this.staffMembers.filter((staff) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        staff.name.toLocaleLowerCase().includes(normalizedSearch) ||
        staff.email.toLocaleLowerCase().includes(normalizedSearch) ||
        staff.company.toLocaleLowerCase().includes(normalizedSearch);
      const matchesCompany = this.selectedCompanyFilter === 'all' || staff.company === this.selectedCompanyFilter;
      const matchesStatus = this.selectedStatusFilter === 'all' || staff.status === this.selectedStatusFilter;

      return matchesSearch && matchesCompany && matchesStatus;
    });
  }

  get canSaveStaffEdit(): boolean {
    return Boolean(
      this.staffEditDraft &&
        this.staffEditDraft.company.trim().length > 0 &&
        this.staffEditDraft.changeReason.trim().length > 0
    );
  }

  getStatusClass(status: StaffStatus): string {
    if (status === 'Aktív') {
      return 'status-pill-active';
    }

    if (status === 'Felfüggesztett') {
      return 'status-pill-suspended';
    }

    return 'status-pill-pending';
  }

  getRoleClass(role: StaffRole): string {
    if (role === 'Manager') {
      return 'role-pill-manager';
    }

    if (role === 'Senior Staff') {
      return 'role-pill-senior';
    }

    return 'role-pill-staff';
  }

  getVerificationClass(verification: StaffVerification): string {
    if (verification === 'Hitelesített') {
      return 'verification-pill-verified';
    }

    if (verification === 'Jelszócsere szükséges') {
      return 'verification-pill-review';
    }

    return 'verification-pill-pending';
  }

  getPermissionClass(permission: StaffPermission): string {
    if (permission === 'Kiemelt') {
      return 'permission-pill-priority';
    }

    if (permission === 'Korlátozott') {
      return 'permission-pill-restricted';
    }

    return 'permission-pill-standard';
  }

  getStatusActionLabel(status: StaffStatus): string {
    return status === 'Aktív' ? 'Felfüggesztés' : 'Aktiválás';
  }

  setStatusFilter(filter: StaffStatusFilter): void {
    this.selectedStatusFilter = filter;
  }

  clearSearch(): void {
    this.searchTerm = '';
  }

  openStaffEditModal(staffName: string): void {
    const staff = this.staffMembers.find((item) => item.name === staffName);

    if (!staff) {
      return;
    }

    this.closeStaffActionMenu();
    this.editingStaffName = staff.name;
    this.staffEditDraft = {
      company: staff.company,
      role: staff.role,
      status: staff.status,
      verification: staff.verification,
      permission: staff.permission,
      internalNote: staff.internalNote,
      changeReason: '',
    };
    this.isStaffEditModalOpen = true;
  }

  closeStaffEditModal(): void {
    this.isStaffEditModalOpen = false;
    this.editingStaffName = '';
    this.staffEditDraft = null;
  }

  saveStaffEdit(): void {
    if (!this.staffEditDraft) {
      return;
    }

    const reason = this.staffEditDraft.changeReason.trim();
    const company = this.staffEditDraft.company.trim();

    if (!reason || !company) {
      return;
    }

    const staff = this.staffMembers.find((item) => item.name === this.editingStaffName);

    if (!staff) {
      this.closeStaffEditModal();
      return;
    }

    staff.company = company;
    staff.role = this.staffEditDraft.role;
    staff.status = this.staffEditDraft.status;
    staff.verification = this.staffEditDraft.verification;
    staff.permission = this.staffEditDraft.permission;
    staff.internalNote = this.staffEditDraft.internalNote.trim();
    staff.lastAdminUpdate = this.formatAdminTimestamp();

    this.superadminService.runAction(
      'save-staff-admin-edit',
      `${staff.name} | ok: ${reason} | statusz: ${staff.status} | szerep: ${staff.role}`
    );

    this.closeStaffEditModal();
  }

  private formatAdminTimestamp(): string {
    return new Date().toLocaleString('hu-HU', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  openStaffActionMenu(staffName: string): void {
    this.closeStaffEditModal();
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

  onReviewPendingStaff(): void {
    this.selectedStatusFilter = 'Függőben';
  }

  toggleStaffStatus(staffName: string): void {
    const staff = this.staffMembers.find((item) => item.name === staffName);

    if (!staff) {
      return;
    }

    const nextStatus: StaffStatus = staff.status === 'Aktív' ? 'Felfüggesztett' : 'Aktív';
    const prompt = nextStatus === 'Aktív' ? 'Biztosan aktiválod ezt a staff tagot?' : 'Biztosan felfüggeszted ezt a staff tagot?';

    if (!window.confirm(`${prompt}\n\nCél: ${staff.name}`)) {
      return;
    }

    staff.status = nextStatus;
    staff.lastAdminUpdate = this.formatAdminTimestamp();
    this.superadminService.runAction('toggle-staff-status', `${staff.name} | uj-statusz: ${staff.status}`);
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
    if (this.isStaffActionModalOpen) {
      this.closeStaffActionMenu();
    }
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

  onDeleteStaff(staffName: string): void {
    this.closeStaffActionMenu();
    this.superadminService.confirmAction(
      'delete-staff',
      'Biztosan törlöd ezt a staff felhasználót? Ez a művelet nem vonható vissza.',
      staffName
    );
  }
}
