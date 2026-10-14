import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-audit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './audit.component.html'
})
export class AuditComponent implements OnInit {
  eventos: any[] = [];
  
  filtroUsuario: string = '';
  filtroFecha: string = '';
  filtroTipo: string = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.cargarEventos(); 
  }

  cargarEventos() {
    this.http.get<any[]>(`${environment.apiUrl}/audit`).subscribe({
      next: (res) => {
        const lista = res || [];
        this.eventos = lista.sort((a, b) => {
          if (b.id && a.id) {
            return b.id - a.id;
          }
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        });
      },
      error: (err) => console.error('Error cargando auditoría:', err)
    });
  }

  // Métodos inteligentes para formatear títulos dinámicos a partir del payload JSON
  obtenerTitulo(log: any): string {
    try {
      const data = JSON.parse(log.payload);
      const orderId = data.orderId || data.id;
      const status = data.status;
      
      if (orderId && status) {
        return `Pedido #${orderId} cambió a ${status}`;
      }
      if (orderId && data.total) {
        return `Operación registrada para Pedido #${orderId}`;
      }
    } catch (e) {
      // Si el payload no es JSON puro
    }
    return log.eventType || 'Registro de Auditoría del Sistema';
  }

  obtenerSubtitulo(log: any): string {
    try {
      const data = JSON.parse(log.payload);
      const cliente = data.customerId ? ` · ${data.customerId}` : '';
      const monto = data.total ? ` · $${data.total.toLocaleString()}` : '';
      return `${log.actor || 'SYSTEM'} · ${cliente}${monto}`;
    } catch (e) {
      return `${log.actor || 'SYSTEM'}`;
    }
  }

  get eventosFiltrados() {
    return this.eventos.filter(e => {
      const actor = (e.actor || '').toLowerCase();
      const timestamp = (e.timestamp || '');
      const eventType = (e.eventType || '').toLowerCase();
      const titulo = this.obtenerTitulo(e).toLowerCase();

      const matchUsuario = !this.filtroUsuario || actor.includes(this.filtroUsuario.toLowerCase());
      const matchFecha = !this.filtroFecha || timestamp.includes(this.filtroFecha);
      const matchTipo = !this.filtroTipo || eventType.includes(this.filtroTipo.toLowerCase()) || titulo.includes(this.filtroTipo.toLowerCase());
      
      return matchUsuario && matchFecha && matchTipo;
    });
  }
}