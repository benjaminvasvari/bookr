import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

import { StaffSidebarComponent } from '../sidebar/staff-sidebar/staff-sidebar.component';

@Component({
  selector: 'app-staff-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, StaffSidebarComponent],
  templateUrl: './staff-shell.component.html',
  styleUrls: ['./staff-shell.component.css'],
})
export class StaffShellComponent {}
