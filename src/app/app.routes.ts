import { Routes } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';
import { RoleGuard } from './core/guards/role.guard';

import { LoginComponent } from './features/login/login.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { OrdersComponent } from './features/orders/orders.component';
import { CatalogComponent } from './features/catalog/catalog.component';
import { ReportsComponent } from './features/reports/reports.component';
import { AuditComponent } from './features/audit/audit.component';
import { KafkaAdminComponent } from './features/kafka-admin/kafka-admin.component';
import { PaymentResultComponent } from './features/orders/payment-result.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'auth/callback', component: LoginComponent },
  { path: 'payment-result', component: PaymentResultComponent },

  { path: 'dashboard', component: DashboardComponent, canActivate: [MsalGuard] },

  {
    path: 'orders',
    component: OrdersComponent,
    canActivate: [MsalGuard, RoleGuard],
    data: { roles: ['Administrador', 'Admin', 'Operador de Logística', 'Operador', 'Cliente', 'Customer'] }
  },

  {
    path: 'catalog',
    component: CatalogComponent,
    canActivate: [MsalGuard, RoleGuard],
    data: { roles: ['Administrador', 'Admin', 'Operador de Logística', 'Operador', 'Cliente', 'Customer'] }
  },

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
  {
    path: 'kafka-admin',
    component: KafkaAdminComponent,
    canActivate: [MsalGuard, RoleGuard],
    data: { roles: ['Administrador', 'Admin'] }
  },

  { path: '**', redirectTo: '/login' }
];