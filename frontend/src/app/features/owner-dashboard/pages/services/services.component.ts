import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { CompaniesService } from '../../../../core/services/companies.service';
import {
  CreateServiceCategoryRequest,
  CreateServiceRequest,
  ServicesService,
} from '../../../../core/services/services.service';
import { ServiceCategory, Service as ApiService } from '../../../../core/models/service.model';

interface DashboardServiceItem {
  id: number;
  name: string;
  category: string;
  duration: string;
  price: number;
  description: string;
  currency: string;
  status: 'active' | 'inactive';
}

interface DashboardServiceGroup {
  category: string;
  services: DashboardServiceItem[];
  activeCount: number;
  inactiveCount: number;
}

interface NewServiceFormModel {
  name: string;
  categoryId: number | null;
  durationMinutes: number;
  price: number;
  description: string;
  isActive: boolean;
}

interface NewCategoryFormModel {
  name: string;
  description: string;
}

@Component({
  selector: 'app-services.component',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './services.component.html',
  styleUrl: './services.component.css',
})
export class ServicesComponent implements OnInit {
  showNewServiceModal = false;
  showNewCategoryModal = false;
  showEditServiceModal = false;
  selectedCategory: string = 'Összes';
  isLoading = false;
  isSavingNewService = false;
  isSavingNewCategory = false;
  errorMessage = '';
  categoryFormError = '';
  
  selectedService: DashboardServiceItem | null = null;
  
  newService: NewServiceFormModel = {
    name: '',
    categoryId: null,
    durationMinutes: 30,
    price: 0,
    description: '',
    isActive: true,
  };

  newCategory: NewCategoryFormModel = {
    name: '',
    description: '',
  };

  services: DashboardServiceItem[] = [];
  serviceCategories: ServiceCategory[] = [];

  constructor(
    private authService: AuthService,
    private companiesService: CompaniesService,
    private servicesService: ServicesService
  ) {}

  ngOnInit(): void {
    this.loadServices();
  }

  get categories(): string[] {
    const uniqueCategories = Array.from(new Set(this.services.map((service) => service.category)));
    return ['Összes', ...uniqueCategories];
  }

  get totalCategoryCount(): number {
    return Math.max(this.categories.length - 1, 0);
  }

  get activeServicesCount(): number {
    return this.services.filter((service) => service.status === 'active').length;
  }

  get inactiveServicesCount(): number {
    return this.services.filter((service) => service.status === 'inactive').length;
  }

  get startingPriceLabel(): string {
    if (this.services.length === 0) {
      return 'Nincs adat';
    }

    const cheapestService = this.services.reduce((lowest, current) =>
      current.price < lowest.price ? current : lowest
    );

    return this.formatPrice(cheapestService.price, cheapestService.currency);
  }

  get serviceGroups(): DashboardServiceGroup[] {
    const groups: { [key: string]: DashboardServiceItem[] } = {};
    if (this.selectedCategory === 'Összes') {
      this.services.forEach((service) => {
        if (!groups[service.category]) {
          groups[service.category] = [];
        }
        groups[service.category].push(service);
      });
      return Object.keys(groups).map((category) => ({
        category,
        services: groups[category],
        activeCount: groups[category].filter((service) => service.status === 'active').length,
        inactiveCount: groups[category].filter((service) => service.status === 'inactive').length,
      }));
    } else {
      const filteredServices = this.services.filter((service) => service.category === this.selectedCategory);
      return [{
        category: this.selectedCategory,
        services: filteredServices,
        activeCount: filteredServices.filter((service) => service.status === 'active').length,
        inactiveCount: filteredServices.filter((service) => service.status === 'inactive').length,
      }];
    }
  }

  selectCategory(category: string): void {
    this.selectedCategory = category;
  }

  formatPrice(price: number, currency: string): string {
    const symbol = currency === 'HUF' ? 'Ft' : currency;
    const formatted = Math.round(price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
    return `${formatted} ${symbol}`;
  }

  getCategoryCount(category: string): number {
    if (category === 'Összes') {
      return this.services.length;
    }

    return this.services.filter((service) => service.category === category).length;
  }

  formatSequence(index: number): string {
    return (index + 1).toString().padStart(2, '0');
  }

  openNewServiceModal(): void {
    this.newService = {
      name: '',
      categoryId: null,
      durationMinutes: 30,
      price: 0,
      description: '',
      isActive: true,
    };
    this.showNewServiceModal = true;
  }

  openNewCategoryModal(): void {
    this.newCategory = {
      name: '',
      description: '',
    };
    this.categoryFormError = '';
    this.showNewCategoryModal = true;
  }

  closeNewServiceModal(): void {
    if (this.isSavingNewService) {
      return;
    }
    this.showNewServiceModal = false;
  }

  closeNewCategoryModal(): void {
    if (this.isSavingNewCategory) {
      return;
    }
    this.showNewCategoryModal = false;
  }

  canSaveNewService(): boolean {
    const name = this.newService.name.trim();
    const categoryId = this.newService.categoryId;
    const durationMinutes = Number(this.newService.durationMinutes);
    const price = Number(this.newService.price);

    return !!name && !!categoryId && Number.isFinite(durationMinutes) && durationMinutes > 0 && Number.isFinite(price) && price >= 0;
  }

  saveNewService(): void {
    const name = this.newService.name.trim();
    const description = this.newService.description.trim();
    const categoryId = this.newService.categoryId;
    const durationMinutes = Number(this.newService.durationMinutes);
    const price = Number(this.newService.price);

    if (!name || !categoryId || durationMinutes <= 0 || !Number.isFinite(durationMinutes) || price < 0) {
      this.errorMessage = 'Az uj szolgaltatas adatai ervenytelenek.';
      return;
    }

    const payload: CreateServiceRequest = {
      name,
      categoryId,
      durationMinutes,
      price,
      desciption: description,
      isActive: this.newService.isActive,
    };

    this.isSavingNewService = true;
    this.errorMessage = '';

    this.servicesService.createService(payload).subscribe({
      next: () => {
        this.isSavingNewService = false;
        this.showNewServiceModal = false;
        this.loadServices();
      },
      error: (error) => {
        this.isSavingNewService = false;
        console.error('Service create error:', error);
        this.errorMessage = 'Nem sikerult letrehozni a szolgaltatast.';
      },
    });
  }

  saveNewCategory(): void {
    const name = this.newCategory.name.trim();
    const description = this.newCategory.description.trim();

    if (!name || !description) {
      this.categoryFormError = 'A kategori nev es leiras megadasa kotelezo.';
      return;
    }

    const payload: CreateServiceCategoryRequest = {
      name,
      description,
    };

    this.isSavingNewCategory = true;
    this.categoryFormError = '';
    this.errorMessage = '';

    this.servicesService.createServiceCategory(payload).subscribe({
      next: () => {
        this.isSavingNewCategory = false;
        this.showNewCategoryModal = false;
        this.loadServices();
      },
      error: (error) => {
        this.isSavingNewCategory = false;
        console.error('Service category create error:', error);
        this.categoryFormError = 'Nem sikerult letrehozni a kategoriat.';
      },
    });
  }

  openEditServiceModal(service: DashboardServiceItem): void {
    this.selectedService = { ...service };
    this.showEditServiceModal = true;
  }

  closeEditServiceModal(): void {
    this.showEditServiceModal = false;
    this.selectedService = null;
  }

  saveEditService(): void {
    if (this.selectedService) {
      const index = this.services.findIndex(s => s.id === this.selectedService!.id);
      if (index !== -1) {
        this.services[index] = { ...this.selectedService };
      }
      this.closeEditServiceModal();
    }
  }

  private loadServices(): void {
    const user = this.authService.getCurrentUser();

    if (!user?.companyId) {
      this.errorMessage = 'Nem található cégazonosító a szolgáltatások betöltéséhez.';
      this.services = [];
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.companiesService.getServiceCategoriesWithServices(user.companyId).subscribe({
      next: (categories: ServiceCategory[]) => {
        this.serviceCategories = categories;
        this.services = categories.flatMap((category) =>
          (category.services || []).map((service) => this.mapServiceFromApi(service, category))
        );
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Services load error:', error);
        this.errorMessage = 'Nem sikerült betölteni a szolgáltatásokat.';
        this.serviceCategories = [];
        this.services = [];
        this.isLoading = false;
      },
    });
  }

  private mapServiceFromApi(service: ApiService, category: ServiceCategory): DashboardServiceItem {
    return {
      id: service.id,
      name: service.name,
      category: category.name,
      duration: service.duration,
      price: service.price,
      description: category.description || 'Szolgáltatás leírása hamarosan.',
      currency: service.currency || 'HUF',
      status: 'active',
    };
  }
}
