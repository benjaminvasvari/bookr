import { AfterViewInit, Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CompaniesService } from '../../../../../core/services/companies.service';
import { AuthService } from '../../../../../core/services/auth.service';
import { Company } from '../../../../../core/models/company.model';
import { BusinessCategory } from '../../../../../core/models/business-category.model';

interface TemporaryClosingPeriod {
  startDate: string;
  endDate: string;
  reason: string;
}

interface CompanyProfile {
  companyName: string;
  description: string;
  category: string;
  website: string;
  ownerName: string;
  ownerRole: string;
  street: string;
  city: string;
  zipCode: string;
  country: string;
  phone: string;
  email: string;
}

interface GalleryImage {
  slotName: string;
  title: string;
  fileName: string;
  previewUrl: string | null;
}

interface GallerySettings {
  images: GalleryImage[];
}

interface BusinessRules {
  maxAdvanceBookingDays: number;
  cancellationDeadlineHours: number;
  sameDayMinimumHours: number;
  paymentMethod: string;
  currency: string;
}

interface CompanyApiData extends Partial<Company> {
  city?: string;
  postalCode?: string;
  country?: string;
  address?: string;
}

interface OpeningHour {
  day: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

type SectionType = 'company' | 'gallery' | 'rules' | 'hours';

@Component({
  selector: 'app-settings.component',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css'],
})
export class SettingsComponent implements AfterViewInit, OnInit {
  @ViewChild('hoursSection') hoursSection?: ElementRef<HTMLElement>;
  @ViewChild('closuresSection') closuresSection?: ElementRef<HTMLElement>;
  @ViewChild('closuresHeader') closuresHeader?: ElementRef<HTMLElement>;

  readonly paymentMethods = ['Helyszíni fizetés'];
  readonly currencies = ['HUF'];
  businessCategories: BusinessCategory[] = [];
  selectedCategoryId: number | null = null;
  selectedCategoryIdDraft: number | null = null;
  conflictedSection: SectionType | null = null;
  temporaryListMaxHeight = 430;

  editMode: Record<SectionType, boolean> = {
    company: false,
    gallery: false,
    rules: false,
    hours: false,
  };

  companyData: CompanyProfile = {
    companyName: 'Bookr Studio',
    description: 'Időpontfoglalásra optimalizált modern szalon, prémium szolgáltatásokkal.',
    category: 'Szépségipar',
    website: '',
    ownerName: 'Kiss Anna',
    ownerRole: 'Tulajdonos',
    street: 'Andrássy út 12.',
    city: 'Budapest',
    zipCode: '1061',
    country: 'Magyarország',
    phone: '+36 30 123 4567',
    email: 'info@bookr.hu',
  };

  companyDraft: CompanyProfile = this.clone(this.companyData);

  galleryData: GallerySettings = {
    images: [
      { slotName: 'Főkép', title: 'Főkép', fileName: '', previewUrl: null },
      { slotName: 'Kép 2', title: 'Kép 2', fileName: '', previewUrl: null },
      { slotName: 'Kép 3', title: 'Kép 3', fileName: '', previewUrl: null },
      { slotName: 'Kép 4', title: 'Kép 4', fileName: '', previewUrl: null },
    ],
  };

  galleryDraft: GallerySettings = this.clone(this.galleryData);

  businessRulesData: BusinessRules = {
    maxAdvanceBookingDays: 90,
    cancellationDeadlineHours: 24,
    sameDayMinimumHours: 2,
    paymentMethod: 'Helyszíni fizetés',
    currency: 'HUF',
  };

  businessRulesDraft: BusinessRules = this.clone(this.businessRulesData);

  openingHoursData: OpeningHour[] = [
    { day: 'Hétfő', isOpen: true, openTime: '09:00', closeTime: '17:00' },
    { day: 'Kedd', isOpen: true, openTime: '09:00', closeTime: '17:00' },
    { day: 'Szerda', isOpen: true, openTime: '09:00', closeTime: '17:00' },
    { day: 'Csütörtök', isOpen: true, openTime: '09:00', closeTime: '17:00' },
    { day: 'Péntek', isOpen: true, openTime: '09:00', closeTime: '17:00' },
    { day: 'Szombat', isOpen: false, openTime: '10:00', closeTime: '14:00' },
    { day: 'Vasárnap', isOpen: false, openTime: '10:00', closeTime: '14:00' },
  ];

  openingHoursDraft: OpeningHour[] = this.clone(this.openingHoursData);

  temporaryClosures: TemporaryClosingPeriod[] = [
    {
      startDate: '',
      endDate: '',
      reason: '',
    },
  ];

  constructor(
    private companiesService: CompaniesService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadBusinessCategories();
    this.loadCompanyInfo();
  }

  ngAfterViewInit(): void {
    this.scheduleTemporaryListHeightSync();
  }

  startEdit(section: SectionType): void {
    const activeSection = this.getActiveEditSection();

    if (activeSection && activeSection !== section) {
      this.conflictedSection = activeSection;
      return;
    }

    this.conflictedSection = null;

    if (section === 'company') {
      this.companyDraft = this.clone(this.companyData);
      this.selectedCategoryIdDraft = this.selectedCategoryId;
    }

    if (section === 'gallery') {
      this.galleryDraft = this.clone(this.galleryData);
    }

    if (section === 'rules') {
      this.businessRulesDraft = this.clone(this.businessRulesData);
    }

    if (section === 'hours') {
      this.openingHoursDraft = this.clone(this.openingHoursData);
    }

    this.editMode[section] = true;
  }

  canDeactivate(): boolean {
    const activeSection = this.getActiveEditSection();

    if (!activeSection) {
      return true;
    }

    this.conflictedSection = activeSection;
    return false;
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (!this.getActiveEditSection()) {
      return;
    }

    event.preventDefault();
    event.returnValue = true;
  }

  cancelEdit(section: SectionType): void {
    if (section === 'company') {
      this.selectedCategoryIdDraft = this.selectedCategoryId;
    }

    this.editMode[section] = false;
    this.conflictedSection = null;
  }

  saveEdit(section: SectionType): void {
    if (section === 'company') {
      this.selectedCategoryId = this.selectedCategoryIdDraft;
      this.companyDraft.category = this.getCategoryNameById(this.selectedCategoryId) || '';
      this.companyData = this.clone(this.companyDraft);
    }

    if (section === 'gallery') {
      this.galleryData = this.clone(this.galleryDraft);
    }

    if (section === 'rules') {
      this.businessRulesData = this.clone(this.businessRulesDraft);
    }

    if (section === 'hours') {
      this.openingHoursData = this.clone(this.openingHoursDraft);
    }

    this.editMode[section] = false;
    this.conflictedSection = null;
  }

  resetAll(): void {
    this.companyDraft = this.clone(this.companyData);
    this.galleryDraft = this.clone(this.galleryData);
    this.businessRulesDraft = this.clone(this.businessRulesData);
    this.openingHoursDraft = this.clone(this.openingHoursData);
    this.editMode = {
      company: false,
      gallery: false,
      rules: false,
      hours: false,
    };
    this.conflictedSection = null;
  }

  saveAllMock(): void {
    if (this.editMode.company) {
      this.saveEdit('company');
    }

    if (this.editMode.gallery) {
      this.saveEdit('gallery');
    }

    if (this.editMode.rules) {
      this.saveEdit('rules');
    }

    if (this.editMode.hours) {
      this.saveEdit('hours');
    }
  }

  addTemporaryClosure(): void {
    this.temporaryClosures.push({
      startDate: '',
      endDate: '',
      reason: '',
    });

    this.scheduleTemporaryListHeightSync();
  }

  removeTemporaryClosure(index: number): void {
    if (this.temporaryClosures.length === 1) {
      this.temporaryClosures[0] = {
        startDate: '',
        endDate: '',
        reason: '',
      };
      this.scheduleTemporaryListHeightSync();
      return;
    }

    this.temporaryClosures.splice(index, 1);
    this.scheduleTemporaryListHeightSync();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.scheduleTemporaryListHeightSync();
  }

  onGalleryFileSelected(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      this.galleryDraft.images[index].previewUrl = (loadEvent.target?.result as string) || null;
      this.galleryDraft.images[index].fileName = file.name;
    };
    reader.readAsDataURL(file);

    input.value = '';
  }

  clearGalleryImage(index: number): void {
    this.galleryDraft.images[index].previewUrl = null;
    this.galleryDraft.images[index].fileName = '';
  }

  private clone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value));
  }

  private scheduleTemporaryListHeightSync(): void {
    requestAnimationFrame(() => this.syncTemporaryListHeight());
  }

  private syncTemporaryListHeight(): void {
    const hoursElement = this.hoursSection?.nativeElement;
    const closuresElement = this.closuresSection?.nativeElement;
    const closuresHeaderElement = this.closuresHeader?.nativeElement;

    if (!hoursElement || !closuresElement || !closuresHeaderElement) {
      return;
    }

    const hoursHeight = hoursElement.getBoundingClientRect().height;
    const closuresStyles = window.getComputedStyle(closuresElement);
    const closuresPaddingTop = Number.parseFloat(closuresStyles.paddingTop) || 0;
    const closuresPaddingBottom = Number.parseFloat(closuresStyles.paddingBottom) || 0;
    const closuresGap = Number.parseFloat(closuresStyles.rowGap || closuresStyles.gap) || 0;
    const closuresHeaderHeight = closuresHeaderElement.getBoundingClientRect().height;

    const nextMaxHeight = hoursHeight - closuresPaddingTop - closuresPaddingBottom - closuresHeaderHeight - closuresGap;
    this.temporaryListMaxHeight = Math.max(180, Math.floor(nextMaxHeight));
  }

  private getActiveEditSection(): SectionType | null {
    if (this.editMode.company) {
      return 'company';
    }

    if (this.editMode.gallery) {
      return 'gallery';
    }

    if (this.editMode.rules) {
      return 'rules';
    }

    if (this.editMode.hours) {
      return 'hours';
    }

    return null;
  }

  private loadCompanyInfo(): void {
    const user = this.authService.getCurrentUser();
    const companyId = user?.companyId;

    if (!companyId) {
      return;
    }

    this.companiesService.getCompanyById(companyId).subscribe({
      next: (response) => {
        const company = this.unwrapCompanyResponse(response);
        this.companyData = {
          companyName: company.name?.trim() || this.companyData.companyName,
          description: company.description?.trim() || this.companyData.description,
          category: company.category?.trim() || '',
          website: company.website?.trim() ?? '',
          ownerName: this.getOwnerDisplayName(),
          ownerRole: this.companyData.ownerRole,
          street: company.addressDetails?.street?.trim() || company.address?.trim() || this.companyData.street,
          city: company.addressDetails?.city?.trim() || company.city?.trim() || this.companyData.city,
          zipCode: company.addressDetails?.postalCode?.trim() || company.postalCode?.trim() || this.companyData.zipCode,
          country: company.addressDetails?.country?.trim() || company.country?.trim() || this.companyData.country,
          phone: company.phone?.trim() || this.companyData.phone,
          email: company.email?.trim() || this.companyData.email,
        };

        this.selectedCategoryId = this.resolveCategoryId(company);
        this.selectedCategoryIdDraft = this.selectedCategoryId;

        const categoryName = this.getCategoryNameById(this.selectedCategoryId);
        if (categoryName) {
          this.companyData.category = categoryName;
        }

        this.companyDraft = this.clone(this.companyData);
      },
      error: (error) => {
        console.error('Nem sikerült betölteni a céginformációkat a beállítások oldalon:', error);
      },
    });
  }

  onCategoryDropdownChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const selectedId = Number.parseInt(selectElement.value, 10);
    this.selectedCategoryIdDraft = Number.isFinite(selectedId) ? selectedId : null;
    this.companyDraft.category = this.getCategoryNameById(this.selectedCategoryIdDraft) || '';
  }

  private loadBusinessCategories(): void {
    this.companiesService.getBusinessCategories().subscribe({
      next: (categories) => {
        this.businessCategories = categories;

        if (this.selectedCategoryId === null && this.companyData.category.trim()) {
          this.selectedCategoryId = this.resolveCategoryIdFromText(this.companyData.category);
          this.selectedCategoryIdDraft = this.selectedCategoryId;
        }

        const selectedName = this.getCategoryNameById(this.selectedCategoryId);
        if (selectedName) {
          this.companyData.category = selectedName;
          this.companyDraft.category = this.companyData.category;
        }
      },
      error: (error) => {
        console.error('Nem sikerült betölteni az üzleti kategóriákat:', error);
      },
    });
  }

  private resolveCategoryId(company: CompanyApiData): number | null {
    if (Number.isFinite(company.businessCategoryId)) {
      return company.businessCategoryId as number;
    }

    const categoryText = company.category?.trim() ?? '';
    if (!categoryText) {
      return null;
    }

    return this.resolveCategoryIdFromText(categoryText);
  }

  private getCategoryNameById(categoryId: number | null): string | null {
    if (categoryId === null || this.businessCategories.length === 0) {
      return null;
    }

    const category = this.businessCategories.find((item) => item.id === categoryId);
    return category?.name ?? null;
  }

  private resolveCategoryIdFromText(categoryText: string): number | null {
    if (!categoryText.trim() || this.businessCategories.length === 0) {
      return null;
    }

    const firstName = categoryText
      .split(',')
      .map((name) => name.trim())
      .find((name) => name.length > 0);

    if (!firstName) {
      return null;
    }

    const match = this.businessCategories.find(
      (category) => category.name.toLowerCase() === firstName.toLowerCase()
    );

    return match?.id ?? null;
  }

  private getOwnerDisplayName(): string {
    const user = this.authService.getCurrentUser();
    const firstName = user?.firstName?.trim() || '';
    const lastName = user?.lastName?.trim() || '';
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || this.companyData.ownerName;
  }

  private unwrapCompanyResponse(response: Company | { result?: CompanyApiData }): CompanyApiData {
    if (response && typeof response === 'object' && 'result' in response && response.result) {
      return response.result;
    }

    return response as CompanyApiData;
  }

}
