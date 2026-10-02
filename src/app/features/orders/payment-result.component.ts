import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-payment-result',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="display:flex; justify-content:center; align-items:center; height:70vh;">
      <div style="text-align:center; background:white; padding:40px; border-radius:12px; box-shadow:0 2px 12px rgba(0,0,0,0.08); max-width:400px;">
        <div *ngIf="status === 'success'">
          <div style="font-size:48px; color:#1e8e3e;">✓</div>
          <h2 style="margin:10px 0;">¡Pago exitoso!</h2>
          <p style="color:#666;">Tu pedido fue confirmado y pasó a estado ACEPTADO.</p>
        </div>
        <div *ngIf="status === 'failed'">
          <div style="font-size:48px; color:#d93025;">✕</div>
          <h2 style="margin:10px 0;">Pago no completado</h2>
          <p style="color:#666;">La transacción fue rechazada o cancelada. Intenta nuevamente.</p>
        </div>
        <button (click)="volver()" style="margin-top:20px; background:#0366d6; color:white; border:none; padding:10px 24px; border-radius:6px; cursor:pointer;">
          Volver a Mis Pedidos
        </button>
      </div>
    </div>
  `
})
export class PaymentResultComponent implements OnInit {
  status: string | null = null;

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.status = params['status'] || null;
    });
  }

  volver() {
    this.router.navigate(['/orders']);
  }
}