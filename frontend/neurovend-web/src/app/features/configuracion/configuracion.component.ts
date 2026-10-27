import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ApiService } from '../../core/services/api.service';
import { HardwareService } from '../../core/services/hardware.service';
import { Configuracion } from '../../core/models';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, Button, InputText, Select, Toast],
  providers: [MessageService],
  templateUrl: './configuracion.component.html',
  styleUrl: './configuracion.component.scss',
})
export class ConfiguracionComponent implements OnInit {
  private api = inject(ApiService);
  private hardware = inject(HardwareService);
  private msg = inject(MessageService);

  hardwareDisponible = this.hardware.disponible;
  cargando = signal(true);
  guardando = signal(false);
  cargandoHardware = signal(false);

  config: Configuracion = {
    puertoBascula: '',
    baudrateBascula: 9600,
    nombreImpresora: '',
    encabezadoTicket: 'NEUROVEND',
  };

  puertos: { label: string; value: string }[] = [];
  impresoras: { label: string; value: string }[] = [];

  baudrateOptions = [
    { label: '4800', value: 4800 },
    { label: '9600', value: 9600 },
    { label: '19200', value: 19200 },
    { label: '38400', value: 38400 },
    { label: '57600', value: 57600 },
    { label: '115200', value: 115200 },
  ];

  ngOnInit(): void {
    this.cargar();
    this.hardware.verificarDisponibilidad().then(() => {
      if (this.hardware.disponible()) {
        this.cargarHardware();
      }
    });
  }

  private async cargar(): Promise<void> {
    try {
      this.config = await this.api.getConfiguracion();
    } catch {
      this.msg.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la configuración', life: 3000 });
    } finally {
      this.cargando.set(false);
    }
  }

  async cargarHardware(): Promise<void> {
    this.cargandoHardware.set(true);
    try {
      const [puertos, impresoras] = await Promise.all([
        this.hardware.obtenerPuertos(),
        this.hardware.obtenerImpresoras(),
      ]);
      this.puertos = puertos.map(p => ({ label: p, value: p }));
      this.impresoras = impresoras.map(i => ({ label: i, value: i }));
    } catch {
      this.msg.add({ severity: 'warn', summary: 'Hardware', detail: 'No se pudieron cargar los dispositivos', life: 3000 });
    } finally {
      this.cargandoHardware.set(false);
    }
  }

  async guardar(): Promise<void> {
    this.guardando.set(true);
    try {
      await this.api.updateConfiguracion(this.config);
      this.msg.add({ severity: 'success', summary: 'Guardado', detail: 'Configuración actualizada', life: 2000 });
    } catch {
      this.msg.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar la configuración', life: 3000 });
    } finally {
      this.guardando.set(false);
    }
  }
}
