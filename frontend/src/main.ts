import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, Routes } from '@angular/router';

import { AppComponent } from './app/app.component';
import { MainPageComponent } from './app/main-page/main-page.component';
import { LoginPageComponent } from './app/login-page/login-page.component';
import { RegisterComponent } from './app/register-page/register-page.component';
import { SelIndustryComponent } from './app/sel-industry/sel-industry.component';  

const routes: Routes = [
  { path: '', component: MainPageComponent },
  { path: 'login', component: LoginPageComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'sel-industry/:id', component: SelIndustryComponent },
  
];

bootstrapApplication(AppComponent, {
  providers: [provideRouter(routes)],
}).catch((err) => console.error(err));
