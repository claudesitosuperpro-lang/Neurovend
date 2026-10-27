import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { duenoGuard } from './core/guards/dueno.guard';

const routes: Routes = [
  { path: '', redirectTo: '/pos', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'pos',
    loadComponent: () => import('./features/pos/pos.component').then(m => m.PosComponent),
    canActivate: [authGuard],
  },
  {
    path: 'productos',
    loadComponent: () => import('./features/gestion-productos/gestion-productos.component').then(m => m.GestionProductosComponent),
    canActivate: [authGuard, duenoGuard],
  },
  {
    path: 'reportes',
    loadComponent: () => import('./features/reportes/reportes.component').then(m => m.ReportesComponent),
    canActivate: [authGuard, duenoGuard],
  },
  {
    path: 'usuarios',
    loadComponent: () => import('./features/usuarios/registro-usuario.component').then(m => m.RegistroUsuarioComponent),
    canActivate: [authGuard, duenoGuard],
  },
  {
    path: 'configuracion',
    loadComponent: () => import('./features/configuracion/configuracion.component').then(m => m.ConfiguracionComponent),
    canActivate: [authGuard, duenoGuard],
  },
  {
    path: 'mis-ventas',
    loadComponent: () => import('./features/mis-ventas/mis-ventas.component').then(m => m.MisVentasComponent),
    canActivate: [authGuard],
  },
  { path: '**', redirectTo: '/pos' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
