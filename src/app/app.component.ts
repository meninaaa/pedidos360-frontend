import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MsalService, MsalBroadcastService, MSAL_GUARD_CONFIG, MsalGuardConfiguration } from '@azure/msal-angular';
import { InteractionStatus, RedirectRequest } from '@azure/msal-browser';
import { filter } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'Pedidos360';
  loginDisplay = false;
  
  vistaActual: string = 'dashboard';
  pedidos: any[] = [];

  constructor(
    @Inject(MSAL_GUARD_CONFIG) private msalGuardConfig: MsalGuardConfiguration,
    private authService: MsalService,
    private msalBroadcastService: MsalBroadcastService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.authService.handleRedirectObservable().subscribe();
    this.msalBroadcastService.inProgress$
      .pipe(filter((status: InteractionStatus) => status === InteractionStatus.None))
      .subscribe(() => {
        this.loginDisplay = this.authService.instance.getAllAccounts().length > 0;
      });
  }

  login() {
    if (this.msalGuardConfig.authRequest) {
      this.authService.loginRedirect({ ...this.msalGuardConfig.authRequest } as RedirectRequest);
    } else {
      this.authService.loginRedirect();
    }
  }

  logout() {
    this.authService.logoutRedirect();
  }

  llamarAlBackend() {
    // Apunta al nuevo BFF local (Ejemplo: Catálogo de productos)
    this.http.get<any>('http://localhost:8080/api/bff/catalog/products').subscribe({
      next: (res) => {
        console.log("DATOS RECIBIDOS DEL BFF:", res);
        this.pedidos = res; 
      },
      error: (err) => {
        console.error('ERROR DE CONEXIÓN AL BFF:', err);
      }
    });
  }
}