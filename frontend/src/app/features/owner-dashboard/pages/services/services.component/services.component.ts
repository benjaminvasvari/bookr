import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Service {
  id: number;
  name: string;
  category: string;
  duration: number;
  price: number;
  description: string;
  status: 'active' | 'inactive';
}

@Component({
  selector: 'app-services.component',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './services.component.html',
  styleUrl: './services.component.css',
})
export class ServicesComponent {
  showNewServiceModal = false;
  showEditServiceModal = false;
  showAppointmentsModal = false;
  
  selectedService: Service | null = null;
  
  newService: Partial<Service> = {
    name: '',
    category: '',
    duration: 30,
    price: 0,
    description: '',
    status: 'active'
  };

  services: Service[] = [
    {
      id: 1,
      name: 'Hajvágás',
      category: 'Fodrászat',
      duration: 45,
      price: 8500,
      description: 'Klasszikus férfi/női hajvágás, mosással és formázással.',
      status: 'active'
    },
    {
      id: 2,
      name: 'Szakáll igazítás',
      category: 'Barber',
      duration: 30,
      price: 6500,
      description: 'Precíz kontúr, formázás és ápolás prémium termékekkel.',
      status: 'active'
    },
    {
      id: 3,
      name: 'Festés',
      category: 'Fodrászat',
      duration: 90,
      price: 18000,
      description: 'Teljes hajfestés személyre szabott árnyalattal és ápolással.',
      status: 'inactive'
    },
    {
      id: 4,
      name: 'Relax masszázs',
      category: 'Masszázs',
      duration: 60,
      price: 14000,
      description: 'Lazító, stresszoldó masszázs aromaterápiával.',
      status: 'active'
    },
    {
      id: 5,
      name: 'Manikűr',
      category: 'Kozmetika',
      duration: 50,
      price: 9500,
      description: 'Teljes körű kézápolás, lakkozással és hidratálással.',
      status: 'active'
    },
    {
      id: 6,
      name: 'Hot towel',
      category: 'Barber',
      duration: 20,
      price: 3500,
      description: 'Meleg törölközős kezelés borotválás előtt.',
      status: 'active'
    }
  ];

  openNewServiceModal(): void {
    this.newService = {
      name: '',
      category: '',
      duration: 30,
      price: 0,
      description: '',
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
        duration: this.newService.duration || 30,
        price: this.newService.price || 0,
        description: this.newService.description || '',
        status: this.newService.status || 'active'
      });
      this.closeNewServiceModal();
    }
  }

  openEditServiceModal(service: Service): void {
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

  openAppointmentsModal(service: Service): void {
    this.selectedService = service;
    this.showAppointmentsModal = true;
  }

  closeAppointmentsModal(): void {
    this.showAppointmentsModal = false;
    this.selectedService = null;
  }
}
