import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MsalService } from '@azure/msal-angular';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './orders.component.html'
})
export class OrdersComponent implements OnInit {
  pedidos: any[] = [];
  productosDisponibles: any[] = []; // Lista para el selector de productos
  
  // Variables para control de roles
  isAdmin: boolean = false;
  isOperator: boolean = false;
  isCustomer: boolean = false;
  userEmail: string = '';

  // Variables para controlar el formulario
  mostrarFormulario: boolean = false;
  nuevoCliente: string = '';
  productoSeleccionadoId: number | null = null;
  nuevoTotal: number | null = null;
  notificacion: string | null = null;

  constructor(private http: HttpClient, private msalService: MsalService) {}

  ngOnInit(): void {
    this.verificarRolYUsuario();
    this.cargarPedidos();
    this.cargarProductos(); // Cargamos el catálogo para el formulario
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
    let endpoint = 'http://localhost:8080/api/bff/orders';
    
    if (this.isCustomer) {
      endpoint = 'http://localhost:8080/api/bff/orders/me';
    } else if (this.isOperator) {
      endpoint = 'http://localhost:8080/api/bff/orders/pending';
    }

    this.http.get<any[]>(endpoint).subscribe({
      next: (data) => this.pedidos = data || [],
      error: (err) => console.error('Error cargando pedidos:', err)
    });
  }

  cargarProductos() {
    // Obtenemos los productos disponibles desde el BFF de catálogo
    this.http.get<any[]>('http://localhost:8080/api/bff/catalog/products').subscribe({
      next: (data) => this.productosDisponibles = data || [],
      error: (err) => console.error('Error cargando catálogo para pedidos:', err)
    });
  }

  onProductoChange() {
    // Autocompleta el precio total al seleccionar un producto
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

    this.http.post('http://localhost:8080/api/bff/orders', payload).subscribe({
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
    this.http.put(`http://localhost:8080/api/bff/orders/${id}/status?nuevoEstado=${nuevoEstado}`, {}).subscribe({
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