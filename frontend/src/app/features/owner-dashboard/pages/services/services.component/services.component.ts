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

  get filteredServices(): DashboardServiceItem[] {
    if (this.selectedCategory === 'Összes') {
      return this.services;
    }

    return this.services.filter((service) => service.category === this.selectedCategory);
  }

  selectCategory(category: string): void {
    this.selectedCategory = category;
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
      const newId = Math.max(...this.services.map(s => s.id)) + 1;
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
