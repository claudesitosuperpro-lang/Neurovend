import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Password } from 'primeng/password';
import { SelectButton } from 'primeng/selectbutton';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { DialogModule } from 'primeng/dialog';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { UsuarioDto, RegisterRequest, UpdateUsuarioRequest } from '../../core/models';

@Component({
  selector: 'app-registro-usuario',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, Button, InputText, Password, SelectButton, ToggleSwitch, DialogModule, Toast],
  providers: [MessageService],
  templateUrl: './registro-usuario.component.html',
  styleUrl: './registro-usuario.component.scss',
})
export class RegistroUsuarioComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private msg = inject(MessageService);

  currentUserId = this.auth.usuario()?.id;

  usuarios = signal<UsuarioDto[]>([]);
  cargando = signal(false);
  guardando = signal(false);

  mostrarDialog = false;
  editandoId: number | null = null;

  form: RegisterRequest = this.formVacio();
  confirmPassword = '';
  nuevaPassword = '';
  confirmNuevaPassword = '';

  rolOptions = [
    { label: 'Empleado', value: 'empleado' },
    { label: 'Dueño', value: 'dueño' },
  ];

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  private async cargarUsuarios(): Promise<void> {
    this.cargando.set(true);
    try {
      this.usuarios.set(await this.api.getUsuarios());
    } catch {
      this.msg.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar los usuarios', life: 3000 });
    } finally {
      this.cargando.set(false);
    }
  }

  abrirCrear(): void {
    this.editandoId = null;
    this.form = this.formVacio();
    this.confirmPassword = '';
    this.nuevaPassword = '';
    this.confirmNuevaPassword = '';
    this.mostrarDialog = true;
  }

  abrirEditar(u: UsuarioDto): void {
    this.editandoId = u.id;
    this.form = { nombre: u.nombre, username: u.username, password: '', rol: u.rol as 'dueño' | 'empleado' };
    this.confirmPassword = '';
    this.nuevaPassword = '';
    this.confirmNuevaPassword = '';
    this.mostrarDialog = true;
  }

  async guardar(): Promise<void> {
    if (!this.form.nombre.trim() || !this.form.username.trim()) {
      this.msg.add({ severity: 'warn', summary: 'Campos requeridos', detail: 'Nombre y usuario son obligatorios', life: 3000 });
      return;
    }

    if (this.editandoId === null) {
      if (!this.form.password || this.form.password.length < 6) {
        this.msg.add({ severity: 'warn', summary: 'Contraseña', detail: 'Mínimo 6 caracteres', life: 3000 });
        return;
      }
      if (this.form.password !== this.confirmPassword) {
        this.msg.add({ severity: 'warn', summary: 'Contraseñas', detail: 'Las contraseñas no coinciden', life: 3000 });
        return;
      }
    } else {
      if (this.nuevaPassword) {
        if (this.nuevaPassword.length < 6) {
          this.msg.add({ severity: 'warn', summary: 'Contraseña', detail: 'Mínimo 6 caracteres', life: 3000 });
          return;
        }
        if (this.nuevaPassword !== this.confirmNuevaPassword) {
          this.msg.add({ severity: 'warn', summary: 'Contraseñas', detail: 'Las contraseñas no coinciden', life: 3000 });
          return;
        }
      }
    }

    this.guardando.set(true);
    try {
      if (this.editandoId === null) {
        await this.api.register(this.form);
        this.msg.add({ severity: 'success', summary: 'Usuario creado', detail: `"${this.form.username}" registrado`, life: 3000 });
      } else {
        const req: UpdateUsuarioRequest = {
          nombre: this.form.nombre,
          username: this.form.username,
          rol: this.form.rol,
          password: this.nuevaPassword || undefined,
        };
        await this.api.updateUsuario(this.editandoId, req);
        this.msg.add({ severity: 'success', summary: 'Guardado', detail: 'Usuario actualizado', life: 3000 });
      }
      this.mostrarDialog = false;
      await this.cargarUsuarios();
    } catch (err: any) {
      const detail = err?.error?.error ?? 'No se pudo guardar el usuario';
      this.msg.add({ severity: 'error', summary: 'Error', detail, life: 4000 });
    } finally {
      this.guardando.set(false);
    }
  }

  async toggleActivo(u: UsuarioDto): Promise<void> {
    const nuevoEstado = !u.activo;
    try {
      await this.api.toggleUsuarioActivo(u.id, nuevoEstado);
      this.usuarios.update(lista => lista.map(x => x.id === u.id ? { ...x, activo: nuevoEstado } : x));
    } catch {
      this.msg.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cambiar el estado', life: 3000 });
    }
  }

  private formVacio(): RegisterRequest {
    return { nombre: '', username: '', password: '', rol: 'empleado' };
  }
}
