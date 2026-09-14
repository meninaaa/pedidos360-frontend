import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportService, ResumenKpis, PuntoVentaPorHora, PuntoLeadTime } from '../../core/report.service';
import { SalesChartComponent } from './grafics/sales-chart.component';
import { LeadTimeChartComponent } from './grafics/lead-time-chart.component';
import { TopProductsChartComponent } from './grafics/top-products-chart.component';

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
  topProducts: any[] = []; // <-- Añadido

  constructor(private reportService: ReportService) {}

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

    this.reportService.getTopProductos?.().subscribe({
      next: (data: any) => this.topProducts = data,
      error: () => console.warn('Top productos pendiente')
    });
  }
}