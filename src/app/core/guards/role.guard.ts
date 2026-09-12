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
    const account = this.authService.instance.getActiveAccount();
    
    if (!account || !account.idTokenClaims) {
      this.router.navigate(['/login']);
      return false;
    }

    // Azure AD inyecta los roles configurados en el claim 'roles'
    const userRoles = (account.idTokenClaims['roles'] as Array<string>) || [];
    const hasRole = expectedRoles.some(role => userRoles.includes(role));
    
    if (!hasRole) {
      this.router.navigate(['/dashboard']); // Redirige si no tiene los privilegios
      return false;
    }
    
    return true;
  }
}