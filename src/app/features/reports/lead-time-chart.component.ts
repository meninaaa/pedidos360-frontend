import { AfterViewInit, Component, ElementRef, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { PuntoLeadTime } from '../../core/report.service';

Chart.register(...registerables);

@Component({
  selector: 'app-lead-time-chart',
  standalone: true,
  imports: [CommonModule],
  template: `<canvas #canvasRef></canvas>`
})
export class LeadTimeChartComponent implements AfterViewInit, OnChanges {
  @Input() datos: PuntoLeadTime[] = [];
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
      type: 'line',
      data: {
        labels: this.datos.map(d => `Pedido #${d.orderId}`),
        datasets: [{
          label: 'Lead Time (horas)',
          data: this.datos.map(d => d.leadTimeHoras),
          borderColor: '#16a34a',
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } }
      }
    });
  }
}