import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

const BRIDGE = 'http://localhost:5001';

@Injectable({ providedIn: 'root' })
export class HardwareService {
  private _disponible = signal(false);
  readonly disponible = this._disponible.asReadonly();

  constructor(private http: HttpClient) {}

  async verificarDisponibilidad(): Promise<void> {
    try {
      await firstValueFrom(this.http.get(BRIDGE + '/'));
      this._disponible.set(true);
    } catch {
      this._disponible.set(false);
    }
  }

  async obtenerPeso(puerto: string, baudrate: number): Promise<number> {
    const res = await firstValueFrom(
      this.http.get<{ peso: number }>(`${BRIDGE}/peso?puerto=${puerto}&baudrate=${baudrate}`)
    );
    return res.peso;
  }

  async obtenerPuertos(): Promise<string[]> {
    try {
      return await firstValueFrom(this.http.get<string[]>(`${BRIDGE}/puertos`));
    } catch {
      return [];
    }
  }

  async obtenerImpresoras(): Promise<string[]> {
    try {
      return await firstValueFrom(this.http.get<string[]>(`${BRIDGE}/impresoras`));
    } catch {
      return [];
    }
  }

  async imprimir(impresora: string, contenidoBase64: string): Promise<void> {
    await firstValueFrom(this.http.post(`${BRIDGE}/imprimir`, { impresora, contenidoBase64 }));
  }
}
