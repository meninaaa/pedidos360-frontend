import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { MsalService } from '@azure/msal-angular';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(private authService: MsalService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const expectedRoles = route.data['roles'] as Array<string>;
    const account = this.authService.instance.getActiveAccount() || this.authService.instance.getAllAccounts()[0];
    
    if (!account) {
      this.router.navigate(['/login']);
      return false;
    }

    const userRoles = (account.idTokenClaims?.['roles'] as Array<string>) || [];
    
    // Logs para depuración
    console.log('RoleGuard - Ruta destino:', route.routeConfig?.path);
    console.log('RoleGuard - Roles esperados:', expectedRoles);
    console.log('RoleGuard - Roles en tu token de Azure:', userRoles);
    
    const hasRole = expectedRoles.some(role => userRoles.includes(role));
    
    if (!hasRole) {
      console.error('⛔ BLOQUEADO: No tienes permisos. Redirigiendo al Dashboard.');
      this.router.navigate(['/dashboard']); 
      return false;
    }
    
    return true;
  }
}