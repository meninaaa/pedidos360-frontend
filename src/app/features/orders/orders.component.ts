import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MsalService } from '@azure/msal-angular';
import { environment } from '../../../environments/environment'; // Ajusta la ruta si es necesario

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './orders.component.html'
})
export class OrdersComponent implements OnInit {
  pedidos: any[] = [];
  productosDisponibles: any[] = [];
  
  isAdmin: boolean = false;
  isOperator: boolean = false;
  isCustomer: boolean = false;
  userEmail: string = '';

  mostrarFormulario: boolean = false;
  nuevoCliente: string = '';
  productoSeleccionadoId: number | null = null;
  nuevoTotal: number | null = null;
  notificacion: string | null = null;

  constructor(private http: HttpClient, private msalService: MsalService) {}

  ngOnInit(): void {
    this.verificarRolYUsuario();
    this.cargarPedidos();
    this.cargarProductos();
  }

  verificarRolYUsuario() {
    const accounts = this.msalService.instance.getAllAccounts();
    if (accounts.length > 0) {
      const account = accounts[0];
      this.userEmail = account.username; 
      
      const claims: any = account.idTokenClaims;
      const roles = claims?.roles || []; 

      this.isAdmin = roles.includes('Administrador') || roles.includes('Admin');
      this.isOperator = roles.includes('Operador de Logística') || roles.includes('Operador');
      this.isCustomer = roles.includes('Cliente') || roles.includes('Customer') || (!this.isAdmin && !this.isOperator);
      
      if (this.isCustomer) {
        this.nuevoCliente = this.userEmail;
      }
    }
  }

  cargarPedidos() {
    let endpoint = `${environment.apiUrl}/orders`;
    
    if (this.isCustomer) {
      endpoint = `${environment.apiUrl}/orders/me`;
    } else if (this.isOperator) {
      endpoint = `${environment.apiUrl}/orders/pending`;
    }

    this.http.get<any[]>(endpoint).subscribe({
      next: (data) => this.pedidos = data || [],
      error: (err) => console.error('Error cargando pedidos:', err)
    });
  }

  cargarProductos() {
    this.http.get<any[]>(`${environment.apiUrl}/catalog/products`).subscribe({
      next: (data) => this.productosDisponibles = data || [],
      error: (err) => console.error('Error cargando catálogo para pedidos:', err)
    });
  }

  onProductoChange() {
    const prod = this.productosDisponibles.find(p => p.id === Number(this.productoSeleccionadoId));
    if (prod) {
      this.nuevoTotal = prod.precio || prod.price || 0;
    }
  }

  guardarPedido() {
    if (!this.nuevoCliente || !this.productoSeleccionadoId || !this.nuevoTotal) {
      this.mostrarNotificacion('Por favor completa todos los campos y selecciona un producto.');
      return;
    }

    const payload = {
      customerId: this.nuevoCliente.trim(),
      productId: Number(this.productoSeleccionadoId),
      total: this.nuevoTotal
    };

    this.http.post(`${environment.apiUrl}/orders`, payload).subscribe({
      next: () => {
        this.cargarPedidos();
        this.mostrarNotificacion(`¡Pedido creado con éxito!`);
        
        if (!this.isCustomer) {
          this.nuevoCliente = '';
        }
        this.productoSeleccionadoId = null;
        this.nuevoTotal = null;
        this.mostrarFormulario = false;
      },
      error: (err) => {
        console.error('Error al crear pedido:', err);
        this.mostrarNotificacion('Error al intentar crear el pedido en el servidor.');
      }
    });
  }

  cambiarEstado(id: number, nuevoEstado: string) {
    this.http.put(`${environment.apiUrl}/orders/${id}/status?nuevoEstado=${nuevoEstado}`, {}).subscribe({
      next: () => {
        this.cargarPedidos();
        this.mostrarNotificacion(`Pedido #${id} actualizado a ${nuevoEstado}.`);
      },
      error: (err) => {
        console.error('Error cambiando estado:', err);
        this.mostrarNotificacion('No se pudo cambiar el estado del pedido.');
      }
    });
  }

  mostrarNotificacion(mensaje: string) {
    this.notificacion = mensaje;
    setTimeout(() => {
      this.notificacion = null;
    }, 4000);
  }
}
