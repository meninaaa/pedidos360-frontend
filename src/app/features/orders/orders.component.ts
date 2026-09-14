import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './orders.component.html'
})
export class OrdersComponent implements OnInit {
  pedidos: any[] = [];
  
  // Variables para controlar el formulario en la página
  mostrarFormulario: boolean = false;
  nuevoCliente: string = '';
  nuevoTotal: number | null = null;
  
  notificacion: string | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.cargarPedidos();
  }

  cargarPedidos() {
    this.http.get<any[]>('http://localhost:8080/api/bff/orders').subscribe({
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
        this.mostrarNotificacion(`¡Pedido para ${this.nuevoCliente} creado con éxito!`);
        // Limpiamos y ocultamos el formulario
        this.nuevoCliente = '';
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