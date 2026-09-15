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
  // Ruta por defecto redirige al login si no hay sesión, o al dashboard si la hay
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  
  // Login es público
  { path: 'login', component: LoginComponent },
  
  // MSAL necesita una ruta limpia sin guards para aterrizar después del login en Azure
  { path: 'auth/callback', component: LoginComponent }, 

  // Rutas Privadas
  { path: 'dashboard', component: DashboardComponent, canActivate: [MsalGuard] },
  
  // Gestión de pedidos (Tienen acceso los 3, usando los nombres exactos de Azure)
  { 
    path: 'orders', 
    component: OrdersComponent, 
    canActivate: [MsalGuard, RoleGuard], 
    data: { roles: ['Administrador', 'Admin', 'Operador de Logística', 'Operador', 'Cliente', 'Customer'] } 
  },
  
  // Catálogo (Tienen acceso el Admin para gestionar y el Cliente para comprar)
  { 
    path: 'catalog', 
    component: CatalogComponent, 
    canActivate: [MsalGuard, RoleGuard], 
    data: { roles: ['Administrador', 'Admin', 'Cliente', 'Customer'] } 
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