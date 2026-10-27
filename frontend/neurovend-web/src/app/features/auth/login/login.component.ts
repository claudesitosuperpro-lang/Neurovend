import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { InputText } from 'primeng/inputtext';
import { Password } from 'primeng/password';
import { Button } from 'primeng/button';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, InputText, Password, Button, Toast],
  providers: [MessageService],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  username = '';
  password = '';
  cargando = signal(false);

  constructor(
    private authService: AuthService,
    private messageService: MessageService,
    private router: Router,
  ) {}

  login(): void {
    if (!this.username.trim() || !this.password) return;
    this.cargando.set(true);
    this.authService.login(this.username.trim(), this.password).subscribe({
      next: () => this.router.navigate(['/pos']),
      error: () => {
        this.cargando.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Acceso denegado',
          detail: 'Usuario o contraseña incorrectos',
          life: 3000,
        });
      },
    });
  }
}
