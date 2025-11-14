import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.css']
})
export class LoginPageComponent {
  email: string = '';
  password: string = '';

  constructor(private router: Router) {}

  onSubmit(): void {
    if (this.email && this.password) {
      // TODO: Implement authentication logic
      console.log('Login attempt:', { email: this.email, password: this.password });
      // Navigate to dashboard after successful login
      // this.router.navigate(['/dashboard']);
    }
  }

  navigateToRegister(): void {
    this.router.navigate(['/register']);
  }
}