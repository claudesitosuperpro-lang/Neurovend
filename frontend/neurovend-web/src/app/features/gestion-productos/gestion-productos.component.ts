import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { InputNumber } from 'primeng/inputnumber';
import { DialogModule } from 'primeng/dialog';
import { Toast } from 'primeng/toast';
import { SelectButton } from 'primeng/selectbutton';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ApiService } from '../../core/services/api.service';
import { Producto, CreateProductoRequest, UpdateProductoRequest } from '../../core/models';
import { SelectOnFocusDirective } from '../../shared/directives/select-on-focus.directive';

@Component({
  selector: 'app-gestion-productos',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    Button, InputText, InputNumber, DialogModule,
    Toast, SelectButton, ToggleSwitch, ConfirmDialog,
    SelectOnFocusDirective,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './gestion-productos.component.html',
  styleUrl: './gestion-productos.component.scss',
})
export class GestionProductosComponent implements OnInit, AfterViewInit {
  @ViewChild('searchInput') searchInputRef?: ElementRef<HTMLInputElement>;

  private api = inject(ApiService);
  private msg = inject(MessageService);
  private confirm = inject(ConfirmationService);

  productos = signal<Producto[]>([]);
  cargando = signal(false);
  searchQuery = '';

  mostrarDialog = false;
  editandoId: number | null = null;
  formActivo = true;
  guardando = signal(false);

  form: CreateProductoRequest = this.formVacio();

  tipoVentaOptions = [
    { label: 'Peso (kg)', value: 'peso' },
    { label: 'Unidad', value: 'unidad' },
  ];

  ngOnInit(): void {
    this.cargarProductos();
  }

  ngAfterViewInit(): void {
    this.searchInputRef?.nativeElement.focus();
  }

  async cargarProductos(): Promise<void> {
    this.cargando.set(true);
    try {
      this.productos.set(await this.api.getProductosGestion(this.searchQuery || undefined));
    } catch {
      this.msg.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar productos', life: 3000 });
    } finally {
      this.cargando.set(false);
    }
  }

  abrirCrear(): void {
    this.editandoId = null;
    this.formActivo = true;
    this.form = this.formVacio();
    this.mostrarDialog = true;
  }

  abrirEditar(p: Producto): void {
    this.editandoId = p.id;
    this.formActivo = p.activo;
    this.form = {
      codigo: p.codigo,
      nombre: p.nombre,
      tipoVenta: p.tipoVenta,
      precioPorKg: p.precioPorKg,
      precioPorUnidad: p.precioPorUnidad,
      stock: p.stock,
      stockHabilitado: p.stockHabilitado,
      imagenUrl: p.imagenUrl,
    };
    this.mostrarDialog = true;
  }

  async guardar(): Promise<void> {
    if (!this.form.nombre || !this.form.codigo) {
      this.msg.add({ severity: 'warn', summary: 'Campos requeridos', detail: 'Nombre y código son obligatorios', life: 3000 });
      return;
    }
    this.guardando.set(true);
    try {
      if (this.editandoId !== null) {
        const req: UpdateProductoRequest = { ...this.form, activo: this.formActivo };
        await this.api.updateProducto(this.editandoId, req);
        this.msg.add({ severity: 'success', summary: 'Actualizado', detail: 'Producto actualizado', life: 2000 });
      } else {
        await this.api.createProducto(this.form);
        this.msg.add({ severity: 'success', summary: 'Creado', detail: 'Producto creado', life: 2000 });
      }
      this.mostrarDialog = false;
      await this.cargarProductos();
    } catch {
      this.msg.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el producto', life: 3000 });
    } finally {
      this.guardando.set(false);
    }
  }

  async toggleActivo(p: Producto): Promise<void> {
    try {
      await this.api.toggleActivo(p.id, !p.activo);
      await this.cargarProductos();
    } catch {
      this.msg.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cambiar estado', life: 3000 });
    }
  }

  confirmarEliminar(p: Producto): void {
    this.confirm.confirm({
      message: `¿Eliminar "${p.nombre}"? Esta acción no se puede deshacer.`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.eliminar(p.id),
    });
  }

  private async eliminar(id: number): Promise<void> {
    try {
      await this.api.deleteProducto(id);
      this.msg.add({ severity: 'success', summary: 'Eliminado', detail: 'Producto eliminado', life: 2000 });
      await this.cargarProductos();
    } catch {
      this.msg.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el producto', life: 3000 });
    }
  }

  onTipoVentaChange(): void {
    if (this.form.tipoVenta === 'peso') {
      this.form.precioPorUnidad = undefined;
    } else {
      this.form.precioPorKg = undefined;
    }
  }

  precioProducto(p: Producto): number {
    return p.tipoVenta === 'peso' ? (p.precioPorKg ?? 0) : (p.precioPorUnidad ?? 0);
  }

  private formVacio(): CreateProductoRequest {
    return {
      codigo: '',
      nombre: '',
      tipoVenta: 'unidad',
      precioPorUnidad: 0,
      stock: 0,
      stockHabilitado: false,
    };
  }
}
