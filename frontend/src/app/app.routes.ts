import { Routes } from '@angular/router';

import { MainPageComponent } from './main-page/main-page.component';
import { LoginPageComponent } from './login-page/login-page.component';
import { RegisterComponent } from './register-page/register-page.component';
import { SelIndustryComponent } from './sel-industry/sel-industry.component';
import { AppointmentComponent } from './appointment/appointment.component';
import { AppointmentSelectComponent } from './appointment-select/appointment-select.component';

export const appRoutes: Routes = [
  { path: '', component: MainPageComponent },
  { path: 'login', component: LoginPageComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'sel-industry/:id', component: SelIndustryComponent },
  { path: 'appointment/:companyId/services', component: AppointmentComponent },
  { path: 'appointment/:companyId/specialists', component: AppointmentSelectComponent },
];
