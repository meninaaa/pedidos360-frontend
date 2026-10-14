import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { MsalService, MsalBroadcastService, MSAL_GUARD_CONFIG, MsalGuardConfiguration } from '@azure/msal-angular';
import { InteractionStatus, EventMessage, EventType } from '@azure/msal-browser';
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
  
  isAdmin = false;
  isOperator = false;
  isCustomer = false;

  userName = '';
  userRoleStr = '';
  currentRouteName = 'Resumen'; // Variable para el Breadcrumb dinámico

  private readonly _destroying$ = new Subject<void>();

  constructor(
    @Inject(MSAL_GUARD_CONFIG) private msalGuardConfig: MsalGuardConfiguration,
    private authService: MsalService,
    private msalBroadcastService: MsalBroadcastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.handleRedirectObservable().subscribe();

    // Escuchar cambios de ruta para actualizar el Breadcrumb superior
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.actualizarNombreRuta(event.urlAfterRedirects);
      });

    this.msalBroadcastService.msalSubject$
      .pipe(
        filter((msg: EventMessage) => msg.eventType === EventType.LOGIN_SUCCESS),
        takeUntil(this._destroying$)
      )
      .subscribe(() => {
        this.checkAndSetActiveAccount();
        this.router.navigate(['/dashboard']);
      });

    this.msalBroadcastService.inProgress$
      .pipe(
        filter((status: InteractionStatus) => status === InteractionStatus.None),
        takeUntil(this._destroying$)
      )
      .subscribe(() => {
        this.checkAndSetActiveAccount();
      });
  }

  // Método que mapea la URL actual al texto del Breadcrumb
  actualizarNombreRuta(url: string) {
    if (url.includes('/dashboard')) {
      this.currentRouteName = 'Resumen';
    } else if (url.includes('/orders')) {
      this.currentRouteName = 'Pedidos';
    } else if (url.includes('/catalog')) {
      this.currentRouteName = 'Catálogo de Productos';
    } else if (url.includes('/reports')) {
      this.currentRouteName = 'Reportería';
    } else if (url.includes('/audit')) {
      this.currentRouteName = 'Auditoría';
    } else {
      this.currentRouteName = 'Plataforma';
    }
  }

  checkAndSetActiveAccount() {
    let activeAccount = this.authService.instance.getActiveAccount();
    
    if (!activeAccount && this.authService.instance.getAllAccounts().length > 0) {
      let accounts = this.authService.instance.getAllAccounts();
      this.authService.instance.setActiveAccount(accounts[0]);
      activeAccount = accounts[0];
    }
    
    this.isLoggedIn = this.authService.instance.getAllAccounts().length > 0;

    if (this.isLoggedIn && activeAccount) {
      this.userName = activeAccount.name || 'Usuario';
      const claims: any = activeAccount.idTokenClaims;
      const roles = claims?.roles || []; 

      this.isAdmin = roles.includes('Administrador') || roles.includes('Admin');
      this.isOperator = roles.includes('Operador de Logística') || roles.includes('Operador');
      this.isCustomer = roles.includes('Cliente') || roles.includes('Customer') || (!this.isAdmin && !this.isOperator);
      
      if (this.isAdmin) {
        this.userRoleStr = 'Administrador';
      } else if (this.isOperator) {
        this.userRoleStr = 'Operador Logístico';
      } else {
        this.userRoleStr = 'Cliente';
      }
    } else {
      this.isAdmin = false;
      this.isOperator = false;
      this.isCustomer = false;
      this.userName = '';
      this.userRoleStr = '';
    }
  }

  obtenerIniciales(): string {
    if (!this.userName) return 'U';
    const partes = this.userName.split(' ');
    if (partes.length > 1) {
      return (partes[0].charAt(0) + partes[1].charAt(0)).toUpperCase();
    }
    return this.userName.charAt(0).toUpperCase();
  }

  logout() {
    this.authService.logoutRedirect();
  }

  ngOnDestroy(): void {
    this._destroying$.next(undefined);
    this._destroying$.complete();
  }
}