import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { SelectButton } from 'primeng/selectbutton';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ApiService } from '../../core/services/api.service';
import { RegisterRequest } from '../../core/models';

@Component({
  selector: 'app-registro-usuario',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, Button, InputText, SelectButton, Toast],
  providers: [MessageService],
  templateUrl: './registro-usuario.component.html',
  styleUrl: './registro-usuario.component.scss',
})
export class RegistroUsuarioComponent {
  private api = inject(ApiService);
  private msg = inject(MessageService);

  guardando = signal(false);

  form: RegisterRequest = {
    nombre: '',
    username: '',
    password: '',
    rol: 'empleado',
  };

  confirmPassword = '';

  rolOptions = [
    { label: 'Empleado', value: 'empleado' },
    { label: 'Dueño', value: 'dueño' },
  ];

  async registrar(): Promise<void> {
    if (!this.form.nombre || !this.form.username || !this.form.password) {
      this.msg.add({ severity: 'warn', summary: 'Campos requeridos', detail: 'Todos los campos son obligatorios', life: 3000 });
      return;
    }
    if (this.form.password !== this.confirmPassword) {
      this.msg.add({ severity: 'warn', summary: 'Contraseñas', detail: 'Las contraseñas no coinciden', life: 3000 });
      return;
    }
    if (this.form.password.length < 6) {
      this.msg.add({ severity: 'warn', summary: 'Contraseña débil', detail: 'Mínimo 6 caracteres', life: 3000 });
      return;
    }

    this.guardando.set(true);
    try {
      await this.api.register(this.form);
      this.msg.add({ severity: 'success', summary: 'Usuario creado', detail: `Usuario "${this.form.username}" registrado correctamente`, life: 3000 });
      this.form = { nombre: '', username: '', password: '', rol: 'empleado' };
      this.confirmPassword = '';
    } catch {
      this.msg.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear el usuario. El nombre de usuario puede estar en uso.', life: 4000 });
    } finally {
      this.guardando.set(false);
    }
  }
}
