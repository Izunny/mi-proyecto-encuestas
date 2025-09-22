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


export const routes: Routes = [
    { path: '', component: LandingComponent }, // La página principal
    { path: 'registro', component: RegisterComponent },
    { path: 'login', component: LoginComponent },
    { path: 'dashboard', component: DashboardComponent }, // Esta será una ruta protegida más adelante
    { path: 'encuesta/agregar', component: EncuestaAgregarComponent },
    { path: 'encuesta/editar/:id', component: EncuestaEditarComponent }, // Usamos :id para pasar el ID de la encuesta
    { path: 'encuesta/responder/:id', component: EncuestaResponderComponent },
    { path: 'encuesta/resultados/:id', component: EncuestaResultadosComponent },
    { path: 'token-expirado', component: TokenExpiradoComponent },
    

    // Redirige cualquier ruta no encontrada a la página principal
    { path: '**', redirectTo: '', pathMatch: 'full' } 
];

