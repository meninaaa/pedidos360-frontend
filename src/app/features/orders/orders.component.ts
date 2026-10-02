import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MsalService } from '@azure/msal-angular';
import { environment } from '../../../environments/environment';

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
  
  // Variables del Carrito
  productoSeleccionadoId: number | null = null;
  cantidadSeleccionada: number = 1;
  carrito: any[] = [];
  nuevoTotal: number = 0;
  
  notificacion: string | null = null;
  pedidoSeleccionado: any = null;

  constructor(private http: HttpClient, private msalService: MsalService) {}

  ngOnInit(): void {
    this.msalService.instance.handleRedirectPromise().then(() => {
      this.verificarRolYUsuario();
      this.cargarPedidos();
      this.cargarProductos();
    });
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
      endpoint = `${environment.apiUrl}/orders/customer?email=${this.userEmail}`;
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
      error: (err) => console.error('Error cargando catálogo:', err)
    });
  }

  // --- Lógica del Carrito ---
  
  onProductoChange() {
    // Solo actualiza la vista, no agrega nada aún
  }

  agregarAlCarrito() {
    if (!this.productoSeleccionadoId || this.cantidadSeleccionada < 1) return;
    
    const prod = this.productosDisponibles.find(p => p.id === Number(this.productoSeleccionadoId));
    if (prod) {
      const precio = prod.precio || prod.price || 0;
      const subtotal = precio * this.cantidadSeleccionada;
      
      this.carrito.push({
        productId: prod.id,
        nombre: prod.nombre || prod.name,
        precio: precio,
        quantity: this.cantidadSeleccionada, // Hace match con tu OrderItem.java
        subtotal: subtotal
      });
      
      this.calcularTotal();
      this.productoSeleccionadoId = null;
      this.cantidadSeleccionada = 1;
    }
  }

  quitarDelCarrito(index: number) {
    this.carrito.splice(index, 1);
    this.calcularTotal();
  }

  calcularTotal() {
    this.nuevoTotal = this.carrito.reduce((acc, item) => acc + item.subtotal, 0);
  }

  guardarPedido() {
    if (!this.nuevoCliente || this.carrito.length === 0) {
      this.mostrarNotificacion('Agrega al menos un producto al carrito.');
      return;
    }

    const payload = {
      customerId: this.nuevoCliente.trim(),
      total: this.nuevoTotal,
      items: this.carrito.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      }))
    };

    this.http.post(`${environment.apiUrl}/orders`, payload).subscribe({
      next: () => {
        this.cargarPedidos();
        this.mostrarNotificacion(`¡Orden procesada con éxito!`);
        
        if (!this.isCustomer) this.nuevoCliente = '';
        this.carrito = [];
        this.nuevoTotal = 0;
        this.mostrarFormulario = false;
      },
      error: (err) => {
        console.error('Error al crear pedido:', err);
        this.mostrarNotificacion('Error al intentar crear el pedido en el servidor.');
      }
    });
  }

  // --- Lógica de Estados y Webpay ---

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

  iniciarPagoWebpay(orderId: number, totalStr: any) {
    const totalNumerico = Number(String(totalStr).replace(/[^0-9.-]+/g,""));
    const endpoint = `${environment.apiUrl}/payments/create?amount=${totalNumerico}&orderId=${orderId}`;

    this.http.post<any>(endpoint, {}).subscribe({
      next: (response) => {
        if (response.url && response.token_ws) {
          this.redirigirATransbank(response.url, response.token_ws);
        } else {
          this.mostrarNotificacion('Transbank no respondió correctamente.');
        }
      },
      error: (err) => {
        console.error('Error al iniciar Webpay:', err);
        this.mostrarNotificacion('Falló la conexión con el servidor de pagos.');
      }
    });
  }

  redirigirATransbank(url: string, token: string) {
    const form = document.createElement('form');
    form.action = url;
    form.method = 'POST';

    const inputToken = document.createElement('input');
    inputToken.type = 'hidden';
    inputToken.name = 'token_ws';
    inputToken.value = token;

    form.appendChild(inputToken);
    document.body.appendChild(form);
    form.submit();
  }

  mostrarNotificacion(mensaje: string) {
    this.notificacion = mensaje;
    setTimeout(() => {
      this.notificacion = null;
    }, 4000);
  }

  verDetalle(pedido: any) {
    this.pedidoSeleccionado = pedido;
  }

  cerrarDetalle() {
    this.pedidoSeleccionado = null;
  }

  obtenerNombreProducto(productId: number): string {
    const prod = this.productosDisponibles.find(p => p.id === productId);
    return prod ? (prod.nombre || prod.name || 'Producto Desconocido') : 'Producto Desconocido';
  }
}