import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Button } from 'primeng/button';
import { DatePicker } from 'primeng/datepicker';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ApiService } from '../../core/services/api.service';
import { CierreCajaDto } from '../../core/models';

@Component({
  selector: 'app-cierre-caja',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, Button, DatePicker, Toast],
  providers: [MessageService],
  templateUrl: './cierre-caja.component.html',
  styleUrl: './cierre-caja.component.scss',
})
export class CierreCajaComponent implements OnInit {
  private api = inject(ApiService);
  private msg = inject(MessageService);

  rango: Date[] = [new Date(), new Date()];
  cierre = signal<CierreCajaDto | null>(null);
  cargando = signal(false);

  ngOnInit(): void {
    this.cargar();
  }

  async cargar(): Promise<void> {
    if (!this.rango[0]) return;
    this.cargando.set(true);
    try {
      const inicio = this.formatDate(this.rango[0]);
      const fin = this.formatDate(this.rango[1] ?? this.rango[0]);
      const data = await this.api.getCierreCaja(inicio, fin);
      this.cierre.set(data);
    } catch {
      this.msg.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el cierre', life: 3000 });
    } finally {
      this.cargando.set(false);
    }
  }

  onRangoChange(): void {
    if (this.rango[0] && this.rango[1]) this.cargar();
  }

  private formatDate(d: Date): string {
    return d.toISOString().split('T')[0];
  }
}
