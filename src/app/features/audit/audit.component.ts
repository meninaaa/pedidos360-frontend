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

  get eventosFiltrados() {
    return this.eventos.filter(e => {
      const matchUsuario = !this.filtroUsuario || (e.actor || '').toLowerCase().includes(this.filtroUsuario.toLowerCase());
      const matchFecha = !this.filtroFecha || (e.timestamp || '').includes(this.filtroFecha);
      const matchTipo = !this.filtroTipo || (e.eventType || '').toLowerCase().includes(this.filtroTipo.toLowerCase());
      return matchUsuario && matchFecha && matchTipo;
    });
  }
}
