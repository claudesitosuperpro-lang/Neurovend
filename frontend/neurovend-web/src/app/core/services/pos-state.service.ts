import { Injectable, signal, computed } from '@angular/core';
import { CuentaPos } from '../models';

@Injectable({ providedIn: 'root' })
export class PosStateService {
  readonly cuentas = signal<CuentaPos[]>([]);
  readonly cuentaIndex = signal(0);
  readonly cuentaActual = computed(() => this.cuentas()[this.cuentaIndex()] ?? null);
  readonly cuentaTotal = computed(() =>
    this.cuentaActual()?.detalles.reduce((s, d) => s + d.subtotal, 0) ?? 0
  );

  get tieneContenido(): boolean {
    return this.cuentas().length > 0;
  }

  clear(): void {
    this.cuentas.set([]);
    this.cuentaIndex.set(0);
  }
}
