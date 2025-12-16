import { Routes } from '@angular/router';

import { MainPageComponent } from './main-page/main-page.component';
import { LoginPageComponent } from './login-page/login-page.component';
import { RegisterComponent } from './register-page/register-page.component';
import { SelIndustryComponent } from './sel-industry/sel-industry.component';
import { AppointmentComponent } from './appointment/appointment.component';
import { AppointmentSelectComponent } from './appointment-select/appointment-select.component';
import { VerifyEmailComponent } from './verify-email/verify-email.component';
import { ProfileComponent } from './profile/profile.component';
import { AppointmentPaymentComponent } from './appointment-payment/appointment-payment.component';

export const appRoutes: Routes = [
  {
    path: '',
    component: MainPageComponent,
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
  },
  {
    path: 'sel-industry/:id',
    component: SelIndustryComponent,
    data: { showFooter: true },
  },
  {
    path: 'appointment/:companyId/services',
    component: AppointmentComponent,
    data: { showFooter: true },
  },
  {
    path: 'appointment/:companyId/specialists',
    component: AppointmentSelectComponent,
    data: { showFooter: true },
  },
  {
    path: 'appointment-payment/:companyId',
    component: AppointmentPaymentComponent
  },
];
