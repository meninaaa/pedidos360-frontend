import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MsalService } from '@azure/msal-angular';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  userName: string = '';
  userRoles: string[] = [];

  constructor(private authService: MsalService) {}

  ngOnInit(): void {
    const account = this.authService.instance.getActiveAccount() || this.authService.instance.getAllAccounts()[0];
    
    if (account) {
      this.userName = account.name || 'Usuario';
      
      // Leemos los roles del JWT. Si viene vacío, forzamos 'Admin' para poder ver la interfaz
      const tokenRoles = (account.idTokenClaims?.['roles'] as string[]) || [];
      this.userRoles = tokenRoles.length > 0 ? tokenRoles : ['Admin'];
    }
  }

  get isAdmin(): boolean { return this.userRoles.includes('Admin'); }
  get isOperator(): boolean { return this.userRoles.includes('Operator'); }
  get isCustomer(): boolean { return this.userRoles.includes('Customer'); }
}