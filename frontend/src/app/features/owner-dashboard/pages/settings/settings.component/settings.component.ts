import { AfterViewInit, Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CompaniesService, CompanyImage, TemporaryClosedPeriod, UpdateCompanyRequest } from '../../../../../core/services/companies.service';
import { forkJoin, of } from 'rxjs';
import { AuthService } from '../../../../../core/services/auth.service';
import { Company } from '../../../../../core/models/company.model';
import { BusinessCategory } from '../../../../../core/models/business-category.model';
import { OpeningHours } from '../../../../../core/models/opening-hours.model';
import { environment } from '../../../../../../environments/environment';

interface TemporaryClosingPeriod {
  id?: number;
  startDate: string;
  endDate: string;
  isAllDay: boolean;
  startTime: string;
  endTime: string;
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
  sameDayMinimumHours: number | null;
  paymentMethod: string;
  currency: string;
}

interface CompanyBookingRules {
  cancellationHours?: number | null;
  minimumBookingHoursAhead?: number | null;
  bookingAdvanceDays?: number | null;
}

interface CompanyBookingRulesUpdatePayload {
  bookingAdvanceDays: number;
  cancellationHours: number;
  minimumBookingHoursAhead: number | null;
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

type OpeningHourApiDay = keyof OpeningHours;
type OpeningHoursUpdatePayload = { openingHours: Record<OpeningHourApiDay, string> };

type SectionType = 'company' | 'gallery' | 'rules' | 'hours' | 'closures';

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
  @ViewChild('closuresFeedback') closuresFeedback?: ElementRef<HTMLElement>;
  @ViewChild('companyDescriptionTextarea') companyDescriptionTextarea?: ElementRef<HTMLTextAreaElement>;

  readonly paymentMethods = ['Helyszíni fizetés'];
  readonly currencies = ['HUF'];
  readonly availableCountries = ['Magyarország'];
  businessCategories: BusinessCategory[] = [];
  selectedCategoryId: number | null = null;
  selectedCategoryIdDraft: number | null = null;
  conflictedSection: SectionType | null = null;
  temporaryListMaxHeight = 430;
  isImagePreviewOpen = false;
  imagePreviewUrl: string | null = null;
  private companyMainImageUrl: string | null = null;
  private companyGalleryApiImages: CompanyImage[] = [];
  private lastSameDayMinimumHours = 2;
  private readonly temporaryClosuresStorageKey = 'ownerSettingsTemporaryClosures';
  private temporaryClosuresSavedSnapshot = '';
  private removedTemporaryClosureIds: number[] = [];
  private lastAutofilledCompanyCity: string | null = null;
  private readonly postalCodeCityHints: Record<string, string> = {
    '1052': 'Budapest',
    '3525': 'Miskolc',
    '4024': 'Debrecen',
    '4400': 'Nyíregyháza',
    '5000': 'Szolnok',
    '6000': 'Kecskemét',
    '6720': 'Szeged',
    '7621': 'Pécs',
    '7628': 'Pécs',
    '8000': 'Székesfehérvár',
    '9021': 'Győr',
  };
  private readonly openingHoursOrder: Array<{ day: OpeningHourApiDay; label: string }> = [
    { day: 'monday', label: 'Hétfő' },
    { day: 'tuesday', label: 'Kedd' },
    { day: 'wednesday', label: 'Szerda' },
    { day: 'thursday', label: 'Csütörtök' },
    { day: 'friday', label: 'Péntek' },
    { day: 'saturday', label: 'Szombat' },
    { day: 'sunday', label: 'Vasárnap' },
  ];

  editMode: Record<SectionType, boolean> = {
    company: false,
    gallery: false,
    rules: false,
    hours: false,
    closures: false,
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
    this.getDefaultTemporaryClosure(),
  ];
  temporaryClosuresSaveState: 'idle' | 'saving' | 'success' | 'error' = 'idle';
  temporaryClosuresSaveMessage = '';
  showTemporaryClosuresUnsavedWarning = false;
  companyValidationMessage = '';
  isCompanySaving = false;
  showCompanyFieldErrors = false;

  get isCompanyEmailInvalid(): boolean {
    return this.showCompanyFieldErrors && !this.isValidEmail(this.companyDraft.email);
  }

  get isCompanyPhoneInvalid(): boolean {
    return this.showCompanyFieldErrors && !this.isValidHungarianPhone(this.companyDraft.phone);
  }

  get isCompanyWebsiteInvalid(): boolean {
    return this.showCompanyFieldErrors && !this.isValidWebsite(this.companyDraft.website);
  }

  get hasTemporaryClosuresUnsavedChanges(): boolean {
    return this.getTemporaryClosuresSnapshot(this.temporaryClosures) !== this.temporaryClosuresSavedSnapshot;
  }

  get temporaryClosureMinDate(): string {
    return this.getTodayDateString();
  }

  getTemporaryClosureEndMinDate(period: TemporaryClosingPeriod): string {
    const today = this.getTodayDateString();
    const startDate = period.startDate?.trim() ?? '';

    if (!startDate) {
      return today;
    }

    return startDate > today ? startDate : today;
  }

  isTemporaryDateInPast(value: string): boolean {
    const normalized = value?.trim() ?? '';

    if (!normalized) {
      return false;
    }

    return normalized < this.getTodayDateString();
  }

  isTemporaryDateRangeInvalid(period: TemporaryClosingPeriod): boolean {
    const startDate = period.startDate?.trim() ?? '';
    const endDate = period.endDate?.trim() ?? '';

    if (!startDate || !endDate) {
      return false;
    }

    return endDate < startDate;
  }

  constructor(
    private companiesService: CompaniesService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadBusinessCategories();
    this.loadCompanyInfo();
    this.loadCompanyImages();
    this.loadOpeningHours();
    this.loadBookingRules();
    this.loadTemporaryClosures();
  }

  ngAfterViewInit(): void {
    this.scheduleTemporaryListHeightSync();
  }

  startEdit(section: SectionType): void {
    if (section !== 'closures' && this.hasTemporaryClosuresUnsavedChanges) {
      this.conflictedSection = 'closures';
      this.showTemporaryClosuresUnsavedWarning = true;
      this.scheduleTemporaryListHeightSync();
      return;
    }

    const activeSection = this.getActiveEditSection();

    if (activeSection && activeSection !== section) {
      this.conflictedSection = activeSection;
      return;
    }

    this.conflictedSection = null;

    if (section === 'company') {
      this.companyDraft = this.clone(this.companyData);
      this.companyDraft.country = this.normalizeCountryToSupported(this.companyDraft.country);
      this.selectedCategoryIdDraft = this.selectedCategoryId;
      this.companyValidationMessage = '';
      this.showCompanyFieldErrors = false;
      requestAnimationFrame(() => {
        this.syncCompanyDescriptionTextareaMinHeight(this.companyDescriptionTextarea?.nativeElement);
      });
    }

    if (section === 'gallery') {
      this.galleryDraft = this.clone(this.galleryData);
    }

    if (section === 'rules') {
      this.businessRulesDraft = this.clone(this.businessRulesData);
      this.lastSameDayMinimumHours = this.businessRulesDraft.sameDayMinimumHours ?? this.lastSameDayMinimumHours;
    }

    if (section === 'hours') {
      this.openingHoursDraft = this.clone(this.openingHoursData);
    }

    this.editMode[section] = true;
  }

  canDeactivate(): boolean {
    const activeSection = this.getActiveEditSection();

    if (activeSection) {
      this.conflictedSection = activeSection;
      return false;
    }

    if (this.hasTemporaryClosuresUnsavedChanges) {
      this.showTemporaryClosuresUnsavedWarning = true;
      this.scheduleTemporaryListHeightSync();
      return false;
    }

    return true;
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    const hasSectionEdit = Boolean(this.getActiveEditSection());

    if (!hasSectionEdit && !this.hasTemporaryClosuresUnsavedChanges) {
      return;
    }

    event.preventDefault();
    event.returnValue = true;
  }

  cancelEdit(section: SectionType): void {
    if (section === 'company') {
      this.selectedCategoryIdDraft = this.selectedCategoryId;
      this.companyValidationMessage = '';
      this.showCompanyFieldErrors = false;
    }

    this.editMode[section] = false;
    this.conflictedSection = null;
  }

  saveEdit(section: SectionType): void {
    if (section === 'company') {
      const validationMessage = this.validateCompanyDraft(this.companyDraft);

      if (validationMessage) {
        this.companyValidationMessage = validationMessage;
        this.showCompanyFieldErrors = true;
        return;
      }

      this.submitCompanyUpdate();
      return;
    }

    if (section === 'gallery') {
      this.galleryData = this.clone(this.galleryDraft);
    }

    if (section === 'rules') {
      this.saveBookingRules();
      return;
    }

    if (section === 'hours') {
      this.saveOpeningHours();
      return;
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
      closures: false,
    };
    this.conflictedSection = null;
    this.companyValidationMessage = '';
    this.showCompanyFieldErrors = false;
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

  formatCompanyPhone(value: string): string {
    const trimmedValue = value?.trim() ?? '';

    if (!trimmedValue) {
      return '';
    }

    const digits = trimmedValue.replace(/\D/g, '');

    if (digits.startsWith('36') && digits.length === 11) {
      return `+36 ${digits.slice(2, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
    }

    if (digits.startsWith('06') && digits.length === 11) {
      return `+36 ${digits.slice(2, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
    }

    if (digits.startsWith('0036') && digits.length === 13) {
      return `+36 ${digits.slice(4, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`;
    }

    if (digits.length === 9) {
      return `+36 ${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
    }

    return trimmedValue;
  }

  onCompanyDescriptionInput(textarea: HTMLTextAreaElement): void {
    this.syncCompanyDescriptionTextareaMinHeight(textarea);
  }

  onCompanyDescriptionResize(textarea: HTMLTextAreaElement): void {
    this.syncCompanyDescriptionTextareaMinHeight(textarea);
  }

  private validateCompanyDraft(companyDraft: CompanyProfile): string {
    if (!this.isValidEmail(companyDraft.email)) {
      return 'Hibás email cím. A @ után a domainben pontnak és utána végződésnek is szerepelnie kell (pl. info@ceg.hu).';
    }

    if (!this.isValidHungarianPhone(companyDraft.phone)) {
      return 'Hibás telefonszám. Csak magyar formátum engedélyezett (pl. +36 30 123 4567 vagy 06 30 123 4567).';
    }

    if (!this.isValidWebsite(companyDraft.website)) {
      return 'Hibás weboldal formátum (pl. ceg.hu vagy https://ceg.hu).';
    }

    return '';
  }

  private submitCompanyUpdate(): void {
    if (this.isCompanySaving) {
      return;
    }

    this.isCompanySaving = true;

    const payload = this.toUpdateCompanyPayload(this.companyDraft);

    this.companiesService.updateCompany(payload).subscribe({
      next: () => {
        this.selectedCategoryId = this.selectedCategoryIdDraft;
        this.companyDraft.category = this.getCategoryNameById(this.selectedCategoryId) || '';
        this.companyData = this.clone(this.companyDraft);
        this.companyValidationMessage = '';
        this.showCompanyFieldErrors = false;
        this.editMode.company = false;
        this.conflictedSection = null;
        this.isCompanySaving = false;
      },
      error: (error) => {
        console.error('Nem sikerült menteni a céginformációkat a beállítások oldalon:', error);
        this.companyValidationMessage = 'A céginformációk mentése nem sikerült. Próbáld újra.';
        this.isCompanySaving = false;
      },
    });
  }

  private toUpdateCompanyPayload(companyDraft: CompanyProfile): UpdateCompanyRequest {
    const categoryId =
      this.selectedCategoryIdDraft ??
      this.selectedCategoryId ??
      this.resolveCategoryIdFromText(companyDraft.category);

    return {
      name: companyDraft.companyName.trim(),
      description: companyDraft.description.trim(),
      address: companyDraft.street.trim(),
      city: companyDraft.city.trim(),
      postalCode: companyDraft.zipCode.trim(),
      country: this.normalizeCountryToSupported(companyDraft.country),
      phone: companyDraft.phone.trim(),
      email: companyDraft.email.trim(),
      website: companyDraft.website.trim() || null,
      ...(categoryId !== null ? { businessCategoryId: categoryId } : {}),
    };
  }

  private normalizeCountryToSupported(value: string): string {
    const normalized = value?.trim().toLowerCase() ?? '';

    if (normalized === 'hungary' || normalized === 'magyarország' || normalized === 'magyarorszag') {
      return 'Magyarország';
    }

    return this.availableCountries[0];
  }

  private isValidEmail(value: string): boolean {
    const normalized = value?.trim() ?? '';

    if (!normalized) {
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@.]{2,}$/;
    return emailRegex.test(normalized);
  }

  private isValidHungarianPhone(value: string): boolean {
    const normalized = value?.trim() ?? '';

    if (!normalized) {
      return false;
    }

    const digits = normalized.replace(/\D/g, '');

    if (digits.startsWith('0036')) {
      return digits.length === 13;
    }

    if (digits.startsWith('36')) {
      return digits.length === 11;
    }

    if (digits.startsWith('06')) {
      return digits.length === 11;
    }

    return digits.length === 9;
  }

  private isValidWebsite(value: string): boolean {
    const normalized = value?.trim() ?? '';

    if (!normalized) {
      return true;
    }

    const candidate = /^https?:\/\//i.test(normalized) ? normalized : `https://${normalized}`;

    try {
      const url = new URL(candidate);
      const host = url.hostname;

      if (!host.includes('.')) {
        return false;
      }

      const tld = host.split('.').pop() ?? '';
      return /^[a-zA-Z]{2,}$/.test(tld);
    } catch {
      return false;
    }
  }

  private syncCompanyDescriptionTextareaMinHeight(
    textarea: HTMLTextAreaElement | null | undefined
  ): void {
    if (!textarea) {
      return;
    }

    textarea.style.minHeight = '0px';
    const contentHeight = textarea.scrollHeight;
    textarea.style.minHeight = `${contentHeight}px`;

    if (textarea.clientHeight < contentHeight) {
      textarea.style.height = `${contentHeight}px`;
    }
  }

  addTemporaryClosure(): void {
    this.temporaryClosures.push(this.getDefaultTemporaryClosure());

    this.scheduleTemporaryListHeightSync();
    this.temporaryClosuresSaveState = 'idle';
    this.temporaryClosuresSaveMessage = '';
    this.showTemporaryClosuresUnsavedWarning = false;
  }

  removeTemporaryClosure(index: number): void {
    const removedItem = this.temporaryClosures[index];
    if (removedItem?.id) {
      this.removedTemporaryClosureIds.push(removedItem.id);
    }

    if (this.temporaryClosures.length === 1) {
      this.temporaryClosures[0] = this.getDefaultTemporaryClosure();
      this.scheduleTemporaryListHeightSync();
      this.temporaryClosuresSaveState = 'idle';
      this.temporaryClosuresSaveMessage = '';
      this.showTemporaryClosuresUnsavedWarning = false;
      return;
    }

    this.temporaryClosures.splice(index, 1);
    this.scheduleTemporaryListHeightSync();
    this.temporaryClosuresSaveState = 'idle';
    this.temporaryClosuresSaveMessage = '';
    this.showTemporaryClosuresUnsavedWarning = false;
  }

  onTemporaryAllDayChange(period: TemporaryClosingPeriod, isAllDay: boolean): void {
    this.markTemporaryClosuresChanged();

    if (isAllDay) {
      period.startTime = '';
      period.endTime = '';
      return;
    }

    if (!period.startTime) {
      period.startTime = '09:00';
    }

    if (!period.endTime) {
      period.endTime = '17:00';
    }
  }

  onTemporaryDateChange(
    period: TemporaryClosingPeriod,
    field: 'startDate' | 'endDate',
    value: string
  ): void {
    period[field] = value?.trim() || this.getTodayDateString();
    this.markTemporaryClosuresChanged();
  }

  onCompanyZipCodeChange(value: string): void {
    const normalizedZip = this.normalizePostalCode(value);
    this.companyDraft.zipCode = normalizedZip;

    const hintedCity = this.resolveCityFromPostalCode(normalizedZip);
    if (hintedCity) {
      this.companyDraft.city = hintedCity;
      this.lastAutofilledCompanyCity = hintedCity;
      return;
    }

    if (this.lastAutofilledCompanyCity && this.companyDraft.city === this.lastAutofilledCompanyCity) {
      this.companyDraft.city = '';
    }

    this.lastAutofilledCompanyCity = null;
  }

  markTemporaryClosuresChanged(): void {
    this.temporaryClosuresSaveState = 'idle';
    this.temporaryClosuresSaveMessage = '';
    this.showTemporaryClosuresUnsavedWarning = false;
    this.scheduleTemporaryListHeightSync();
  }

  cancelTemporaryClosuresChanges(): void {
    this.restoreTemporaryClosuresFromSavedSnapshot();
    this.removedTemporaryClosureIds = [];
    this.temporaryClosuresSaveState = 'idle';
    this.temporaryClosuresSaveMessage = '';
    this.showTemporaryClosuresUnsavedWarning = false;
    if (this.conflictedSection === 'closures') {
      this.conflictedSection = null;
    }
    this.scheduleTemporaryListHeightSync();
  }

  saveTemporaryClosures(): void {
    if (!this.hasTemporaryClosuresUnsavedChanges) {
      this.temporaryClosuresSaveState = 'success';
      this.temporaryClosuresSaveMessage = 'Nincs új módosítás a mentéshez.';
      if (this.conflictedSection === 'closures') {
        this.conflictedSection = null;
      }
      this.scheduleTemporaryListHeightSync();
      return;
    }

    const normalizedClosures = this.temporaryClosures.map((item) => this.normalizeTemporaryClosure(item));
    const hasPastDate = normalizedClosures.some((item) =>
      this.isTemporaryDateInPast(item.startDate) || this.isTemporaryDateInPast(item.endDate)
    );

    if (hasPastDate) {
      this.temporaryClosuresSaveState = 'error';
      this.temporaryClosuresSaveMessage =
        'A kezdő és záró dátum nem lehet korábbi a mai napnál.';
      this.scheduleTemporaryListHeightSync();
      return;
    }

    const hasInvalidDateRange = normalizedClosures.some((item) => this.isTemporaryDateRangeInvalid(item));

    if (hasInvalidDateRange) {
      this.temporaryClosuresSaveState = 'error';
      this.temporaryClosuresSaveMessage =
        'A záró dátum nem lehet korábbi, mint a kezdő dátum.';
      this.scheduleTemporaryListHeightSync();
      return;
    }

    const periodsToUpdate = normalizedClosures.filter((item) => Boolean(item.id));
    const periodsToCreate = normalizedClosures.filter((item) => !item.id);
    const periodsToDelete = [...new Set(this.removedTemporaryClosureIds)];

    this.temporaryClosuresSaveState = 'saving';
    this.temporaryClosuresSaveMessage = 'Mentés folyamatban...';

    if (periodsToUpdate.length === 0 && periodsToCreate.length === 0 && periodsToDelete.length === 0) {
      this.temporaryClosuresSaveState = 'success';
      this.temporaryClosuresSaveMessage = 'Nincs új módosítás a mentéshez.';
      this.scheduleTemporaryListHeightSync();
      return;
    }

    const updateRequests = periodsToUpdate.map((item) =>
      this.companiesService.updateTemporaryClosedPeriod(item.id!, this.toTemporaryClosurePayload(item))
    );

    const createRequests = periodsToCreate.map((item) =>
      this.companiesService.createTemporaryClosedPeriod(this.toTemporaryClosurePayload(item))
    );

    const deleteRequests = periodsToDelete.map((id) =>
      this.companiesService.deleteTemporaryClosedPeriod(id)
    );

    const updateBatch$ = updateRequests.length
      ? forkJoin(updateRequests)
      : of([] as TemporaryClosedPeriod[]);
    const createBatch$ = createRequests.length
      ? forkJoin(createRequests)
      : of([] as TemporaryClosedPeriod[]);
    const deleteBatch$ = deleteRequests.length
      ? forkJoin(deleteRequests)
      : of([] as unknown[]);

    forkJoin({
      updatedPeriods: updateBatch$,
      createdPeriods: createBatch$,
      deletedResults: deleteBatch$,
    }).subscribe({
      next: ({ createdPeriods }) => {
        let createdIndex = 0;
        const mergedClosures = normalizedClosures.map((item) => {
          if (item.id) {
            return item;
          }

          const created = createdPeriods[createdIndex++];
          return {
            ...item,
            id: created?.id,
          };
        });

        localStorage.setItem(
          this.temporaryClosuresStorageKey,
          JSON.stringify(mergedClosures)
        );

        this.temporaryClosures = mergedClosures;
        this.temporaryClosuresSavedSnapshot = this.getTemporaryClosuresSnapshot(this.temporaryClosures);
        this.removedTemporaryClosureIds = [];
        this.temporaryClosuresSaveState = 'success';
        this.temporaryClosuresSaveMessage = 'Ideiglenes zárvatartások mentve.';
        this.showTemporaryClosuresUnsavedWarning = false;
        if (this.conflictedSection === 'closures') {
          this.conflictedSection = null;
        }
        this.scheduleTemporaryListHeightSync();
      },
      error: (error) => {
        console.error('Nem sikerült menteni az ideiglenes zárvatartásokat API-ra:', error);
        this.temporaryClosuresSaveState = 'error';
        this.temporaryClosuresSaveMessage = 'A mentés nem sikerült. Próbáld újra.';
        this.scheduleTemporaryListHeightSync();
      },
    });
  }

  private loadTemporaryClosures(): void {
    this.companiesService.getTemporaryClosedPeriods().subscribe({
      next: (periods) => {
        if (periods.length > 0) {
          this.temporaryClosures = periods.map((item) => this.mapTemporaryClosureFromApi(item));
        } else {
          this.temporaryClosures = [this.getDefaultTemporaryClosure()];
        }

        this.removedTemporaryClosureIds = [];
        this.temporaryClosuresSavedSnapshot = this.getTemporaryClosuresSnapshot(this.temporaryClosures);
        this.scheduleTemporaryListHeightSync();
      },
      error: (error) => {
        console.error('Nem sikerült betölteni az ideiglenes zárvatartásokat API-ról:', error);
        this.loadTemporaryClosuresFromLocalStorage();
      },
    });
  }

  private loadTemporaryClosuresFromLocalStorage(): void {
    const rawValue = localStorage.getItem(this.temporaryClosuresStorageKey);

    if (!rawValue) {
      this.temporaryClosuresSavedSnapshot = this.getTemporaryClosuresSnapshot(this.temporaryClosures);
      return;
    }

    try {
      const parsedValue = JSON.parse(rawValue) as Partial<TemporaryClosingPeriod>[];
      if (!Array.isArray(parsedValue) || parsedValue.length === 0) {
        return;
      }

      this.temporaryClosures = parsedValue.map((item) => this.normalizeTemporaryClosure(item));
      this.removedTemporaryClosureIds = [];
      this.temporaryClosuresSavedSnapshot = this.getTemporaryClosuresSnapshot(this.temporaryClosures);
      this.scheduleTemporaryListHeightSync();
    } catch {
      localStorage.removeItem(this.temporaryClosuresStorageKey);
      this.temporaryClosuresSavedSnapshot = this.getTemporaryClosuresSnapshot(this.temporaryClosures);
    }
  }

  private mapTemporaryClosureFromApi(value: TemporaryClosedPeriod): TemporaryClosingPeriod {
    const openTime = this.normalizeApiTime(value.openTime);
    const closeTime = this.normalizeApiTime(value.closeTime);
    const isAllDay = !openTime || !closeTime;

    return {
      id: value.id,
      startDate: value.startDate || this.getTodayDateString(),
      endDate: value.endDate || this.getTodayDateString(),
      isAllDay,
      startTime: isAllDay ? '' : openTime,
      endTime: isAllDay ? '' : closeTime,
      reason: value.reason || '',
    };
  }

  private normalizeApiTime(value: string | null | undefined): string {
    if (!value) {
      return '';
    }

    const [hours = '', minutes = ''] = value.split(':');
    if (!hours || !minutes) {
      return '';
    }

    return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
  }

  private normalizeTemporaryClosure(
    value: Partial<TemporaryClosingPeriod>
  ): TemporaryClosingPeriod {
    const today = this.getTodayDateString();

    return {
      id: value.id,
      startDate: value.startDate || today,
      endDate: value.endDate || today,
      isAllDay: value.isAllDay ?? true,
      startTime: value.startTime || '',
      endTime: value.endTime || '',
      reason: value.reason || '',
    };
  }

  private toTemporaryClosurePayload(period: TemporaryClosingPeriod): {
    startDate: string;
    endDate: string;
    openTime: string | null;
    closeTime: string | null;
    reason: string;
  } {
    return {
      startDate: period.startDate,
      endDate: period.endDate,
      openTime: period.isAllDay ? null : period.startTime || null,
      closeTime: period.isAllDay ? null : period.endTime || null,
      reason: period.reason,
    };
  }

  private normalizePostalCode(value: string): string {
    return (value?.replace(/\D/g, '') ?? '').slice(0, 4);
  }

  private resolveCityFromPostalCode(postalCode: string): string | null {
    if (!postalCode || postalCode.length !== 4) {
      return null;
    }

    if (postalCode.startsWith('1')) {
      return 'Budapest';
    }

    if (postalCode.startsWith('76')) {
      return 'Pécs';
    }

    return this.postalCodeCityHints[postalCode] ?? null;
  }

  private getTodayDateString(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private getDefaultTemporaryClosure(): TemporaryClosingPeriod {
    return {
      startDate: this.getTodayDateString(),
      endDate: this.getTodayDateString(),
      isAllDay: true,
      startTime: '',
      endTime: '',
      reason: '',
    };
  }

  private getTemporaryClosuresSnapshot(closures: TemporaryClosingPeriod[]): string {
    const normalized = closures.map((item) => ({
      id: item.id || null,
      startDate: item.startDate || this.getTodayDateString(),
      endDate: item.endDate || this.getTodayDateString(),
      isAllDay: item.isAllDay,
      startTime: item.isAllDay ? '' : item.startTime,
      endTime: item.isAllDay ? '' : item.endTime,
      reason: item.reason.trim(),
    }));

    return JSON.stringify(normalized);
  }

  private restoreTemporaryClosuresFromSavedSnapshot(): void {
    if (!this.temporaryClosuresSavedSnapshot) {
      this.temporaryClosures = [this.getDefaultTemporaryClosure()];
      return;
    }

    try {
      const parsed = JSON.parse(this.temporaryClosuresSavedSnapshot) as Partial<TemporaryClosingPeriod>[];

      if (!Array.isArray(parsed) || parsed.length === 0) {
        this.temporaryClosures = [this.getDefaultTemporaryClosure()];
        return;
      }

      this.temporaryClosures = parsed.map((item) => this.normalizeTemporaryClosure(item));
    } catch {
      this.temporaryClosures = [this.getDefaultTemporaryClosure()];
    }
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.scheduleTemporaryListHeightSync();
  }

  @HostListener('document:keydown.escape')
  onEscapePress(): void {
    if (this.isImagePreviewOpen) {
      this.closeImagePreview();
    }
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

  openImagePreview(imageUrl: string | null): void {
    if (!imageUrl) {
      return;
    }

    this.imagePreviewUrl = imageUrl;
    this.isImagePreviewOpen = true;
  }

  closeImagePreview(): void {
    this.isImagePreviewOpen = false;
    this.imagePreviewUrl = null;
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
    const closuresFeedbackElement = this.closuresFeedback?.nativeElement;

    if (!hoursElement || !closuresElement || !closuresHeaderElement) {
      return;
    }

    const hoursHeight = hoursElement.getBoundingClientRect().height;
    const closuresStyles = window.getComputedStyle(closuresElement);
    const closuresPaddingTop = Number.parseFloat(closuresStyles.paddingTop) || 0;
    const closuresPaddingBottom = Number.parseFloat(closuresStyles.paddingBottom) || 0;
    const closuresGap = Number.parseFloat(closuresStyles.rowGap || closuresStyles.gap) || 0;
    const closuresHeaderHeight = closuresHeaderElement.getBoundingClientRect().height;
    const closuresFeedbackHeight = closuresFeedbackElement?.getBoundingClientRect().height || 0;
    const closuresExtraGap = closuresFeedbackHeight > 0 ? closuresGap : 0;

    const nextMaxHeight =
      hoursHeight -
      closuresPaddingTop -
      closuresPaddingBottom -
      closuresHeaderHeight -
      closuresGap -
      closuresFeedbackHeight -
      closuresExtraGap;
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

    if (this.editMode.closures) {
      return 'closures';
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
          country: this.normalizeCountryToSupported(
            company.addressDetails?.country?.trim() || company.country?.trim() || this.companyData.country
          ),
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
        this.companyMainImageUrl = company.imageUrl?.trim()
          ? this.toAbsoluteImageUrl(company.imageUrl)
          : null;
        this.syncGalleryFromApiSources();
      },
      error: (error) => {
        console.error('Nem sikerült betölteni a céginformációkat a beállítások oldalon:', error);
      },
    });
  }

  private loadCompanyImages(): void {
    const user = this.authService.getCurrentUser();
    const companyId = user?.companyId;

    if (!companyId) {
      return;
    }

    this.companiesService.getCompanyImages(companyId).subscribe({
      next: (images) => {
        this.companyGalleryApiImages = images;
        this.syncGalleryFromApiSources();
      },
      error: (error) => {
        console.error('Nem sikerült betölteni a cég képeit a beállítások oldalon:', error);
      },
    });
  }

  private loadOpeningHours(): void {
    this.companiesService.getOwnerPanelOpeningHours().subscribe({
      next: (openingHours) => {
        this.applyOpeningHours(openingHours);
      },
      error: (error) => {
        console.error('Nem sikerült betölteni a nyitvatartást a beállítások oldalon:', error);
      },
    });
  }

  private loadBookingRules(): void {
    this.companiesService.getCompanyBookingRules().subscribe({
      next: (rules) => {
        this.applyBookingRules(rules);
      },
      error: (error) => {
        console.error('Nem sikerült betölteni az üzleti szabályokat a beállítások oldalon:', error);
      },
    });
  }

  private applyBookingRules(rules: CompanyBookingRules): void {
    this.businessRulesData = {
      ...this.businessRulesData,
      maxAdvanceBookingDays: rules.bookingAdvanceDays ?? this.businessRulesData.maxAdvanceBookingDays,
      cancellationDeadlineHours: rules.cancellationHours ?? this.businessRulesData.cancellationDeadlineHours,
      sameDayMinimumHours: rules.minimumBookingHoursAhead ?? null,
    };

    if (this.businessRulesData.sameDayMinimumHours !== null) {
      this.lastSameDayMinimumHours = this.businessRulesData.sameDayMinimumHours;
    }

    if (!this.editMode.rules) {
      this.businessRulesDraft = this.clone(this.businessRulesData);
    }
  }

  onSameDayUnbookableToggle(isUnbookable: boolean): void {
    if (isUnbookable) {
      if (this.businessRulesDraft.sameDayMinimumHours !== null) {
        this.lastSameDayMinimumHours = this.businessRulesDraft.sameDayMinimumHours;
      }

      this.businessRulesDraft.sameDayMinimumHours = null;
      return;
    }

    this.businessRulesDraft.sameDayMinimumHours = this.lastSameDayMinimumHours;
  }

  private saveOpeningHours(): void {
    const nextOpeningHours = this.clone(this.openingHoursDraft);
    const payload = this.toOpeningHoursUpdatePayload(nextOpeningHours);

    this.companiesService.updateOwnerPanelOpeningHours(payload).subscribe({
      next: () => {
        this.openingHoursData = nextOpeningHours;
        this.editMode.hours = false;
        this.conflictedSection = null;
      },
      error: (error) => {
        console.error('Nem sikerült menteni a nyitvatartást a beállítások oldalon:', error);
      },
    });
  }

  private saveBookingRules(): void {
    const nextBusinessRules = this.normalizeBusinessRules(this.businessRulesDraft);
    const payload = this.toCompanyBookingRulesUpdatePayload(nextBusinessRules);

    this.companiesService.updateCompanyBookingRules(payload).subscribe({
      next: () => {
        this.businessRulesData = nextBusinessRules;
        this.businessRulesDraft = this.clone(nextBusinessRules);
        if (nextBusinessRules.sameDayMinimumHours !== null) {
          this.lastSameDayMinimumHours = nextBusinessRules.sameDayMinimumHours;
        }
        this.editMode.rules = false;
        this.conflictedSection = null;
      },
      error: (error) => {
        console.error('Nem sikerült menteni az üzleti szabályokat a beállítások oldalon:', error);
      },
    });
  }

  private toCompanyBookingRulesUpdatePayload(
    businessRules: BusinessRules
  ): CompanyBookingRulesUpdatePayload {
    return {
      bookingAdvanceDays: businessRules.maxAdvanceBookingDays,
      cancellationHours: businessRules.cancellationDeadlineHours,
      minimumBookingHoursAhead: businessRules.sameDayMinimumHours,
    };
  }

  private normalizeBusinessRules(businessRules: BusinessRules): BusinessRules {
    return {
      ...businessRules,
      maxAdvanceBookingDays: this.normalizeNumberField(
        businessRules.maxAdvanceBookingDays,
        this.businessRulesData.maxAdvanceBookingDays
      ),
      cancellationDeadlineHours: this.normalizeNumberField(
        businessRules.cancellationDeadlineHours,
        this.businessRulesData.cancellationDeadlineHours
      ),
      sameDayMinimumHours: this.normalizeNullableNumberField(businessRules.sameDayMinimumHours),
    };
  }

  private normalizeNumberField(value: number | null, fallback: number): number {
    const parsedValue = Number(value);
    if (!Number.isFinite(parsedValue)) {
      return fallback;
    }

    return Math.trunc(parsedValue);
  }

  private normalizeNullableNumberField(value: number | string | null | undefined): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const parsedValue = Number(value);
    if (!Number.isFinite(parsedValue)) {
      return null;
    }

    return Math.trunc(parsedValue);
  }

  private toOpeningHoursUpdatePayload(hours: OpeningHour[]): OpeningHoursUpdatePayload {
    const openingHours = this.openingHoursOrder.reduce<Record<OpeningHourApiDay, string>>((acc, item, index) => {
      const hour = hours[index];
      acc[item.day] = this.toApiOpeningHourValue(hour);
      return acc;
    }, {} as Record<OpeningHourApiDay, string>);

    return { openingHours };
  }

  private toApiOpeningHourValue(hour: OpeningHour | undefined): string {
    if (!hour || !hour.isOpen) {
      return 'closed';
    }

    const openTime = this.normalizeTime(hour.openTime || '00:00');
    const closeTime = this.normalizeTime(hour.closeTime || '00:00');
    return `${openTime}-${closeTime}`;
  }

  private applyOpeningHours(openingHours: OpeningHours): void {
    const nextOpeningHours = this.openingHoursOrder.map(({ day, label }, index) => {
      const fallback = this.openingHoursData[index];
      const rawValue = openingHours[day];

      return {
        day: label,
        ...this.mapOpeningHoursValue(rawValue, fallback),
      };
    });

    this.openingHoursData = nextOpeningHours;

    if (!this.editMode.hours) {
      this.openingHoursDraft = this.clone(nextOpeningHours);
    }
  }

  private mapOpeningHoursValue(
    value: string | undefined,
    fallback: OpeningHour
  ): Pick<OpeningHour, 'isOpen' | 'openTime' | 'closeTime'> {
    const normalized = value?.trim() ?? '';

    if (!normalized) {
      return {
        isOpen: fallback.isOpen,
        openTime: fallback.openTime,
        closeTime: fallback.closeTime,
      };
    }

    if (normalized.toLowerCase() === 'zárva') {
      return {
        isOpen: false,
        openTime: fallback.openTime,
        closeTime: fallback.closeTime,
      };
    }

    const matches = normalized.match(/\d{1,2}:\d{2}/g);

    if (!matches || matches.length < 2) {
      return {
        isOpen: fallback.isOpen,
        openTime: fallback.openTime,
        closeTime: fallback.closeTime,
      };
    }

    const [openTimeRaw, closeTimeRaw] = matches;

    return {
      isOpen: true,
      openTime: this.normalizeTime(openTimeRaw),
      closeTime: this.normalizeTime(closeTimeRaw),
    };
  }

  private normalizeTime(time: string): string {
    const [hour = '0', minute = '00'] = time.split(':');
    const paddedHour = hour.padStart(2, '0');
    return `${paddedHour}:${minute}`;
  }

  private syncGalleryFromApiSources(): void {
    const defaultSlots: GalleryImage[] = [
      { slotName: 'Főkép', title: 'Főkép', fileName: '', previewUrl: null },
      { slotName: 'Kép 2', title: 'Kép 2', fileName: '', previewUrl: null },
      { slotName: 'Kép 3', title: 'Kép 3', fileName: '', previewUrl: null },
      { slotName: 'Kép 4', title: 'Kép 4', fileName: '', previewUrl: null },
    ];

    const normalizedApiImages = this.companyGalleryApiImages
      .map((image) => ({
        ...image,
        absoluteUrl: this.toAbsoluteImageUrl(image.url || ''),
      }))
      .filter((image) => Boolean(image.absoluteUrl));

    const mainFromApi = normalizedApiImages.find((image) => image.isMain)?.absoluteUrl || null;
    const otherApiUrls = normalizedApiImages
      .map((image) => image.absoluteUrl)
      .filter((url) => url !== mainFromApi);

    const preferredMain = mainFromApi || this.companyMainImageUrl;
    const mergedUrls = [preferredMain, ...otherApiUrls].filter((url): url is string => Boolean(url));
    const uniqueUrls = Array.from(new Set(mergedUrls)).slice(0, defaultSlots.length);

    uniqueUrls.forEach((url, index) => {
      defaultSlots[index].previewUrl = url;
      defaultSlots[index].fileName = this.extractFileName(url);
    });

    this.galleryData = { images: defaultSlots };

    if (!this.editMode.gallery) {
      this.galleryDraft = this.clone(this.galleryData);
    }
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

  private toAbsoluteImageUrl(url: string): string {
    const trimmedUrl = url.trim();

    if (!trimmedUrl) {
      return '';
    }

    if (/^https?:\/\//i.test(trimmedUrl)) {
      return trimmedUrl;
    }

    const apiRoot = environment.apiUrl.replace(/\/api\/?$/, '');
    const relativePath = trimmedUrl.startsWith('/') ? trimmedUrl : `/${trimmedUrl}`;
    return `${apiRoot}${relativePath}`;
  }

  private extractFileName(url: string): string {
    return url.split('/').pop() || '';
  }

}
