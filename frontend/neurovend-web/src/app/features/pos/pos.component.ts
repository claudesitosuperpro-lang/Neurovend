import {
  Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef, inject, signal, computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { InputNumber } from 'primeng/inputnumber';
import { DialogModule } from 'primeng/dialog';
import { Toast } from 'primeng/toast';
import { Menubar } from 'primeng/menubar';
import { MessageService, MenuItem } from 'primeng/api';
import { AuthService } from '../../core/services/auth.service';
import { HardwareService } from '../../core/services/hardware.service';
import { ApiService } from '../../core/services/api.service';
import { Producto, DetalleVenta, Configuracion, CuentaPos } from '../../core/models';
import { CobrarComponent } from './cobrar/cobrar.component';
import { SelectOnFocusDirective } from '../../shared/directives/select-on-focus.directive';

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    Button, InputText, InputNumber, DialogModule,
    Toast, Menubar,
    CobrarComponent,
    SelectOnFocusDirective,
  ],
  providers: [MessageService],
  templateUrl: './pos.component.html',
  styleUrl: './pos.component.scss',
})
export class PosComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('searchInput') searchInputRef?: ElementRef<HTMLInputElement>;

  private auth = inject(AuthService);
  private hardware = inject(HardwareService);
  private api = inject(ApiService);
  private msg = inject(MessageService);
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  usuario = this.auth.usuario;
  isDueno = this.auth.isDueno;
  hardwareDisponible = this.hardware.disponible;

  cuentas = signal<CuentaPos[]>([]);
  cuentaIndex = signal(0);
  cuentaActual = computed(() => this.cuentas()[this.cuentaIndex()] ?? null);
  cuentaTotal = computed(() =>
    this.cuentaActual()?.detalles.reduce((s, d) => s + d.subtotal, 0) ?? 0
  );

  productos = signal<Producto[]>([]);
  cargandoProductos = signal(false);
  cargandoAgregar = signal(false);
  searchQuery = '';

  localCantidades = new Map<number, number>();

  config: Configuracion | null = null;

  mostrarCobrar = false;

  mostrarDialogCantidad = false;
  productoSeleccionado: Producto | null = null;
  cantidadInput = 1;

  mostrarDialogPeso = false;
  pesoManual = 0;
  leyendoBascula = signal(false);

  navItems = computed<MenuItem[]>(() => {
    if (!this.isDueno()) return [];
    return [
      { label: 'Productos', icon: 'pi pi-box', routerLink: '/productos' },
      { label: 'Reportes', icon: 'pi pi-chart-bar', routerLink: '/reportes' },
      { label: 'Mis ventas', icon: 'pi pi-history', routerLink: '/mis-ventas' },
      { label: 'Usuarios', icon: 'pi pi-users', routerLink: '/usuarios' },
      { label: 'Configuración', icon: 'pi pi-cog', routerLink: '/configuracion' },
      { separator: true },
      { label: 'Cerrar sesión', icon: 'pi pi-sign-out', command: () => this.logout() },
    ];
  });

  ngOnInit(): void {
    this.hardware.verificarDisponibilidad();
    this.cargarConfig();
    this.crearPrimeraCuenta();
    this.buscarProductos('');

    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(q => this.buscarProductos(q));

  }

  ngAfterViewInit(): void {
    this.searchInputRef?.nativeElement.focus();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async cargarConfig(): Promise<void> {
    try {
      this.config = await this.api.getConfiguracion();
    } catch {}
  }

  private async crearPrimeraCuenta(): Promise<void> {
    try {
      const { ventaId } = await this.api.crearVenta();
      this.cuentas.set([{ ventaId, etiqueta: 'Cuenta 1', detalles: [], total: 0 }]);
      this.cuentaIndex.set(0);
    } catch {
      this.msg.add({ severity: 'error', summary: 'Error', detail: 'No se pudo iniciar la sesión de venta', life: 4000 });
    }
  }

  async nuevaCuenta(): Promise<void> {
    try {
      const { ventaId } = await this.api.crearVenta();
      const n = this.cuentas().length + 1;
      this.cuentas.update(c => [...c, { ventaId, etiqueta: `Cuenta ${n}`, detalles: [], total: 0 }]);
      this.cuentaIndex.set(this.cuentas().length - 1);
    } catch {
      this.msg.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear nueva cuenta', life: 3000 });
    }
  }

  async cerrarCuenta(i: number, event: Event): Promise<void> {
    event.stopPropagation();
    const cuenta = this.cuentas()[i];
    if (!cuenta) return;
    try {
      await this.api.cancelarVenta(cuenta.ventaId);
    } catch {}
    this.cuentas.update(c => c.filter((_, idx) => idx !== i));
    if (this.cuentas().length === 0) {
      await this.crearPrimeraCuenta();
    } else {
      this.cuentaIndex.set(Math.min(i, this.cuentas().length - 1));
    }
  }

  async limpiarCuenta(): Promise<void> {
    const cuenta = this.cuentaActual();
    if (!cuenta) return;
    const i = this.cuentaIndex();
    try {
      await this.api.cancelarVenta(cuenta.ventaId);
      const { ventaId } = await this.api.crearVenta();
      this.cuentas.update(c => {
        const copy = [...c];
        copy[i] = { ...copy[i], ventaId, detalles: [], total: 0 };
        return copy;
      });
    } catch {
      this.msg.add({ severity: 'error', summary: 'Error', detail: 'No se pudo limpiar la cuenta', life: 3000 });
    }
  }

  onSearch(q: string): void {
    this.searchSubject.next(q);
  }

  async onSearchEnter(): Promise<void> {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return;
    const match = this.productos().find(
      p => p.codigo.toLowerCase() === q || p.nombre.toLowerCase() === q
    );
    if (!match || !this.cuentaActual()) return;

    if (match.tipoVenta === 'unidad') {
      await this.agregarProducto(match, 1);
      this.searchQuery = '';
      this.searchSubject.next('');
      this.searchInputRef?.nativeElement.focus();
    } else {
      this.productoSeleccionado = match;
      if (this.hardware.disponible() && this.config) {
        this.leyendoBascula.set(true);
        try {
          const peso = await this.hardware.obtenerPeso(this.config.puertoBascula, this.config.baudrateBascula);
          await this.agregarProducto(match, peso);
          this.searchQuery = '';
          this.searchSubject.next('');
          this.searchInputRef?.nativeElement.focus();
        } catch {
          this.msg.add({ severity: 'warn', summary: 'Báscula', detail: 'No se pudo leer el peso, ingresa manualmente', life: 3000 });
          this.pesoManual = 0;
          this.mostrarDialogPeso = true;
        } finally {
          this.leyendoBascula.set(false);
        }
      } else {
        this.pesoManual = 0;
        this.mostrarDialogPeso = true;
      }
    }
  }

  private async buscarProductos(q: string): Promise<void> {
    this.cargandoProductos.set(true);
    try {
      const result = await this.api.getProductos(q);
      this.productos.set(result);
    } catch {
      this.msg.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar productos', life: 3000 });
    } finally {
      this.cargandoProductos.set(false);
    }
  }

  seleccionarProducto(p: Producto): void {
    if (!this.cuentaActual()) return;
    this.productoSeleccionado = p;
    if (p.tipoVenta === 'peso') {
      this.pesoManual = 0;
      this.mostrarDialogPeso = true;
    } else {
      this.cantidadInput = 1;
      this.mostrarDialogCantidad = true;
    }
  }

  async confirmarCantidad(): Promise<void> {
    if (!this.productoSeleccionado || this.cantidadInput <= 0) return;
    await this.agregarProducto(this.productoSeleccionado, this.cantidadInput);
    this.mostrarDialogCantidad = false;
  }

  async confirmarPeso(): Promise<void> {
    if (!this.productoSeleccionado || this.pesoManual <= 0) return;
    await this.agregarProducto(this.productoSeleccionado, this.pesoManual);
    this.mostrarDialogPeso = false;
  }

  onDialogHide(): void {
    this.productoSeleccionado = null;
    this.clearAndFocusSearch();
  }

  private clearAndFocusSearch(): void {
    this.searchQuery = '';
    this.searchSubject.next('');
    setTimeout(() => this.searchInputRef?.nativeElement.focus(), 50);
  }

  async leerBascula(): Promise<void> {
    if (!this.config || !this.hardware.disponible()) return;
    this.leyendoBascula.set(true);
    try {
      const peso = await this.hardware.obtenerPeso(
        this.config.puertoBascula,
        this.config.baudrateBascula
      );
      this.pesoManual = peso;
    } catch {
      this.msg.add({ severity: 'warn', summary: 'Báscula', detail: 'No se pudo leer el peso', life: 3000 });
    } finally {
      this.leyendoBascula.set(false);
    }
  }

  private async agregarProducto(p: Producto, cantidad: number): Promise<void> {
    const cuenta = this.cuentaActual();
    if (!cuenta) return;
    this.cargandoAgregar.set(true);
    try {
      await this.api.agregarProducto(cuenta.ventaId, { productoId: p.id, cantidad });
      await this.recargarDetalles();
    } catch (err: any) {
      const detail = err?.error?.error ?? 'No se pudo agregar el producto';
      this.msg.add({ severity: 'error', summary: 'Stock insuficiente', detail, life: 4000 });
    } finally {
      this.cargandoAgregar.set(false);
    }
  }

  async updateCantidad(d: DetalleVenta, nuevaCantidad: number | null): Promise<void> {
    if (nuevaCantidad === null || nuevaCantidad <= 0) return;
    const cuenta = this.cuentaActual();
    if (!cuenta) return;
    try {
      await this.api.updateCantidad(cuenta.ventaId, d.productoId, nuevaCantidad);
      await this.recargarDetalles();
    } catch (err: any) {
      const detail = err?.error?.error ?? 'No se pudo actualizar cantidad';
      this.msg.add({ severity: 'error', summary: 'Stock insuficiente', detail, life: 4000 });
    }
  }

  async eliminarDetalle(d: DetalleVenta): Promise<void> {
    const cuenta = this.cuentaActual();
    if (!cuenta) return;
    try {
      await this.api.eliminarProducto(cuenta.ventaId, d.productoId);
      await this.recargarDetalles();
    } catch {
      this.msg.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el producto', life: 3000 });
    }
  }

  private async recargarDetalles(): Promise<void> {
    const cuenta = this.cuentaActual();
    if (!cuenta) return;
    const detalles = await this.api.getDetalles(cuenta.ventaId);
    const total = detalles.reduce((s, d) => s + d.subtotal, 0);
    const i = this.cuentaIndex();
    this.localCantidades.clear();
    detalles.forEach(d => this.localCantidades.set(d.productoId, d.cantidad));
    this.cuentas.update(c => {
      const copy = [...c];
      copy[i] = { ...copy[i], detalles, total };
      return copy;
    });
  }

  getLocalCantidad(productoId: number): number {
    return this.localCantidades.get(productoId) ?? 0;
  }

  setLocalCantidad(productoId: number, value: number): void {
    this.localCantidades.set(productoId, value);
  }

  async commitCantidad(d: DetalleVenta): Promise<void> {
    const nuevaCantidad = this.localCantidades.get(d.productoId);
    if (nuevaCantidad === undefined || nuevaCantidad === d.cantidad || nuevaCantidad <= 0) return;
    await this.updateCantidad(d, nuevaCantidad);
  }

  async onVentaFinalizada(): Promise<void> {
    const i = this.cuentaIndex();
    try {
      const { ventaId } = await this.api.crearVenta();
      this.cuentas.update(c => {
        const copy = [...c];
        copy[i] = { ...copy[i], ventaId, detalles: [], total: 0 };
        return copy;
      });
    } catch {}
    this.mostrarCobrar = false;
  }

  onImageError(event: Event): void {
    (event.target as HTMLImageElement).style.display = 'none';
  }

  precioProducto(p: Producto): number {
    return p.tipoVenta === 'peso' ? (p.precioPorKg ?? 0) : (p.precioPorUnidad ?? 0);
  }

  logout(): void {
    this.auth.logout();
  }
}
