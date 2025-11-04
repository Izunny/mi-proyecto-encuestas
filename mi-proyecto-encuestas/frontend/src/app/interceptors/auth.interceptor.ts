import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  console.log('--- INTERCEPTOR: Se ha interceptado una petición a:', req.url);

  const authService = inject(AuthService);
  const token = authService.getToken(); // Obtenemos el token desde el servicio

  if (token) {
    console.log('--- INTERCEPTOR: Token encontrado. Añadiendo encabezado de autorización. ---');
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(cloned);
  }

  console.warn('--- INTERCEPTOR: No se encontró token. La petición irá sin autorización. ---');
  return next(req);
};