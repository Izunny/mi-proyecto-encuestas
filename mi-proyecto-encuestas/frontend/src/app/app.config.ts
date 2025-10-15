import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';

// 1. Asegúrate de importar 'withInterceptors'
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
// 2. Asegúrate de importar tu interceptor
import { authInterceptor } from './interceptors/auth.interceptor'; 

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    
    // 3. ESTA ES LA LÍNEA QUE RESUELVE EL PROBLEMA
    // Le dice a HttpClient que use tu interceptor para todas las peticiones
    provideHttpClient(withInterceptors([authInterceptor]))
  ]
};