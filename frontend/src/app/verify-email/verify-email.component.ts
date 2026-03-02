import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './verify-email.component.html',
  styleUrls: ['./verify-email.component.css']
})
export class VerifyEmailComponent implements OnInit {
  isVerifying = true;
  isSuccess = false;
  errorMessage = '';
  token: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Token lekérése az URL query param-ből
    this.token = this.route.snapshot.queryParamMap.get('token');

    if (!this.token) {
      // Nincs token az URL-ben
      this.isVerifying = false;
      this.errorMessage = 'Hiányzó vagy érvénytelen megerősítő link.';
      return;
    }

    // Automatikus email verification
    this.verifyEmail();
  }

  verifyEmail(): void {
    if (!this.token) return;

    this.isVerifying = true;
    this.errorMessage = '';

    this.authService.verifyEmail(this.token).subscribe({
      next: (response) => {
        this.isVerifying = false;

        if (response.status === 'success') {
          // Sikeres email verification
          this.isSuccess = true;

          // 3 másodperc után navigálás a login oldalra
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 3000);
        } else {
          this.errorMessage = 'Email megerősítése sikertelen. Kérlek próbáld újra.';
        }
      },
      error: (error) => {
        this.isVerifying = false;

        // Hibaüzenet beállítása
        if (error.message) {
          this.errorMessage = error.message;
        } else {
          this.errorMessage = 'Email megerősítése sikertelen. A link lehet hibás vagy lejárt.';
        }

        console.error('Email verification error:', error);
      }
    });
  }

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }

  navigateToRegister(): void {
    this.router.navigate(['/register']);
  }
}