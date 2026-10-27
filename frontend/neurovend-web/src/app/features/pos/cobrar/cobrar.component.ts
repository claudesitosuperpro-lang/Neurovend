import { Component, Input, Output, EventEmitter, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { Button } from 'primeng/button';
import { InputNumber } from 'primeng/inputnumber';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ApiService } from '../../../core/services/api.service';
import { HardwareService } from '../../../core/services/hardware.service';
import { SelectOnFocusDirective } from '../../../shared/directives/select-on-focus.directive';
import { DetalleVenta, Configuracion, FinalizarVentaRequest } from '../../../core/models';

@Component({
  selector: 'app-cobrar',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogModule, Button, InputNumber, Toast, SelectOnFocusDirective],
  providers: [MessageService],
  templateUrl: './cobrar.component.html',
  styleUrl: './cobrar.component.scss',
})
export class CobrarComponent {
  @Input() ventaId!: number;
  @Input() total = 0;
  @Input() detalles: DetalleVenta[] = [];
  @Input() config: Configuracion | null = null;
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() ventaFinalizada = new EventEmitter<void>();

  private api = inject(ApiService);
  private hardware = inject(HardwareService);
  private msg = inject(MessageService);

  metodoPago: 'efectivo' | 'tarjeta' = 'efectivo';
  montoRecibido = signal(0);
  cargando = signal(false);
  paso: 'cobrar' | 'imprimir' = 'cobrar';

  cambio = computed(() => Math.max(0, this.montoRecibido() - this.total));

  onHide() {
    this.reset();
    this.visibleChange.emit(false);
  }

  async finalizar() {
    if (this.metodoPago === 'efectivo' && this.montoRecibido() < this.total) {
      this.msg.add({ severity: 'warn', summary: 'Monto insuficiente', detail: 'El monto recibido es menor al total', life: 3000 });
      return;
    }

    this.cargando.set(true);
    const req: FinalizarVentaRequest = {
      metodoPago: this.metodoPago,
      montoRecibido: this.metodoPago === 'efectivo' ? this.montoRecibido() : this.total,
      cambio: this.metodoPago === 'efectivo' ? this.cambio() : 0,
    };

    try {
      await this.api.finalizarVenta(this.ventaId, req);
      this.paso = 'imprimir';
    } catch {
      this.msg.add({ severity: 'error', summary: 'Error', detail: 'No se pudo finalizar la venta', life: 3000 });
    } finally {
      this.cargando.set(false);
    }
  }

  async imprimir() {
    if (!this.hardware.disponible()) {
      this.msg.add({ severity: 'warn', summary: 'Hardware no disponible', detail: 'HardwareBridge no está conectado', life: 3000 });
      this.cerrar();
      return;
    }
    const impresora = this.config?.nombreImpresora ?? 'Impresora Termica';
    const ticket = this.buildTicket();
    try {
      await this.hardware.imprimir(impresora, ticket);
    } catch {
      this.msg.add({ severity: 'warn', summary: 'Error de impresión', detail: 'No se pudo imprimir el ticket', life: 3000 });
    }
    this.cerrar();
  }

  cerrar() {
    this.reset();
    this.visibleChange.emit(false);
    this.ventaFinalizada.emit();
  }

  private reset() {
    this.metodoPago = 'efectivo';
    this.montoRecibido.set(0);
    this.paso = 'cobrar';
  }

  private buildTicket(): string {
    const encabezado = this.config?.encabezadoTicket ?? 'NEUROVEND';
    const lineas: number[] = [];

    const ESC = 0x1B, GS = 0x1D;
    const enc = new TextEncoder();

    const push = (data: number[] | Uint8Array) => lineas.push(...Array.from(data));
    const txt = (s: string) => push(enc.encode(s));

    push([ESC, 0x40]);           // init
    push([ESC, 0x61, 0x01]);     // center
    for (const l of encabezado.split('\n')) txt(l + '\n');
    push([ESC, 0x61, 0x00]);     // left
    txt('--------------------------------\n');
    txt(`Fecha: ${new Date().toLocaleString('es-MX')}\n`);
    txt('--------------------------------\n');

    for (const d of this.detalles) {
      const cant = d.tipoVenta === 'peso' ? `${d.cantidad.toFixed(3)}kg` : `${d.cantidad}u`;
      txt(`${d.productoNombre}\n`);
      txt(`  ${cant} x $${d.precioUnitario.toFixed(2)} = $${d.subtotal.toFixed(2)}\n`);
    }

    txt('--------------------------------\n');
    push([ESC, 0x45, 0x01]); // bold on
    txt(`TOTAL: $${this.total.toFixed(2)}\n`);
    push([ESC, 0x45, 0x00]); // bold off
    txt(`Pago: ${this.metodoPago}\n`);
    if (this.metodoPago === 'efectivo') {
      txt(`Recibido: $${this.montoRecibido().toFixed(2)}\n`);
      txt(`Cambio:   $${this.cambio().toFixed(2)}\n`);
    }
    txt('\n\n\n');
    push([GS, 0x56, 0x41, 0x03]); // cut

    const bytes = new Uint8Array(lineas);
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }
}
