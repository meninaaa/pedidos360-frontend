import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { MsalService, MsalBroadcastService, MSAL_GUARD_CONFIG, MsalGuardConfiguration } from '@azure/msal-angular';
import { InteractionStatus, RedirectRequest, EventMessage, EventType } from '@azure/msal-browser';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  isLoggedIn = false;
  
  // Variables para ocultar/mostrar el menú lateral dinámicamente
  isAdmin = false;
  isOperator = false;
  isCustomer = false;

  private readonly _destroying$ = new Subject<void>();

  constructor(
    @Inject(MSAL_GUARD_CONFIG) private msalGuardConfig: MsalGuardConfiguration,
    private authService: MsalService,
    private msalBroadcastService: MsalBroadcastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // 1. Manejar la redirección de MSAL (crítico para que no se quede pegado)
    this.authService.handleRedirectObservable().subscribe();

    // 2. Escuchar cuando el login fue exitoso y redirigir al dashboard
    this.msalBroadcastService.msalSubject$
      .pipe(
        filter((msg: EventMessage) => msg.eventType === EventType.LOGIN_SUCCESS),
        takeUntil(this._destroying$)
      )
      .subscribe(() => {
        this.checkAndSetActiveAccount();
        this.router.navigate(['/dashboard']);
      });

    // 3. Mantener el estado de isLoggedIn sincronizado
    this.msalBroadcastService.inProgress$
      .pipe(
        filter((status: InteractionStatus) => status === InteractionStatus.None),
        takeUntil(this._destroying$)
      )
      .subscribe(() => {
        this.checkAndSetActiveAccount();
      });
  }

  checkAndSetActiveAccount() {
    let activeAccount = this.authService.instance.getActiveAccount();
    
    if (!activeAccount && this.authService.instance.getAllAccounts().length > 0) {
      let accounts = this.authService.instance.getAllAccounts();
      this.authService.instance.setActiveAccount(accounts[0]);
      activeAccount = accounts[0]; // Actualizamos la referencia local
    }
    
    this.isLoggedIn = this.authService.instance.getAllAccounts().length > 0;

    // 4. Leer los roles del token para adaptar el menú
    if (this.isLoggedIn && activeAccount) {
      const claims: any = activeAccount.idTokenClaims;
      const roles = claims?.roles || []; 

      this.isAdmin = roles.includes('Administrador') || roles.includes('Admin');
      this.isOperator = roles.includes('Operador de Logística') || roles.includes('Operador');
      
      // Si no es admin ni operador, asumimos que es el cliente
      this.isCustomer = roles.includes('Cliente') || roles.includes('Customer') || (!this.isAdmin && !this.isOperator);
    } else {
      // Si no hay sesión, apagamos todo por seguridad
      this.isAdmin = false;
      this.isOperator = false;
      this.isCustomer = false;
    }
  }

  logout() {
    this.authService.logoutRedirect();
  }

  ngOnDestroy(): void {
    this._destroying$.next(undefined);
    this._destroying$.complete();
  }
}