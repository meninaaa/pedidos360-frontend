import { Routes } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';
import { RoleGuard } from './core/guards/role.guard';

import { LoginComponent } from './features/login/login.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { OrdersComponent } from './features/orders/orders.component';
import { CatalogComponent } from './features/catalog/catalog.component';
import { ReportsComponent } from './features/reports/reports.component';
import { AuditComponent } from './features/audit/audit.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'auth/callback', component: LoginComponent }, 

  // Rutas Privadas
  { path: 'dashboard', component: DashboardComponent, canActivate: [MsalGuard] },
  
  // Gestión de pedidos (Acceso Admin, Operador y Cliente)
  { 
    path: 'orders', 
    component: OrdersComponent, 
    canActivate: [MsalGuard, RoleGuard], 
    data: { roles: ['Administrador', 'Admin', 'Operador de Logística', 'Operador', 'Cliente', 'Customer'] } 
  },
  
  // Catálogo: Ahora el Operador también puede entrar a consultar, pero sin botones de edición
  { 
    path: 'catalog', 
    component: CatalogComponent, 
    canActivate: [MsalGuard, RoleGuard], 
    data: { roles: ['Administrador', 'Admin', 'Operador de Logística', 'Operador', 'Cliente', 'Customer'] } 
  },
  
  // Reportería y Auditoría (Solo Admin)
  { 
    path: 'reports', 
    component: ReportsComponent, 
    canActivate: [MsalGuard, RoleGuard], 
    data: { roles: ['Administrador', 'Admin'] } 
  },
  { 
    path: 'audit', 
    component: AuditComponent, 
    canActivate: [MsalGuard, RoleGuard], 
    data: { roles: ['Administrador', 'Admin'] } 
  },
  
  { path: '**', redirectTo: '/login' }
];