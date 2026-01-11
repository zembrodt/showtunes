import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ErrorComponent } from './components/error/error.component';
import { LandingComponent } from './components/landing/landing.component';
import { LoginComponent } from './components/login/login.component';
import { CallbackComponent } from './components/callback/callback.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { SpotifyAuthGuard } from './core/auth/spotify-auth.guard';

const routes: Routes = [
  { path: '', redirectTo: '/landing', pathMatch: 'full' },
  { path: 'callback', redirectTo: '/landing', pathMatch: 'full' },
  { path: 'callback/:type', component: CallbackComponent },
  { path: 'landing', component: LandingComponent },
  { path: 'dashboard', redirectTo: '/landing', pathMatch: 'full'},
  { path: 'dashboard/:type', component: DashboardComponent, canActivate: [SpotifyAuthGuard] },
  { path: 'error', component: ErrorComponent },
  { path: 'login', component: LoginComponent }
];

@NgModule({
  declarations: [],
  imports: [
    RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' })
  ],
  exports: [RouterModule],
  providers: [SpotifyAuthGuard]
})
export class AppRoutingModule { }
