export interface UsuarioLogueado {
  id: number;
  username: string;
  nombre: string;
  rol: 'dueño' | 'empleado';
}

export interface LoginResponse {
  token: string;
  nombre: string;
  username: string;
  rol: string;
  id: number;
}

export interface Producto {
  id: number;
  codigo: string;
  nombre: string;
  precioPorKg?: number;
  precioPorUnidad?: number;
  tipoVenta: 'peso' | 'unidad';
  stock: number;
  stockHabilitado: boolean;
  activo: boolean;
  imagenUrl?: string;
  creadoEn: string;
}

export interface CreateProductoRequest {
  codigo: string;
  nombre: string;
  precioPorKg?: number;
  precioPorUnidad?: number;
  tipoVenta: 'peso' | 'unidad';
  stock: number;
  stockHabilitado: boolean;
  imagenUrl?: string;
}

export interface UpdateProductoRequest extends CreateProductoRequest {
  activo: boolean;
}

export interface DetalleVenta {
  productoId: number;
  productoNombre: string;
  tipoVenta: 'peso' | 'unidad';
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  orden: number;
  imagenUrl?: string;
}

export interface AgregarProductoRequest {
  productoId: number;
  cantidad: number;
}

export interface UpdateCantidadRequest {
  nuevaCantidad: number;
}

export interface FinalizarVentaRequest {
  metodoPago: 'efectivo' | 'tarjeta';
  montoRecibido: number;
  cambio: number;
}

export interface VentaResumenDto {
  id: number;
  fecha: string;
  total: number;
  metodoPago?: string;
  usuarioNombre: string;
  detalles: DetalleVenta[];
}

export interface RegisterRequest {
  nombre: string;
  username: string;
  password: string;
  rol: 'dueño' | 'empleado';
}

export interface UsuarioDto {
  id: number;
  nombre: string;
  username: string;
  rol: 'dueño' | 'empleado';
  activo: boolean;
  creadoEn: string;
}

export interface UpdateUsuarioRequest {
  nombre: string;
  username: string;
  rol: 'dueño' | 'empleado';
  password?: string;
}

export interface Configuracion {
  puertoBascula: string;
  baudrateBascula: number;
  nombreImpresora: string;
  encabezadoTicket: string;
}

export interface CuentaPos {
  ventaId: number;
  etiqueta: string;
  detalles: DetalleVenta[];
  total: number;
}
