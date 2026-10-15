import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { MsalService } from '@azure/msal-angular';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  userName: string = '';
  userRoleStr: string = '';
  
  isAdmin: boolean = false;
  isOperator: boolean = false;
  isCustomer: boolean = false;

  resumenAdmin: any = { ventasTotales: 0, pedidosActivos: 0, usuariosActivos: 0 };
  pedidosCliente: any[] = [];
  pedidosOperador: any[] = [];

  constructor(private http: HttpClient, private msalService: MsalService) {}

  ngOnInit(): void {
    this.verificarRolYUsuario();
    this.cargarDatosDashboard();
  }

  verificarRolYUsuario() {
    const accounts = this.msalService.instance.getAllAccounts();
    if (accounts.length > 0) {
      const account = accounts[0];
      this.userName = account.name || account.username;
      const name = (account.name || '').toLowerCase();
      const email = (account.username || '').toLowerCase();
      const claims: any = account.idTokenClaims;
      const roles = claims?.roles || []; 

      const hasAdminRole = roles.includes('Administrador') || roles.includes('Admin');
      const hasOperatorRole = roles.includes('Operador de Logística') || roles.includes('Operador');
      const isExplicitClient = name.includes('cliente') || email.includes('cliente') || roles.includes('Cliente') || roles.includes('Customer');

      if (isExplicitClient) {
        this.isAdmin = false;
        this.isOperator = false;
        this.isCustomer = true;
      } else if (hasAdminRole) {
        this.isAdmin = true;
        this.isOperator = false;
        this.isCustomer = false;
      } else if (hasOperatorRole) {
        this.isAdmin = false;
        this.isOperator = true;
        this.isCustomer = false;
      } else {
        this.isAdmin = false;
        this.isOperator = false;
        this.isCustomer = true;
      }

      if (this.isAdmin) {
        this.userRoleStr = 'Administrador';
      } else if (this.isOperator) {
        this.userRoleStr = 'Operador Logístico';
      } else {
        this.userRoleStr = 'Cliente Corporativo';
      }
    }
  }

  cargarDatosDashboard() {
    if (this.isAdmin) {
      // Carga los KPIs generales del admin
      this.http.get<any>(`${environment.apiUrl}/reports/summary`).subscribe({
        next: (res) => this.resumenAdmin = res || {},
        error: (err) => console.error('Error cargando resumen admin:', err)
      });

      // ¡Importante! El administrador también necesita los pedidos pendientes para la tabla del dashboard
      this.http.get<any[]>(`${environment.apiUrl}/orders/pending`).subscribe({
        next: (res) => this.pedidosOperador = res || [],
        error: (err) => console.error('Error cargando pendientes para admin:', err)
      });

    } else if (this.isCustomer) {
      const accounts = this.msalService.instance.getAllAccounts();
      const email = accounts.length > 0 ? accounts[0].username : '';
      this.http.get<any[]>(`${environment.apiUrl}/orders/customer?email=${email}`).subscribe({
        next: (res) => this.pedidosCliente = res || [],
        error: (err) => console.error('Error cargando pedidos de cliente:', err)
      });
    } else if (this.isOperator) {
      this.http.get<any[]>(`${environment.apiUrl}/orders/pending`).subscribe({
        next: (res) => this.pedidosOperador = res || [],
        error: (err) => console.error('Error cargando pendientes de operador:', err)
      });
    }
  }
}
