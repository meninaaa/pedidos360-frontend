import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ResumenKpis {
  promedioLeadTime: number;
  pedidosActivos: number;
  ventasTotales: number;
}

export interface PuntoVentaPorHora {
  hora: string;
  ventas: number;
  pedidos: number;
}

export interface PuntoLeadTime {
  orderId: number;
  entregadoEn: string;
  leadTimeHoras: number;
}

@Injectable({ providedIn: 'root' })
export class ReportService {
  private baseUrl = 'http://localhost:8080/api/bff/reports';

  constructor(private http: HttpClient) {}

  getSummary(): Observable<ResumenKpis> {
    return this.http.get<ResumenKpis>(`${this.baseUrl}/summary`);
  }

  getVentasPorHora(): Observable<PuntoVentaPorHora[]> {
    return this.http.get<PuntoVentaPorHora[]>(`${this.baseUrl}/ventas-por-hora`);
  }

  getLeadTimeTrend(): Observable<PuntoLeadTime[]> {
    return this.http.get<PuntoLeadTime[]>(`${this.baseUrl}/lead-time-trend`);
  }

  getTopProductos() {
  return this.http.get<any[]>('http://localhost:8080/api/bff/reports/top-productos');
}
}