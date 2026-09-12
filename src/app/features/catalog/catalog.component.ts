import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './catalog.component.html',
  styleUrls: ['./catalog.component.css']
})
export class CatalogComponent implements OnInit {
  productos: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.cargarCatalogo();
  }

  cargarCatalogo() {
    this.http.get<any>('http://localhost:8080/api/bff/catalog/products').subscribe({
      next: (res) => {
        this.productos = res;
      },
      error: (err) => {
        console.error('Error cargando el catálogo desde el BFF:', err);
      }
    });
  }
}