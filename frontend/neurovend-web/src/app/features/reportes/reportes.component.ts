import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Button } from 'primeng/button';
import { DatePicker } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { Toast } from 'primeng/toast';
import { SelectButton } from 'primeng/selectbutton';
import { MessageService } from 'primeng/api';
import { ApiService } from '../../core/services/api.service';
import { HardwareService } from '../../core/services/hardware.service';
import { VentaResumenDto, Configuracion } from '../../core/models';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, Button, DatePicker, DialogModule, Toast, SelectButton],
  providers: [MessageService],
  templateUrl: './reportes.component.html',
  styleUrl: './reportes.component.scss',
})
export class ReportesComponent implements OnInit {
  private api = inject(ApiService);
  hardware = inject(HardwareService);
  private msg = inject(MessageService);

  ventas = signal<VentaResumenDto[]>([]);
  cargando = signal(false);
  reimprimiendo = signal(false);

  fechaInicio: Date = this.hoy();
  fechaFin: Date = this.hoy();

  expandedIds = new Set<number>();

  config: Configuracion | null = null;
  ventaPreview: VentaResumenDto | null = null;
  mostrarPreview = false;

  filtroMetodo = signal<'todos' | 'efectivo' | 'tarjeta'>('todos');
  metodoOptions = [
    { label: 'Todos', value: 'todos' },
    { label: 'Efectivo', value: 'efectivo' },
    { label: 'Tarjeta', value: 'tarjeta' },
  ];

  ventasFiltradas = computed(() => {
    const m = this.filtroMetodo();
    if (m === 'todos') return this.ventas();
    return this.ventas().filter(v => v.metodoPago === m);
  });

  productosResumen = computed(() => {
    const mapa = new Map<string, { nombre: string; cantidad: number; total: number }>();
    for (const venta of this.ventasFiltradas()) {
      for (const d of venta.detalles) {
        const entry = mapa.get(d.productoNombre) ?? { nombre: d.productoNombre, cantidad: 0, total: 0 };
        entry.cantidad += d.cantidad;
        entry.total += d.subtotal;
        mapa.set(d.productoNombre, entry);
      }
    }
    return [...mapa.values()].sort((a, b) => b.total - a.total);
  });

  ngOnInit(): void {
    this.hardware.verificarDisponibilidad();
    this.cargarConfig();
    this.buscar();
  }

  private async cargarConfig(): Promise<void> {
    try { this.config = await this.api.getConfiguracion(); } catch {}
  }

  verPreview(v: VentaResumenDto, event: Event): void {
    event.stopPropagation();
    this.ventaPreview = v;
    this.mostrarPreview = true;
  }

  async reimprimir(v: VentaResumenDto, event: Event): Promise<void> {
    event.stopPropagation();
    if (!this.hardware.disponible()) {
      this.msg.add({ severity: 'warn', summary: 'Hardware no disponible', detail: 'HardwareBridge no está conectado', life: 3000 });
      return;
    }
    this.reimprimiendo.set(true);
    try {
      const impresora = this.config?.nombreImpresora ?? 'Impresora Termica';
      await this.hardware.imprimir(impresora, this.buildTicket(v));
      this.msg.add({ severity: 'success', summary: 'Impreso', detail: `Ticket #${v.id} enviado a impresora`, life: 2500 });
    } catch {
      this.msg.add({ severity: 'error', summary: 'Error de impresión', detail: 'No se pudo imprimir el ticket', life: 3000 });
    } finally {
      this.reimprimiendo.set(false);
    }
  }

  async reimprimirDesdePreview(): Promise<void> {
    if (!this.ventaPreview) return;
    this.mostrarPreview = false;
    await this.reimprimir(this.ventaPreview, new Event('click'));
  }

  private buildTicket(v: VentaResumenDto): string {
    const encabezado = this.config?.encabezadoTicket ?? 'NEUROVEND';
    const lineas: number[] = [];
    const ESC = 0x1B, GS = 0x1D;
    const enc = new TextEncoder();
    const push = (data: number[] | Uint8Array) => lineas.push(...Array.from(data));
    const txt = (s: string) => push(enc.encode(s));

    push([ESC, 0x40]);
    push([ESC, 0x61, 0x01]);
    for (const l of encabezado.split('\n')) txt(l + '\n');
    push([ESC, 0x61, 0x00]);
    txt('--------------------------------\n');
    txt(`Fecha: ${new Date(v.fecha + 'Z').toLocaleString('es-MX')}\n`);
    txt(`Folio: #${v.id}\n`);
    txt('--------------------------------\n');

    for (const d of v.detalles) {
      const cant = d.tipoVenta === 'peso' ? `${d.cantidad.toFixed(3)}kg` : `${d.cantidad}u`;
      txt(`${d.productoNombre}\n`);
      txt(`  ${cant} x $${d.precioUnitario.toFixed(2)} = $${d.subtotal.toFixed(2)}\n`);
    }

    txt('--------------------------------\n');
    push([ESC, 0x45, 0x01]);
    txt(`TOTAL: $${v.total.toFixed(2)}\n`);
    push([ESC, 0x45, 0x00]);
    if (v.metodoPago) txt(`Pago: ${v.metodoPago}\n`);
    txt('\n\n\n');
    push([GS, 0x56, 0x41, 0x03]);

    const bytes = new Uint8Array(lineas);
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }

  async buscar(): Promise<void> {
    this.cargando.set(true);
    try {
      const inicio = this.toIso(this.fechaInicio);
      const fin = this.toIso(this.fechaFin);
      this.ventas.set(await this.api.getReportes(inicio, fin));
    } catch {
      this.msg.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el reporte', life: 3000 });
    } finally {
      this.cargando.set(false);
    }
  }

  toggleExpand(id: number): void {
    if (this.expandedIds.has(id)) {
      this.expandedIds.delete(id);
    } else {
      this.expandedIds.add(id);
    }
  }

  totalVentas = computed(() => this.ventasFiltradas().reduce((s, v) => s + v.total, 0));

  exportarCSV(): void {
    const ventas = this.ventasFiltradas();
    if (!ventas.length) return;
    const filas = [
      ['ID', 'Fecha', 'Cajero', 'Método Pago', 'Total'],
      ...ventas.map(v => [
        String(v.id),
        new Date(v.fecha + 'Z').toLocaleString('es-MX'),
        v.usuarioNombre,
        v.metodoPago ?? '',
        v.total.toFixed(2),
      ]),
    ];
    const csv = filas.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ventas-${this.toIso(this.fechaInicio)}-${this.toIso(this.fechaFin)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  private toIso(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private hoy(): Date {
    return new Date();
  }
}
