import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../../core/services/auth.service';
import { CompaniesService } from '../../../../../core/services/companies.service';
import { ServiceCategory, Service as ApiService } from '../../../../../core/models/service.model';

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

@Component({
  selector: 'app-services.component',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './services.component.html',
  styleUrl: './services.component.css',
})
export class ServicesComponent implements OnInit {
  showNewServiceModal = false;
  showEditServiceModal = false;
  selectedCategory: string = 'Összes';
  isLoading = false;
  errorMessage = '';
  
  selectedService: DashboardServiceItem | null = null;
  
  newService: Partial<DashboardServiceItem> = {
    name: '',
    category: '',
    duration: '30 perc',
    price: 0,
    description: '',
    currency: 'HUF',
    status: 'active'
  };

  services: DashboardServiceItem[] = [];

  constructor(
    private authService: AuthService,
    private companiesService: CompaniesService
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
      category: '',
      duration: '30 perc',
      price: 0,
      description: '',
      currency: 'HUF',
      status: 'active'
    };
    this.showNewServiceModal = true;
  }

  closeNewServiceModal(): void {
    this.showNewServiceModal = false;
  }

  saveNewService(): void {
    if (this.newService.name && this.newService.category) {
      const newId = (this.services.length > 0 ? Math.max(...this.services.map((service) => service.id)) : 0) + 1;
      this.services.push({
        id: newId,
        name: this.newService.name,
        category: this.newService.category,
        duration: this.newService.duration || '30 perc',
        price: this.newService.price || 0,
        description: this.newService.description || '',
        currency: this.newService.currency || 'HUF',
        status: this.newService.status || 'active'
      });
      this.closeNewServiceModal();
    }
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
        this.services = categories.flatMap((category) =>
          (category.services || []).map((service) => this.mapServiceFromApi(service, category))
        );
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Services load error:', error);
        this.errorMessage = 'Nem sikerült betölteni a szolgáltatásokat.';
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
