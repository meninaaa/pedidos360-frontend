import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MsalService } from '@azure/msal-angular';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './catalog.component.html',
  styleUrls: ['./catalog.component.css']
})
export class CatalogComponent implements OnInit {
  productos: any[] = [];
  
  isAdmin: boolean = false;
  isOperator: boolean = false;
  isCustomer: boolean = false;
  
  filtroTexto: string = '';
  filtroDisponibilidad: string = 'todos';

  mostrarModal = false;
  modoEdicion = false;
  productoActual: any = { id: null, nombre: '', precio: 0, stock: 0, estado: 'DISPONIBLE' };
  
  notificacion: string = '';
  productoAEliminar: any = null;

  constructor(private http: HttpClient, private msalService: MsalService) {}

  ngOnInit(): void {
    this.verificarRolYUsuario();
    this.cargarCatalogo();
  }

  mostrarNotificacion(mensaje: string) {
    this.notificacion = mensaje;
    setTimeout(() => {
      this.notificacion = '';
    }, 3500);
  }

  verificarRolYUsuario() {
    const accounts = this.msalService.instance.getAllAccounts();
    if (accounts.length > 0) {
      const account = accounts[0];
      const name = (account.name || '').toLowerCase();
      const email = (account.username || '').toLowerCase();
      const claims: any = account.idTokenClaims;
      const roles = claims?.roles || []; 

      const hasAdminRole = roles.includes('Administrador') || roles.includes('Admin');
      const hasOperatorRole = roles.includes('Operador de Logística') || roles.includes('Operador');
      const isExplicitClient = name.includes('cliente') || email.includes('cliente') || roles.includes('Cliente') || roles.includes('Customer');

      if (isExplicitClient) {
        this.isAdmin = false;
        this.isOperator = false;
        this.isCustomer = true;
      } else if (hasAdminRole) {
        this.isAdmin = true;
        this.isOperator = false;
        this.isCustomer = false;
      } else if (hasOperatorRole) {
        this.isAdmin = false;
        this.isOperator = true;
        this.isCustomer = false;
      } else {
        this.isAdmin = false;
        this.isOperator = false;
        this.isCustomer = true;
      }
    } else {
      this.isAdmin = false;
      this.isOperator = false;
      this.isCustomer = true;
    }
  }

  cargarCatalogo() {
    this.http.get<any>(`${environment.apiUrl}/catalog`).subscribe({
      next: (res) => this.procesarRespuestaCatalogo(res),
      error: () => {
        this.http.get<any>(`${environment.apiUrl}/catalog/products`).subscribe({
          next: (resProducts) => this.procesarRespuestaCatalogo(resProducts),
          error: (err) => console.error('Error cargando catálogo:', err)
        });
      }
    });
  }

  procesarRespuestaCatalogo(res: any) {
    if (Array.isArray(res)) {
      this.productos = res;
    } else if (res && Array.isArray(res.content)) {
      this.productos = res.content;
    } else if (res && Array.isArray(res.items)) {
      this.productos = res.items;
    } else {
      this.productos = [];
    }
  }

  getStock(p: any): number {
    return Number(p.stock !== undefined ? p.stock : (p.inventory !== undefined ? p.inventory : 0));
  }

  get productosFiltrados() {
    return this.productos.filter(p => {
      const nombre = (p.nombre || p.name || '').toLowerCase();
      const idStr = String(p.id || '');
      const textoMatch = !this.filtroTexto || nombre.includes(this.filtroTexto.toLowerCase()) || idStr.includes(this.filtroTexto);
      
      const stockActual = this.getStock(p);
      
      let disponibilidadMatch = true;
      if (this.filtroDisponibilidad === 'disponible') {
        disponibilidadMatch = (stockActual >= 10);
      } else if (this.filtroDisponibilidad === 'bajo') {
        disponibilidadMatch = (stockActual > 0 && stockActual < 10);
      } else if (this.filtroDisponibilidad === 'agotado') {
        disponibilidadMatch = (stockActual === 0);
      }
      
      return textoMatch && disponibilidadMatch;
    });
  }

  abrirModalNuevo() {
    if (!this.isAdmin) return;
    this.modoEdicion = false;
    this.productoActual = { id: null, nombre: '', precio: 0, stock: 0, estado: 'DISPONIBLE' };
    this.mostrarModal = true;
  }

  abrirModalEditar(prod: any) {
    if (!this.isAdmin) return;
    this.modoEdicion = true;
    this.productoActual = { ...prod };
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
  }

  guardarProducto() {
    if (!this.isAdmin) return;
    const id = this.productoActual.id;
    if (this.modoEdicion) {
      this.http.put(`${environment.apiUrl}/catalog/${id}`, this.productoActual).subscribe({
        next: () => { 
          this.cargarCatalogo(); 
          this.cerrarModal(); 
          this.mostrarNotificacion('Producto actualizado exitosamente.'); 
        },
        error: () => {
          this.http.put(`${environment.apiUrl}/catalog/products/${id}`, this.productoActual).subscribe({
            next: () => { 
              this.cargarCatalogo(); 
              this.cerrarModal(); 
              this.mostrarNotificacion('Producto actualizado exitosamente.'); 
            },
            error: (err) => console.error('Error actualizando producto:', err)
          });
        }
      });
    } else {
      this.http.post(`${environment.apiUrl}/catalog`, this.productoActual).subscribe({
        next: () => { 
          this.cargarCatalogo(); 
          this.cerrarModal(); 
          this.mostrarNotificacion('Producto creado exitosamente.'); 
        },
        error: () => {
          this.http.post(`${environment.apiUrl}/catalog/products`, this.productoActual).subscribe({
            next: () => { 
              this.cargarCatalogo(); 
              this.cerrarModal(); 
              this.mostrarNotificacion('Producto creado exitosamente.'); 
            },
            error: (err) => console.error('Error creando producto:', err)
          });
        }
      });
    }
  }

  prepararEliminacion(producto: any) {
    if (!this.isAdmin) return;
    this.productoAEliminar = producto;
  }

  cancelarEliminacion() {
    this.productoAEliminar = null;
  }

  confirmarEliminacion() {
    if (!this.productoAEliminar) return;

    const id = this.productoAEliminar.id;
    this.http.delete(`${environment.apiUrl}/catalog/${id}`).subscribe({
      next: () => {
        this.productoAEliminar = null;
        this.cargarCatalogo();
        this.mostrarNotificacion('Producto eliminado exitosamente.');
      },
      error: () => {
        this.http.delete(`${environment.apiUrl}/catalog/products/${id}`).subscribe({
          next: () => {
            this.productoAEliminar = null;
            this.cargarCatalogo();
            this.mostrarNotificacion('Producto eliminado exitosamente.');
          },
          error: () => {
            this.http.delete(`${environment.apiUrl}/products/${id}`).subscribe({
              next: () => {
                this.productoAEliminar = null;
                this.cargarCatalogo();
                this.mostrarNotificacion('Producto eliminado exitosamente.');
              },
              error: (err3) => {
                console.error('Error eliminando producto:', err3);
                this.productoAEliminar = null;
              }
            });
          }
        });
      }
    });
  }
}