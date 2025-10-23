import { Routes } from '@angular/router';

// Importa todos los componentes de tus páginas
import { LandingComponent } from './pages/home/landing/landing.component';
import { RegisterComponent } from './pages/home/register/register.component';
import { LoginComponent } from './pages/home/login/login.component'; 
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { EncuestaAgregarComponent } from './pages/encuesta-agregar/encuesta-agregar.component';
import { EncuestaEditarComponent } from './pages/encuesta-editar/encuesta-editar.component';
import { EncuestaResponderComponent } from './pages/encuesta-responder/encuesta-responder.component';
import { EncuestaResultadosComponent } from './pages/encuesta-resultados/encuesta-resultados.component';
import { TokenExpiradoComponent } from './pages/token-expirado/token-expirado.component';
import { AboutusComponent } from './pages/home/aboutus/aboutus.component';
import { ComoComponent } from './pages/home/como/como.component';
import { AuthGuard } from './guard/auth.guard';
import { AuthenticatedGuard } from './guard/authenticated.guard';

export const routes: Routes = [
    // --- Rutas Públicas (para usuarios no logueados) ---
    { path: '', component: LandingComponent, canActivate: [AuthenticatedGuard]},
    { path: 'registro', component: RegisterComponent, canActivate: [AuthenticatedGuard] },
    { path: 'login', component: LoginComponent, canActivate: [AuthenticatedGuard] },
    { path: 'aboutus', component: AboutusComponent, canActivate: [AuthenticatedGuard]},
    { path: 'como', component: ComoComponent, canActivate: [AuthenticatedGuard] },

    // --- 👇👇 ESTA ES LA RUTA CORREGIDA 👇👇 ---
    // 1. La ruta ahora es 'responder/:token'
    // 2. Le hemos quitado el 'AuthGuard' para que sea pública.
    { path: 'responder/:token', component: EncuestaResponderComponent },

    // --- Rutas Privadas (requieren inicio de sesión) ---
    { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard]},
    { path: 'encuesta/agregar', component: EncuestaAgregarComponent, canActivate: [AuthGuard] },
    { path: 'encuesta/editar/:id', component: EncuestaEditarComponent, canActivate: [AuthGuard] },
    { path: 'encuesta/resultados/:id', component: EncuestaResultadosComponent, canActivate: [AuthGuard] },
    { path: 'token-expirado', component: TokenExpiradoComponent },

    // Redirige cualquier ruta no encontrada a la página principal
    { path: '**', redirectTo: '', pathMatch: 'full' } 
];