import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-top-products-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="display: flex; flex-direction: column; gap: 10px;">
      <div *ngFor="let p of datos" style="display: flex; justify-content: space-between; align-items: center; padding: 10px 15px; background: #f8f9fa; border-radius: 6px; border: 1px solid #e1e4e8;">
        <span style="font-weight: 500; color: #24292e;">{{ p.nombre }}</span>
        <span style="background: #e1f5fe; color: #0277bd; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;">
          {{ p.cantidad }} unidades vendidas
        </span>
      </div>
      <div *ngIf="!datos || datos.length === 0" style="text-align: center; color: #666; padding: 15px;">
        Cargando estadísticas de productos...
      </div>
    </div>
  `
})
export class TopProductsChartComponent {
  @Input() datos: any[] = [];
}