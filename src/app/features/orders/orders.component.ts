import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MsalService } from '@azure/msal-angular';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.css']
})
export class OrdersComponent implements OnInit {
  pedidos: any[] = [];
  
  // Variables de roles
  isAdmin = false;
  isOperator = false;
  isCustomer = false;

  constructor(private http: HttpClient, private authService: MsalService) {}

  ngOnInit(): void {
    this.verificarRoles();
    this.cargarPedidos();
  }

  verificarRoles() {
    const account = this.authService.instance.getActiveAccount() || this.authService.instance.getAllAccounts()[0];
    if (account) {
      // Se eliminó el bypass: Ahora lee estrictamente los roles inyectados por Azure AD
      const userRoles = (account.idTokenClaims?.['roles'] as string[]) || [];
      
      this.isAdmin = userRoles.includes('Admin');
      this.isOperator = userRoles.includes('Operador') || userRoles.includes('Operator');
      this.isCustomer = userRoles.includes('Cliente') || userRoles.includes('Customer');
      
      console.log('Roles detectados por Azure AD:', userRoles);
    }
  }

  cargarPedidos() {
    this.http.get<any[]>('http://localhost:8080/api/bff/orders').subscribe({
      next: (res) => {
        this.pedidos = res;
      },
      error: (err) => {
        console.error('Error cargando pedidos desde el BFF:', err);
      }
    });
  }

  cambiarEstado(pedidoId: string, nuevoEstado: string) {
    // Llamada al BFF a través de PUT enviando el nuevo estado
    this.http.put(`http://localhost:8080/api/bff/orders/${pedidoId}/status?nuevoEstado=${nuevoEstado}`, {}).subscribe({
      next: (res) => {
        console.log(`Estado del pedido ${pedidoId} actualizado exitosamente a ${nuevoEstado}`);
        // Recargamos la lista para reflejar el cambio en la tabla de inmediato
        this.cargarPedidos();
      },
      error: (err) => {
        console.error('Error al actualizar el estado del pedido:', err);
        alert('No se pudo actualizar el estado. Verifica tus permisos de rol.');
      }
    });
  }
}