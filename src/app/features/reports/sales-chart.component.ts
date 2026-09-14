import { AfterViewInit, Component, ElementRef, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { PuntoVentaPorHora } from '../../core/report.service';

Chart.register(...registerables);

@Component({
  selector: 'app-sales-chart',
  standalone: true,
  imports: [CommonModule],
  template: `<canvas #canvasRef></canvas>`
})
export class SalesChartComponent implements AfterViewInit, OnChanges {
  @Input() datos: PuntoVentaPorHora[] = [];
  @ViewChild('canvasRef') canvasRef!: ElementRef<HTMLCanvasElement>;
  private chart?: Chart;

  ngAfterViewInit(): void {
    this.renderizar();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['datos'] && this.canvasRef) {
      this.renderizar();
    }
  }

  private renderizar(): void {
    if (this.chart) {
      this.chart.destroy();
    }
    this.chart = new Chart(this.canvasRef.nativeElement, {
      type: 'bar',
      data: {
        labels: this.datos.map(d => d.hora),
        datasets: [{
          label: 'Ventas (CLP)',
          data: this.datos.map(d => d.ventas),
          backgroundColor: '#4f46e5'
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } }
      }
    });
  }
}