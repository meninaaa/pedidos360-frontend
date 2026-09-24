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
  
  mostrarModal = false;
  modoEdicion = false;
  productoActual: any = { id: null, nombre: '', precio: 0, stock: 0, estado: 'DISPONIBLE' };

  constructor(private http: HttpClient, private msalService: MsalService) {}

  ngOnInit(): void {
    this.verificarRol();
    this.cargarCatalogo();
  }

  verificarRol() {
    const accounts = this.msalService.instance.getAllAccounts();
    if (accounts.length > 0) {
      const account = accounts[0];
      const claims: any = account.idTokenClaims;
      const roles = claims?.roles || []; 

      this.isAdmin = roles.includes('Administrador') || roles.includes('Admin');
    }
  }

  cargarCatalogo() {
    this.http.get<any[]>(`${environment.apiUrl}/catalog/products`).subscribe({
      next: (res) => {
        this.productos = res || [];
      },
      error: (err) => {
        console.error('Error cargando el catálogo desde el BFF:', err);
      }
    });
  }

  abrirModalNuevo() {
    this.modoEdicion = false;
    this.productoActual = { id: null, nombre: '', precio: 0, stock: 0, estado: 'DISPONIBLE' };
    this.mostrarModal = true;
  }

  abrirModalEditar(prod: any) {
    this.modoEdicion = true;
    this.productoActual = { ...prod };
    this.productoActual.nombre = prod.nombre || prod.name;
    this.productoActual.precio = prod.precio || prod.price;
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
  }

  guardarProducto() {
    if (this.modoEdicion) {
      this.http.put(`${environment.apiUrl}/catalog/products/${this.productoActual.id}`, this.productoActual).subscribe({
        next: () => {
          this.cargarCatalogo();
          this.cerrarModal();
        },
        error: (err) => {
          console.error('Error al actualizar en el servidor:', err);
          alert('Error al actualizar el producto en la base de datos.');
        }
      });
    } else {
      this.http.post(`${environment.apiUrl}/catalog/products`, this.productoActual).subscribe({
        next: () => {
          this.cargarCatalogo();
          this.cerrarModal();
        },
        error: (err) => {
          console.error('Error al crear en el servidor:', err);
          alert('Error al crear el producto en la base de datos.');
        }
      });
    }
  }

  eliminarProducto(id: number) {
    if (confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      this.http.delete(`${environment.apiUrl}/catalog/products/${id}`).subscribe({
        next: () => {
          this.cargarCatalogo();
        },
        error: (err) => {
          console.error('Error al eliminar en el servidor:', err);
          alert('No se pudo eliminar el producto.');
        }
      });
    }
  }
}
