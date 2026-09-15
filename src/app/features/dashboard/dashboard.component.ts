import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MsalService } from '@azure/msal-angular';
import { RouterModule } from '@angular/router';

interface Pedido {
  id: number;
  customerId: string;
  status: string;
  total: number;
  createdAt: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  resumenAdmin = { ventasTotales: 0, pedidosActivos: 0, usuariosActivos: 0 };
  pedidosOperador: Pedido[] = [];
  pedidosCliente: Pedido[] = [];

  userName = '';
  userRoles: string[] = [];

  isAdmin = false;
  isOperator = false;
  isCustomer = false;

  constructor(private http: HttpClient, private authService: MsalService) {}

  ngOnInit(): void {
    this.cargarUsuario();

    if (this.isAdmin) {
      this.cargarResumenAdmin();
    }
    if (this.isOperator) {
      this.cargarPedidosOperador();
    }
    if (this.isCustomer) {
      this.cargarPedidosCliente();
    }
  }

  cargarUsuario() {
    const account = this.authService.instance.getActiveAccount() || this.authService.instance.getAllAccounts()[0];
    if (account) {
      this.userName = account.name || 'Usuario';
      this.userRoles = (account.idTokenClaims?.['roles'] as string[]) || [];

      this.isAdmin = this.userRoles.includes('Admin');
      this.isOperator = this.userRoles.includes('Operador');
      this.isCustomer = this.userRoles.includes('Cliente');
    }
  }

  cargarResumenAdmin() {
    this.http.get<any>('http://localhost:8080/api/bff/reports/summary').subscribe({
      next: (data) => {
        this.resumenAdmin.ventasTotales = data.ventasTotales;
        this.resumenAdmin.pedidosActivos = data.pedidosActivos;
      },
      error: (err) => console.error('Error cargando resumen admin:', err)
    });

    this.http.get<Pedido[]>('http://localhost:8080/api/bff/orders').subscribe({
      next: (pedidos) => {
        const clientesUnicos = new Set(pedidos.map(p => p.customerId));
        this.resumenAdmin.usuariosActivos = clientesUnicos.size;
      },
      error: (err) => console.error('Error calculando usuarios activos:', err)
    });
  }

  cargarPedidosOperador() {
    this.http.get<Pedido[]>('http://localhost:8080/api/bff/orders/pending').subscribe({
      next: (pedidos) => this.pedidosOperador = pedidos,
      error: (err) => console.error('Error cargando pedidos pendientes:', err)
    });
  }

  cargarPedidosCliente() {
    this.http.get<Pedido[]>('http://localhost:8080/api/bff/orders/me').subscribe({
      next: (pedidos) => this.pedidosCliente = pedidos,
      error: (err) => console.error('Error cargando mis pedidos:', err)
    });
  }
}