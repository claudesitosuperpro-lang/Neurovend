import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  Producto, CreateProductoRequest, UpdateProductoRequest,
  DetalleVenta, AgregarProductoRequest, FinalizarVentaRequest,
  VentaResumenDto, RegisterRequest, Configuracion,
  UsuarioDto, UpdateUsuarioRequest,
} from '../models';
@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = window.location.hostname === 'localhost'
    ? ''
    : 'https://silent-summit-299.fly.dev';

  constructor(private http: HttpClient) {}

  private url(path: string): string {
    return `${this.base}${path}`;
  }

  // ─── Productos ────────────────────────────────────────────────────
  getProductos(q?: string) {
    const params = q ? `?q=${encodeURIComponent(q)}` : '';
    return firstValueFrom(this.http.get<Producto[]>(this.url(`/api/productos/${params}`)));
  }

  getProductosGestion(q?: string) {
    const params = q ? `?q=${encodeURIComponent(q)}` : '';
    return firstValueFrom(this.http.get<Producto[]>(this.url(`/api/productos/gestion${params}`)));
  }

  getProductoPorCodigo(codigo: string) {
    return firstValueFrom(this.http.get<Producto>(this.url(`/api/productos/codigo/${encodeURIComponent(codigo)}`)));
  }

  createProducto(req: CreateProductoRequest) {
    return firstValueFrom(this.http.post<void>(this.url('/api/productos/'), req));
  }

  updateProducto(id: number, req: UpdateProductoRequest) {
    return firstValueFrom(this.http.put<void>(this.url(`/api/productos/${id}`), req));
  }

  toggleActivo(id: number, activo: boolean) {
    return firstValueFrom(this.http.patch<void>(this.url(`/api/productos/${id}/activo`), { activo }));
  }

  deleteProducto(id: number) {
    return firstValueFrom(this.http.delete<void>(this.url(`/api/productos/${id}`)));
  }

  // ─── Ventas ───────────────────────────────────────────────────────
  crearVenta() {
    return firstValueFrom(this.http.post<{ ventaId: number }>(this.url('/api/ventas/'), {}));
  }

  getDetalles(ventaId: number) {
    return firstValueFrom(this.http.get<DetalleVenta[]>(this.url(`/api/ventas/${ventaId}/detalles`)));
  }

  agregarProducto(ventaId: number, req: AgregarProductoRequest) {
    return firstValueFrom(this.http.post<void>(this.url(`/api/ventas/${ventaId}/productos`), req));
  }

  updateCantidad(ventaId: number, productoId: number, nuevaCantidad: number) {
    return firstValueFrom(this.http.put<void>(this.url(`/api/ventas/${ventaId}/productos/${productoId}`), { nuevaCantidad }));
  }

  eliminarProducto(ventaId: number, productoId: number) {
    return firstValueFrom(this.http.delete<void>(this.url(`/api/ventas/${ventaId}/productos/${productoId}`)));
  }

  finalizarVenta(ventaId: number, req: FinalizarVentaRequest) {
    return firstValueFrom(this.http.post<void>(this.url(`/api/ventas/${ventaId}/finalizar`), req));
  }

  cancelarVenta(ventaId: number) {
    return firstValueFrom(this.http.delete<void>(this.url(`/api/ventas/${ventaId}`)));
  }

  getReportes(inicio: string, fin: string) {
    return firstValueFrom(this.http.get<VentaResumenDto[]>(this.url(`/api/ventas/reportes?inicio=${inicio}&fin=${fin}`)));
  }

  getMisVentas(inicio: string, fin: string) {
    return firstValueFrom(this.http.get<VentaResumenDto[]>(this.url(`/api/ventas/mis-ventas?inicio=${inicio}&fin=${fin}`)));
  }

  // ─── Configuracion ────────────────────────────────────────────────
  getConfiguracion() {
    return firstValueFrom(this.http.get<Configuracion>(this.url('/api/configuracion/')));
  }

  updateConfiguracion(req: Configuracion) {
    return firstValueFrom(this.http.put<void>(this.url('/api/configuracion/'), req));
  }

  // ─── Usuarios ─────────────────────────────────────────────────────
  getUsuarios() {
    return firstValueFrom(this.http.get<UsuarioDto[]>(this.url('/api/usuarios/')));
  }

  updateUsuario(id: number, req: UpdateUsuarioRequest) {
    return firstValueFrom(this.http.put<void>(this.url(`/api/usuarios/${id}`), req));
  }

  toggleUsuarioActivo(id: number, activo: boolean) {
    return firstValueFrom(this.http.patch<void>(this.url(`/api/usuarios/${id}/activo`), { activo }));
  }

  // ─── Auth ─────────────────────────────────────────────────────────
  register(req: RegisterRequest) {
    return firstValueFrom(this.http.post<void>(this.url('/api/auth/register'), req));
  }
}
