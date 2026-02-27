import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';

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
  imports: [CommonModule, FormsModule, DragDropModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css'],
})
export class SettingsComponent {
  readonly paymentMethods = ['Helyszíni fizetés'];
  readonly currencies = ['HUF'];
  conflictedSection: SectionType | null = null;

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
    website: 'https://bookr.hu',
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
      { slotName: 'Főkép', title: 'Főkép', fileName: 'recepcio.jpg' },
      { slotName: 'Kép 2', title: 'Kép 2', fileName: 'hajvago.jpg' },
      { slotName: 'Kép 3', title: 'Kép 3', fileName: 'kozmetika.jpg' },
      { slotName: 'Kép 4', title: 'Kép 4', fileName: 'termekpolc.jpg' },
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

  startEdit(section: SectionType): void {
    const activeSection = this.getActiveEditSection();

    if (activeSection && activeSection !== section) {
      this.conflictedSection = activeSection;
      return;
    }

    this.conflictedSection = null;

    if (section === 'company') {
      this.companyDraft = this.clone(this.companyData);
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
    this.editMode[section] = false;
    this.conflictedSection = null;
  }

  saveEdit(section: SectionType): void {
    if (section === 'company') {
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
  }

  removeTemporaryClosure(index: number): void {
    if (this.temporaryClosures.length === 1) {
      this.temporaryClosures[0] = {
        startDate: '',
        endDate: '',
        reason: '',
      };
      return;
    }

    this.temporaryClosures.splice(index, 1);
  }

  onGalleryDrop(event: CdkDragDrop<GalleryImage[]>): void {
    if (event.previousIndex === event.currentIndex) {
      return;
    }

    moveItemInArray(this.galleryDraft.images, event.previousIndex, event.currentIndex);
  }

  onGalleryFileSelected(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    this.galleryDraft.images[index].fileName = file.name;
    input.value = '';
  }

  private clone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value));
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

}
