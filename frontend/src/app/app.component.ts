import { Component } from '@angular/core';
import { MainPageComponent } from './main-page/main-page.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [MainPageComponent],
  template: `
    <app-main-page></app-main-page>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
    }
  `]
})
export class AppComponent {
  title = 'bookr-app';
}