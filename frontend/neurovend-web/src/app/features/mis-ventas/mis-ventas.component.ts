import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Button } from 'primeng/button';
import { DatePicker } from 'primeng/datepicker';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { VentaResumenDto } from '../../core/models';

@Component({
  selector: 'app-mis-ventas',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, Button, DatePicker, Toast],
  providers: [MessageService],
  templateUrl: './mis-ventas.component.html',
  styleUrl: './mis-ventas.component.scss',
})
export class MisVentasComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private msg = inject(MessageService);

  usuario = this.auth.usuario;

  ventas = signal<VentaResumenDto[]>([]);
  cargando = signal(false);

  fechaInicio: Date = this.hoy();
  fechaFin: Date = this.hoy();

  expandedIds = new Set<number>();

  totalVentas = computed(() => this.ventas().reduce((s, v) => s + v.total, 0));

  ngOnInit(): void {
    this.buscar();
  }

  async buscar(): Promise<void> {
    this.cargando.set(true);
    try {
      const inicio = this.toIso(this.fechaInicio);
      const fin = this.toIso(this.fechaFin);
      this.ventas.set(await this.api.getMisVentas(inicio, fin));
    } catch {
      this.msg.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar las ventas', life: 3000 });
    } finally {
      this.cargando.set(false);
    }
  }

  toggleExpand(id: number): void {
    if (this.expandedIds.has(id)) this.expandedIds.delete(id);
    else this.expandedIds.add(id);
  }

  private toIso(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private hoy(): Date { return new Date(); }
}
