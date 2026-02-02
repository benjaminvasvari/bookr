import { ownerGuard } from './core/guards/owner-guard';
import { Routes } from '@angular/router';


import { MainPageComponent } from './main-page/main-page.component';
import { LearnmorePageComponent } from './learnmore-page/learnmore-page.component';
import { LoginPageComponent } from './login-page/login-page.component';
import { RegisterComponent } from './register-page/register-page.component';
import { SelIndustryComponent } from './sel-industry/sel-industry.component';
import { AppointmentComponent } from './appointment/appointment.component';
import { AppointmentSelectComponent } from './appointment-select/appointment-select.component';
import { VerifyEmailComponent } from './verify-email/verify-email.component';
import { ProfileComponent } from './profile/profile.component';
import { AppointmentPaymentComponent } from './appointment-payment/appointment-payment.component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { ResetPasswordComponent } from './reset-password/reset-password.component';

export const appRoutes: Routes = [
  {
    path: '',
    component: MainPageComponent,
    data: { showFooter: true },
  },
  {
    path: 'learnmore',
    component: LearnmorePageComponent,
    data: { showFooter: true },
  },
  {
    path: 'login',
    component: LoginPageComponent,
    data: { showFooter: false },
  },
  {
    path: 'register',
    component: RegisterComponent,
    data: { showFooter: false },
  },
  {
    path: 'verify-email',
    component: VerifyEmailComponent,
    data: { showFooter: false },
  },
  {
    path: 'profile',
    component: ProfileComponent,
    data: { showFooter: false },
    canActivate: [authGuard],
  },
  {
    path: 'sel-industry/:id',
    component: SelIndustryComponent,
    data: { showFooter: true },
  },
  {
    path: 'appointment/:companyId/services',
    component: AppointmentComponent,
    data: { showFooter: false },
  },
  {
    path: 'appointment/:companyId/specialists',
    component: AppointmentSelectComponent,
    data: { showFooter: false },
  },
  {
    path: 'appointment-payment/:companyId',
    component: AppointmentPaymentComponent,
    data: { showFooter: false },
  },
  {
    path: 'reset-password',
    component: ResetPasswordComponent,
    data: { showFooter: false },
    canActivate: [authGuard],
  },
  {
    path: 'staff/dashboard',
    loadComponent: () =>
      import('./features/staff-dashboard/staff-dashboard.component').then(
        (m) => m.StaffDashboardComponent
      ),
    canActivate: [authGuard, roleGuard],
    data: { showFooter: false, roles: ['staff'] },
  },

  {
    path: 'register-business',
    loadComponent: () =>
      import('./features/company-registration/company-registration-container/company-registration-container.component').then(
        (m) => m.CompanyRegistrationContainerComponent,
      ),
    data: { showFooter: false },
  },


  {
    path: 'owner',
    loadComponent: () =>
      import('./features/owner-dashboard/owner-dashboard/owner-dashboard.component').then(
        (m) => m.OwnerDashboardComponent
      ),
    canActivate: [authGuard, ownerGuard],
    data: { showFooter: false, showHeader: false },
    children: [
      {
        path: '',
        redirectTo: 'overview',
        pathMatch: 'full'
      },
      {
        path: 'overview',
        loadComponent: () =>
          import('./features/owner-dashboard/pages/overview/overview/overview.component').then(
            (m) => m.OverviewComponent
          )
      },
      {
        path: 'calendar',
        loadComponent: () =>
          import('./features/owner-dashboard/pages/calendar/calendar.component/calendar.component').then(
            (m) => m.CalendarComponent
          )
      },
      {
        path: 'staff',
        loadComponent: () =>
          import('./features/owner-dashboard/pages/staff/staff.component/staff.component').then(
            (m) => m.StaffComponent
          )
      },
      {
        path: 'clients/:id',
        loadComponent: () =>
          import('./features/owner-dashboard/pages/clients/client-detail/client-detail.component').then(
            (m) => m.ClientDetailComponent
          )
      },
      {
        path: 'clients',
        loadComponent: () =>
          import('./features/owner-dashboard/pages/clients/clients.component/clients.component').then(
            (m) => m.ClientsComponent
          )
      },
      {
        path: 'services',
        loadComponent: () =>
          import('./features/owner-dashboard/pages/services/services.component/services.component').then(
            (m) => m.ServicesComponent
          )
      },
      {
        path: 'sales',
        loadComponent: () =>
          import('./features/owner-dashboard/pages/sales/sales.component/sales.component').then(
            (m) => m.SalesComponent
          )
      },
      {
        path: 'reviews',
        loadComponent: () =>
          import('./features/owner-dashboard/pages/reviews/reviews.component/reviews.component').then(
            (m) => m.ReviewsComponent
          )
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/owner-dashboard/pages/settings/settings.component/settings.component').then(
            (m) => m.SettingsComponent
          )
      }
    ]
  },
];
