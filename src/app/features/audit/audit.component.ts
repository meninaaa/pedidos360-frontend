import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

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
    this.http.get<any[]>('http://localhost:8080/api/bff/audit').subscribe({
      next: (res) => {
        // Ordenamos para que los registros más nuevos (por ID descendente o fecha) queden arriba
        const lista = res || [];
        this.eventos = lista.sort((a, b) => {
          // Si tienen ID numérico, ordenamos por ID de mayor a menor
          if (b.id && a.id) {
            return b.id - a.id;
          }
          // Fallback ordenando por fecha/timestamp si no hay ID
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        });
      },
      error: (err) => console.error('Error cargando auditoría:', err)
    });
  }

  get eventosFiltrados() {
    return this.eventos.filter(e => {
      const matchUsuario = !this.filtroUsuario || (e.actor || '').toLowerCase().includes(this.filtroUsuario.toLowerCase());
      const matchFecha = !this.filtroFecha || (e.timestamp || '').includes(this.filtroFecha);
      const matchTipo = !this.filtroTipo || (e.eventType || '').toLowerCase().includes(this.filtroTipo.toLowerCase());
      return matchUsuario && matchFecha && matchTipo;
    });
  }
}