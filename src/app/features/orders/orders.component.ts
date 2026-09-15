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
  
  // Variables para control de roles
  isAdmin: boolean = false;
  isOperator: boolean = false;
  isCustomer: boolean = false;
  userEmail: string = '';

  // Variables para controlar el formulario
  mostrarFormulario: boolean = false;
  nuevoCliente: string = '';
  nuevoTotal: number | null = null;
  notificacion: string | null = null;

  constructor(private http: HttpClient, private msalService: MsalService) {}

  ngOnInit(): void {
    this.verificarRolYUsuario();
    this.cargarPedidos();
  }

  verificarRolYUsuario() {
    const accounts = this.msalService.instance.getAllAccounts();
    if (accounts.length > 0) {
      const account = accounts[0];
      this.userEmail = account.username; // Rescata el correo con el que inició sesión
      
      const claims: any = account.idTokenClaims;
      const roles = claims?.roles || []; 

      this.isAdmin = roles.includes('Administrador') || roles.includes('Admin');
      this.isOperator = roles.includes('Operador de Logística') || roles.includes('Operador');
      
      // Si no es admin ni operador, es un cliente final
      this.isCustomer = roles.includes('Cliente') || roles.includes('Customer') || (!this.isAdmin && !this.isOperator);
      
      // Si es cliente, su ID para el formulario es su propio correo
      if (this.isCustomer) {
        this.nuevoCliente = this.userEmail;
      }
    }
  }

  cargarPedidos() {
    let endpoint = 'http://localhost:8080/api/bff/orders';
    
    // Redirección inteligente según el rol
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

  guardarPedido() {
    if (!this.nuevoCliente || !this.nuevoTotal) {
      this.mostrarNotificacion('Por favor completa todos los campos.');
      return;
    }

    const payload = {
      customerId: this.nuevoCliente.trim(),
      total: this.nuevoTotal
    };

    this.http.post('http://localhost:8080/api/bff/orders', payload).subscribe({
      next: () => {
        this.cargarPedidos();
        this.mostrarNotificacion(`¡Pedido creado con éxito!`);
        
        // Limpiamos el formulario (pero si es cliente, mantenemos su correo)
        if (!this.isCustomer) {
          this.nuevoCliente = '';
        }
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