import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // --- MENSAJE DE CONTROL 1: ¿Se está ejecutando el interceptor? ---
  console.log('--- INTERCEPTOR: Se ha interceptado una petición a:', req.url);

  const authService = inject(AuthService);
  const token = authService.getToken(); // Obtenemos el token desde el servicio

  // --- MENSAJE DE CONTROL 2: ¿Se encontró el token? ---
  if (token) {
    console.log('--- INTERCEPTOR: Token encontrado. Añadiendo encabezado de autorización. ---');
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(cloned);
  }

  // --- MENSAJE DE CONTROL 3: Si no se encontró el token ---
  console.warn('--- INTERCEPTOR: No se encontró token. La petición irá sin autorización. ---');
  return next(req);
};