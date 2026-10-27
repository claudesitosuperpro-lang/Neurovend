import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { jwtDecode } from 'jwt-decode';
import { LoginResponse, UsuarioLogueado } from '../models';

interface JwtPayload {
  sub: string;
  unique_name: string;
  // .NET serializes role as the full Microsoft claim URI
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': string;
  nombre: string;
  id: string;
  exp: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'nv_token';
  private _usuario = signal<UsuarioLogueado | null>(null);

  readonly usuario = this._usuario.asReadonly();
  readonly isAuthenticated = computed(() => this._usuario() !== null);
  readonly isDueno = computed(() => this._usuario()?.rol === 'dueño');

  constructor(private http: HttpClient, private router: Router) {
    this.cargarDesdeStorage();
  }

  private cargarDesdeStorage(): void {
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (!token) return;
    try {
      const payload = jwtDecode<JwtPayload>(token);
      if (payload.exp * 1000 > Date.now()) {
        this._usuario.set({
          id: Number(payload.id),
          username: payload.unique_name,
          nombre: payload.nombre,
          rol: payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] as 'dueño' | 'empleado',
        });
      } else {
        localStorage.removeItem(this.TOKEN_KEY);
      }
    } catch {
      localStorage.removeItem(this.TOKEN_KEY);
    }
  }

  login(username: string, password: string) {
    return this.http.post<LoginResponse>('/api/auth/login', { username, password }).pipe(
      tap(res => {
        localStorage.setItem(this.TOKEN_KEY, res.token);
        this._usuario.set({
          id: Number(res.id),
          username: res.username,
          nombre: res.nombre,
          rol: res.rol as 'dueño' | 'empleado',
        });
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this._usuario.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }
}
