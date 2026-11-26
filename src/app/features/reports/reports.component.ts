import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ReportService, ResumenKpis, PuntoVentaPorHora, PuntoLeadTime } from '../../core/report.service';
import { SalesChartComponent } from './grafics/sales-chart.component';
import { LeadTimeChartComponent } from './grafics/lead-time-chart.component';
import { TopProductsChartComponent } from './grafics/top-products-chart.component';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, SalesChartComponent, LeadTimeChartComponent, TopProductsChartComponent],
  templateUrl: './reports.component.html'
})
export class ReportsComponent implements OnInit {
  resumen: ResumenKpis = { promedioLeadTime: 0, pedidosActivos: 0, ventasTotales: 0 };
  ventasPorHora: PuntoVentaPorHora[] = [];
  leadTimeTrend: PuntoLeadTime[] = [];
  topProducts: any[] = [];

  constructor(
    private reportService: ReportService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.reportService.getSummary().subscribe({
      next: (data) => this.resumen = data,
      error: (err) => console.error('Error resumen:', err)
    });

    this.reportService.getVentasPorHora().subscribe({
      next: (data) => this.ventasPorHora = data,
      error: () => console.warn('Gráfico ventas pendiente')
    });

    this.reportService.getLeadTimeTrend().subscribe({
      next: (data) => this.leadTimeTrend = data,
      error: () => console.warn('Gráfico lead time pendiente')
    });

    this.cargarTopProductosConNombres();
  }

  private cargarTopProductosConNombres(): void {
    const catalogo$ = this.http.get<any>(`${environment.apiUrl}/catalog/products`).pipe(
      catchError(() =>
        this.http.get<any>(`${environment.apiUrl}/catalog`).pipe(catchError(() => of([])))
      )
    );

    const ranking$ = (this.reportService.getTopProductos
      ? this.reportService.getTopProductos()
      : this.http.get<any[]>(`${environment.apiUrl}/reports/top-productos`)
    ).pipe(catchError(() => of([])));

    forkJoin({ catalogo: catalogo$, ranking: ranking$ }).subscribe({
      next: ({ catalogo, ranking }) => {
        const listaCatalogo = Array.isArray(catalogo)
          ? catalogo
          : (catalogo?.content || catalogo?.items || []);

        const mapaNombres = new Map<number, string>();
        listaCatalogo.forEach((p: any) => {
          if (p && p.id !== undefined && p.id !== null) {
            mapaNombres.set(Number(p.id), p.nombre || p.name);
          }
        });

        const listaRanking = Array.isArray(ranking) ? ranking : [];
        this.topProducts = listaRanking.map((item: any) => {
          const textoOriginal = String(item.nombre || item.name || item.productName || item.producto || '');
          const idExtraido = Number(
            item.productId ?? item.productoId ?? item.id ?? textoOriginal.replace(/\D+/g, '')
          );

          const nombreReal = (!isNaN(idExtraido) && idExtraido > 0 && mapaNombres.has(idExtraido))
            ? mapaNombres.get(idExtraido)!
            : (textoOriginal || `Producto #${idExtraido}`);

          return {
            ...item,
            productId: idExtraido || item.productId,
            nombre: nombreReal,
            name: nombreReal,
            productName: nombreReal,
            producto: nombreReal
          };
        });
      },
      error: () => console.warn('Top productos pendiente')
    });
  }
}
