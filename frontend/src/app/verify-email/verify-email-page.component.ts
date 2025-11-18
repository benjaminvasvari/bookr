import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../feautures/auth/services/auth.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './verify-email-page.component.html',
  styleUrls: ['./verify-email-page.component.css']
})
export class VerifyEmailComponent implements OnInit {
  isVerifying = true;
  isSuccess = false;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Token kinyerése az URL query param-ból
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      
      if (token) {
        this.verifyEmail(token);
      } else {
        this.isVerifying = false;
        this.errorMessage = 'Hiányzó ellenőrző token';
      }
    });
  }

  verifyEmail(token: string): void {
    this.authService.verifyEmail(token).subscribe({
      next: (response) => {
        this.isVerifying = false;
        this.isSuccess = true;
        
        // 3 másodperc után átirányítás login oldalra
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
      },
      error: (error) => {
        this.isVerifying = false;
        this.isSuccess = false;
        
        // Error handling
        if (error.status === 400) {
          this.errorMessage = 'Érvénytelen vagy lejárt ellenőrző kód';
        } else if (error.status === 404) {
          this.errorMessage = 'A felhasználó nem található';
        } else {
          this.errorMessage = error.message || 'Hiba történt az email megerősítése során';
        }
      }
    });
  }

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }
}