import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SuperadminService } from '../../../../core/services/superadmin.service';
import { createBookrExportWorkbook } from '../../../../core/utils/bookr-export.util';

type CompanyFilter = 'all' | 'Aktív' | 'Felfüggesztett' | 'Új';
type CompanyPlan = 'Alap' | 'Pro' | 'Enterprise';
type CompanyStatus = 'Aktív' | 'Felfüggesztett' | 'Új';
type CompanyVerification = 'Hitelesített' | 'Függőben' | 'Vizsgálat alatt';

interface CompanyCard {
  name: string;
  city: string;
  email: string;
  owner: string;
  staffCount: number;
  bookingsToday: number;
  plan: CompanyPlan;
  status: CompanyStatus;
  verification: CompanyVerification;
  internalNote: string;
  lastAdminUpdate?: string;
}

interface CompanyEditDraft {
  owner: string;
  plan: CompanyPlan;
  status: CompanyStatus;
  verification: CompanyVerification;
  internalNote: string;
  changeReason: string;
}

type ExportFeedbackTone = 'success' | 'error' | 'info';

interface ExportFeedback {
  tone: ExportFeedbackTone;
  title: string;
  detail: string;
  meta?: string;
}

@Component({
  selector: 'app-superadmin-companies',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './companies.component.html',
  styleUrls: ['./companies.component.css'],
})
export class SuperadminCompaniesComponent implements OnDestroy {
  isCompanyActionModalOpen = false;
  isCompanyEditModalOpen = false;
  isExportingCompanies = false;
  hasRecentCompanyExport = false;
  selectedCompany = '';
  editingCompanyName = '';
  searchTerm = '';
  selectedFilter: CompanyFilter = 'all';
  companyEditDraft: CompanyEditDraft | null = null;
  companyExportFeedback: ExportFeedback | null = null;

  private exportSuccessTimeoutId: number | null = null;

  readonly filters: Array<{ value: CompanyFilter; label: string }> = [
    { value: 'all', label: 'Összes' },
    { value: 'Aktív', label: 'Aktív' },
    { value: 'Felfüggesztett', label: 'Felfüggesztett' },
    { value: 'Új', label: 'Új' },
  ];

  readonly planOptions: CompanyPlan[] = ['Alap', 'Pro', 'Enterprise'];
  readonly statusOptions: CompanyStatus[] = ['Aktív', 'Felfüggesztett', 'Új'];
  readonly verificationOptions: CompanyVerification[] = ['Hitelesített', 'Függőben', 'Vizsgálat alatt'];

  companies: CompanyCard[] = [
    {
      name: 'Glamour Studio Kft.',
      city: 'Budapest',
      email: 'jungle@jungle.hu',
      owner: 'Kiss Péter',
      staffCount: 12,
      bookingsToday: 8,
      plan: 'Pro',
      status: 'Aktív',
      verification: 'Hitelesített',
      internalNote: 'Kiemelt partner, stabil napi terheléssel.',
      lastAdminUpdate: '03.17. 14:10',
    },
    {
      name: 'NailBar Pécs',
      city: 'Pécs',
      email: 'hello@nailbarpecs.hu',
      owner: 'Nagy Anna',
      staffCount: 6,
      bookingsToday: 5,
      plan: 'Alap',
      status: 'Új',
      verification: 'Függőben',
      internalNote: 'Tulajdonosi hitelesítés még nem zárult le.',
      lastAdminUpdate: '03.18. 09:05',
    },
    {
      name: 'Relax Zone Győr',
      city: 'Győr',
      email: 'admin@relaxzone.hu',
      owner: 'Horváth Gábor',
      staffCount: 9,
      bookingsToday: 3,
      plan: 'Pro',
      status: 'Felfüggesztett',
      verification: 'Vizsgálat alatt',
      internalNote: 'Sikertelen auth események miatt manuális felülvizsgálat alatt.',
      lastAdminUpdate: '03.18. 08:42',
    },
    {
      name: 'Barber Hub Debrecen',
      city: 'Debrecen',
      email: 'office@barberhub.hu',
      owner: 'Bodnár Tamás',
      staffCount: 7,
      bookingsToday: 11,
      plan: 'Enterprise',
      status: 'Aktív',
      verification: 'Hitelesített',
      internalNote: 'Enterprise ügyfél, prioritásos supporttal.',
      lastAdminUpdate: '03.16. 16:25',
    },
    {
      name: 'Pure Skin Szalon',
      city: 'Szeged',
      email: 'kapcsolat@pureskin.hu',
      owner: 'Farkas Dóra',
      staffCount: 5,
      bookingsToday: 4,
      plan: 'Pro',
      status: 'Aktív',
      verification: 'Hitelesített',
      internalNote: 'Nincs nyitott admin feladat.',
      lastAdminUpdate: '03.15. 11:40',
    },
    {
      name: 'Color Bar Miskolc',
      city: 'Miskolc',
      email: 'info@colorbar.hu',
      owner: 'Tóth Balázs',
      staffCount: 10,
      bookingsToday: 7,
      plan: 'Alap',
      status: 'Új',
      verification: 'Függőben',
      internalNote: 'Staff jogosultságok véglegesítésre várnak.',
      lastAdminUpdate: '03.18. 10:15',
    },
  ];

  constructor(private superadminService: SuperadminService) {}

  ngOnDestroy(): void {
    this.clearExportSuccessTimer();
  }

  get exportButtonLabel(): string {
    if (this.isExportingCompanies) {
      return 'Exportálás...';
    }

    if (this.hasRecentCompanyExport) {
      return 'Letöltve';
    }

    return 'Tömeges export';
  }

  get filteredCompanies(): CompanyCard[] {
    const normalizedSearch = this.searchTerm.trim().toLocaleLowerCase();

    return this.companies.filter((company) => {
      const matchesFilter = this.selectedFilter === 'all' || company.status === this.selectedFilter;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        company.name.toLocaleLowerCase().includes(normalizedSearch) ||
        company.city.toLocaleLowerCase().includes(normalizedSearch);

      return matchesFilter && matchesSearch;
    });
  }

  setFilter(filter: CompanyFilter): void {
    this.selectedFilter = filter;
  }

  clearSearch(): void {
    this.searchTerm = '';
  }

  get canSaveCompanyEdit(): boolean {
    return Boolean(
      this.companyEditDraft &&
        this.companyEditDraft.owner.trim().length > 0 &&
        this.companyEditDraft.changeReason.trim().length > 0
    );
  }

  getStatusClass(status: CompanyStatus): string {
    if (status === 'Aktív') {
      return 'status-pill-active';
    }

    if (status === 'Felfüggesztett') {
      return 'status-pill-suspended';
    }

    return 'status-pill-new';
  }

  getPlanClass(plan: CompanyPlan): string {
    if (plan === 'Enterprise') {
      return 'plan-pill-enterprise';
    }

    if (plan === 'Pro') {
      return 'plan-pill-pro';
    }

    return 'plan-pill-basic';
  }

  getVerificationClass(verification: CompanyVerification): string {
    if (verification === 'Hitelesített') {
      return 'verification-pill-verified';
    }

    if (verification === 'Vizsgálat alatt') {
      return 'verification-pill-review';
    }

    return 'verification-pill-pending';
  }

  getStatusActionLabel(status: CompanyStatus): string {
    return status === 'Aktív' ? 'Felfüggesztés' : 'Aktiválás';
  }

  openCompanyEditModal(companyName: string): void {
    const company = this.companies.find((item) => item.name === companyName);

    if (!company) {
      return;
    }

    this.closeCompanyActionMenu();
    this.editingCompanyName = company.name;
    this.companyEditDraft = {
      owner: company.owner,
      plan: company.plan,
      status: company.status,
      verification: company.verification,
      internalNote: company.internalNote,
      changeReason: '',
    };
    this.isCompanyEditModalOpen = true;
  }

  closeCompanyEditModal(): void {
    this.isCompanyEditModalOpen = false;
    this.editingCompanyName = '';
    this.companyEditDraft = null;
  }

  saveCompanyEdit(): void {
    if (!this.companyEditDraft) {
      return;
    }

    const reason = this.companyEditDraft.changeReason.trim();
    const owner = this.companyEditDraft.owner.trim();

    if (!owner || !reason) {
      return;
    }

    const company = this.companies.find((item) => item.name === this.editingCompanyName);

    if (!company) {
      this.closeCompanyEditModal();
      return;
    }

    company.owner = owner;
    company.plan = this.companyEditDraft.plan;
    company.status = this.companyEditDraft.status;
    company.verification = this.companyEditDraft.verification;
    company.internalNote = this.companyEditDraft.internalNote.trim();
    company.lastAdminUpdate = this.formatAdminTimestamp();

    this.superadminService.runAction(
      'save-company-admin-edit',
      `${company.name} | ok: ${reason} | statusz: ${company.status} | csomag: ${company.plan}`
    );

    this.closeCompanyEditModal();
  }

  private formatAdminTimestamp(): string {
    return new Date().toLocaleString('hu-HU', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  openCompanyActionMenu(company: string): void {
    this.closeCompanyEditModal();
    this.selectedCompany = company;
    this.isCompanyActionModalOpen = true;
  }

  closeCompanyActionMenu(): void {
    this.isCompanyActionModalOpen = false;
    this.selectedCompany = '';
  }

  onCreateCompany(): void {
    this.superadminService.runAction('create-company');
  }

  async onExportCompanies(): Promise<void> {
    if (this.isExportingCompanies) {
      return;
    }

    const fileName = this.getExportFileName();

    const exportRows = this.filteredCompanies.map((company) => ({
      'Cég neve': company.name,
      Város: company.city,
      Email: company.email,
      Tulajdonos: company.owner,
      Staff: company.staffCount,
      'Foglalás ma': company.bookingsToday,
      Csomag: company.plan,
      Státusz: company.status,
      Verifikáció: company.verification,
      'Belső admin megjegyzés': company.internalNote,
      'Utolsó admin frissítés': company.lastAdminUpdate ?? '-',
    }));

    if (exportRows.length === 0) {
      this.showCompanyExportFeedback(
        'info',
        'Nincs exportálható adat',
        'Módosítsd a szűrőket vagy a keresést, és próbáld újra.'
      );
      return;
    }

    this.isExportingCompanies = true;

    try {
      const { workbook, XLSX } = await createBookrExportWorkbook({
        exportType: 'Cégek',
        source: 'Bookr weboldal / Superadmin / Cégek',
        dataSheetName: 'Cégek',
        rows: exportRows,
        filters: [
          ['Státusz szűrő', this.getActiveFilterLabel()],
          ['Keresés', this.searchTerm.trim() || 'nincs'],
        ],
      });

      XLSX.writeFile(workbook, fileName, { compression: true });
      this.markCompanyExportSuccess(exportRows.length, fileName);

      this.superadminService.runAction(
        'export-companies',
        `xlsx | db: ${exportRows.length} | szuro: ${this.getActiveFilterLabel()} | kereses: ${this.searchTerm.trim() || 'nincs'}`
      );
    } catch (error) {
      console.error('[Companies export] Excel export failed', error);
      this.showCompanyExportFeedback(
        'error',
        'Az export nem sikerült',
        'Az Excel fájl létrehozása most nem sikerült. Próbáld újra később.'
      );
    } finally {
      this.isExportingCompanies = false;
    }
  }

  closeCompanyExportFeedback(): void {
    this.companyExportFeedback = null;
  }

  private getActiveFilterLabel(): string {
    return this.filters.find((filter) => filter.value === this.selectedFilter)?.label ?? 'Összes';
  }

  private getExportFileName(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    return `cegek-export-${year}-${month}-${day}.xlsx`;
  }

  private markCompanyExportSuccess(exportedCount: number, fileName: string): void {
    this.hasRecentCompanyExport = true;
    this.clearExportSuccessTimer();
    this.exportSuccessTimeoutId = window.setTimeout(() => {
      this.hasRecentCompanyExport = false;
      this.exportSuccessTimeoutId = null;
    }, 2400);

    this.showCompanyExportFeedback(
      'success',
      'Excel export kész',
      `${exportedCount} cég exportálva. A letöltés elindult, a fájl a böngésző letöltései között érhető el.`,
      `Fájl: ${fileName} · A workbook tartalmaz egy letisztított Bookr forráslapot és export metaadatokat.`
    );
  }

  private showCompanyExportFeedback(
    tone: ExportFeedbackTone,
    title: string,
    detail: string,
    meta?: string
  ): void {
    this.companyExportFeedback = { tone, title, detail, meta };
  }

  private clearExportSuccessTimer(): void {
    if (this.exportSuccessTimeoutId !== null) {
      window.clearTimeout(this.exportSuccessTimeoutId);
      this.exportSuccessTimeoutId = null;
    }
  }

  onChangeOwner(company: string): void {
    this.closeCompanyActionMenu();
    this.superadminService.confirmAction(
      'change-owner',
      'Biztosan tulajdonost cserélsz ennél a cégnél?',
      company
    );
  }

  onViewStaff(company: string): void {
    this.superadminService.runAction('view-staff', company);
  }

  toggleCompanyStatus(companyName: string): void {
    const company = this.companies.find((item) => item.name === companyName);

    if (!company) {
      return;
    }

    const nextStatus: CompanyStatus = company.status === 'Aktív' ? 'Felfüggesztett' : 'Aktív';
    const prompt = nextStatus === 'Aktív' ? 'Biztosan aktiválod ezt a céget?' : 'Biztosan felfüggeszted ezt a céget?';

    if (!window.confirm(`${prompt}\n\nCél: ${company.name}`)) {
      return;
    }

    company.status = nextStatus;
    company.lastAdminUpdate = this.formatAdminTimestamp();
    this.superadminService.runAction('toggle-company-status', `${company.name} | uj-statusz: ${company.status}`);
  }

  onSuspendCompany(company: string): void {
    this.closeCompanyActionMenu();
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
    this.closeCompanyActionMenu();
    this.superadminService.confirmAction(
      'lock-company',
      'Biztosan zárolod ezt a céget?',
      company
    );
  }

  onFreezeBookings(company: string): void {
    this.closeCompanyActionMenu();
    this.superadminService.confirmAction(
      'freeze-company-bookings',
      'Biztosan befagyasztod a cég új foglalásait?',
      company
    );
  }

  onArchiveCompany(company: string): void {
    this.closeCompanyActionMenu();
    this.superadminService.confirmAction(
      'archive-company',
      'Biztosan archiválod a céget?',
      company
    );
  }

  onDisableCompany(company: string): void {
    this.closeCompanyActionMenu();
    this.superadminService.confirmAction(
      'disable-company-permanently',
      'Biztosan véglegesen letiltod ezt a céget?',
      company
    );
  }

  onDeleteCompany(company: string): void {
    this.closeCompanyActionMenu();
    this.superadminService.confirmAction(
      'delete-company',
      'Biztosan törlöd ezt a céget? Ez a művelet nem vonható vissza.',
      company
    );
  }
}
