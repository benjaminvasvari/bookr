import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profile-favorites',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="profile-section">
      <h1>Kedvencek</h1>
      <p>Coming soon...</p>
    </div>
  `,
  styles: [`
    .profile-section {
      background: white;
      padding: 32px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
  `]
})
export class ProfileFavoritesComponent {}