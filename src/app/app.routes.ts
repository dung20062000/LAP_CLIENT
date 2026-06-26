import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/pages/login/login.component').then((m) => m.LoginComponent),
    canActivate: [guestGuard],
  },
  {
    path: 'public',
    loadComponent: () =>
      import('./shared/components/layout/main-layout/main-layout.component').then(
        (m) => m.MainLayoutComponent,
      ),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard-page/dashboard-page.component').then(
            (m) => m.DashboardPageComponent,
          ),
      },
      {
        path: 'media',
        loadComponent: () =>
          import('./features/media/pages/media-gallery-page/media-gallery-page.component').then(
            (m) => m.MediaGalleryPageComponent,
          ),
      },
      {
        path: 'administration/vehicle-groups',
        loadComponent: () =>
          import('./features/vehicle-group-admin/pages/vehicle-group-admin-page/vehicle-group-admin-page.component').then(
            (m) => m.VehicleGroupAdminPageComponent,
          ),
      },
      {
        path: 'administration/drivers',
        loadComponent: () =>
          import('./features/drivers-admin/pages/drivers-admin-page/drivers-admin-page.component').then(
            (m) => m.DriversAdminPageComponent,
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: '/login',
  },
];
