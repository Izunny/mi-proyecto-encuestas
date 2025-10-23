import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { EncuestasService } from '../../services/encuestas.service';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';
import { Encuesta } from '../../interfaces/encuesta.interface';
// --- 1. IMPORTAMOS EL COMPONENTE DE QR DE LA LIBRERÍA CORRECTA ---
import { QRCodeComponent } from 'angularx-qrcode';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  // --- 2. AÑADIMOS QRCodeComponent A LOS IMPORTS ---
  imports: [ CommonModule, FormsModule, RouterModule, QRCodeComponent ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  // --- Tus propiedades existentes ---
  surveys: Encuesta[] = [];
  filteredSurveys: Encuesta[] = [];
  selectedSurveyId: number | null = null;
  searchTerm: string = '';
  viewMode: 'user' | 'all' = 'user';
  isLoading = true;
  private userSubscription!: Subscription;
  
  // --- 3. VARIABLES PARA MANEJAR EL MODAL ---
  public isShareModalOpen = false;
  public shareUrl = '';

  constructor(
    private encuestasService: EncuestasService, 
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.userSubscription = this.authService.user$.subscribe(user => {
      if (user) { this.loadUserSurveys(); } 
      else { /* ... (tu lógica si no hay usuario) ... */ }
    });
  }

  ngOnDestroy(): void {
    if (this.userSubscription) { this.userSubscription.unsubscribe(); }
  }

  // --- 4. LÓGICA COMPLETA PARA 'shareSurvey' ---
  shareSurvey(): void {
    if (!this.selectedSurveyId) return;

    const usesInput = prompt("¿Cuántas veces se puede usar este enlace?\n(Deja en blanco o '0' para ilimitado)", "0");
    if (usesInput === null) return;

    const durationInput = prompt("¿Por cuántos días será válido este enlace?\n(Deja en blanco para 7 días)", "7");
    if (durationInput === null) return;

    const uses = parseInt(usesInput, 10);
    const maxUses = (!isNaN(uses) && uses > 0) ? uses : null;
    const days = parseInt(durationInput, 10);
    const durationDays = (!isNaN(days) && days > 0) ? days : 7;

    this.encuestasService.generateShareToken(this.selectedSurveyId, maxUses, durationDays).subscribe({
      next: (response: any) => { // Añadimos ': any'
        const token = response.token;
        this.shareUrl = `${window.location.origin}/responder/${token}`;
        this.isShareModalOpen = true;
      },
      error: (err: any) => { /* ... */ }
    });
  }

  // --- 5. FUNCIÓN PARA COPIAR LA URL ---
  copyUrlToClipboard(): void {
    navigator.clipboard.writeText(this.shareUrl).then(() => {
      alert('¡Enlace copiado al portapapeles!');
    }).catch(err => {
      console.error('Error al copiar el enlace:', err);
    });
  }
  
  loadUserSurveys(): void {
    this.isLoading = true; // 2. Ponlo en 'true' ANTES de iniciar la carga
    this.encuestasService.getSurveysByUser().subscribe({
      next: (data: any[]) => {
        this.surveys = data;
        this.filterSurveys(); 
        this.isLoading = false; // 3. ¡PONLO EN 'false' AQUÍ AL TERMINAR!
      },
      error: (err) => {
        console.error('Error al cargar las encuestas del usuario:', err);
        this.isLoading = false; // 4. Y TAMBIÉN AQUÍ, EN CASO DE ERROR
      }
    });
  }

  loadAllSurveys(): void {
    this.encuestasService.getAllSurveys().subscribe((data: any[]) => {
      this.surveys = data;
      this.filterSurveys(); 
    });
  }

  toggleView(): void {
    this.viewMode = this.viewMode === 'user' ? 'all' : 'user';
    if (this.viewMode === 'user') {
      this.loadUserSurveys();
    } else {
      this.loadAllSurveys();
    }
  }

  // --- El resto de tus métodos (filterSurveys, changeStatus, etc.) no necesitan cambios ---
  
filterSurveys(): void {
  console.log('3. [filterSurveys] Filtrando las encuestas...');
  if (!this.searchTerm) {
    this.filteredSurveys = this.surveys;
  } else {
    this.filteredSurveys = this.surveys.filter(survey =>
      survey.nombre.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }
  // ESTE ES EL MENSAJE MÁS IMPORTANTE:
  console.log('4. [filterSurveys] El arreglo final para mostrar en la tabla es:', this.filteredSurveys);
}

  changeStatus(survey: any): void {
    const nuevoEstado = survey.activo === 'S' ? 'N' : 'S';
    const surveyId = survey.idencuesta;

    this.encuestasService.updateSurveyStatus(surveyId, nuevoEstado).subscribe({
      next: () => {
        survey.activo = nuevoEstado;
      },
      error: (err: any) => {
        alert('Error al cambiar el estado: ' + err.message);
      }
    });
  }

  selectSurvey(id: number): void {
    this.selectedSurveyId = id;
  }

  deleteSelectedSurvey(): void {
    if (!this.selectedSurveyId) {
      alert('Por favor, selecciona una encuesta para eliminar.');
      return;
    }
    const surveyToDelete = this.surveys.find(s => s.idencuesta === this.selectedSurveyId);

    if (!surveyToDelete) return; 

    let confirmationMessage = '¿Estás seguro de que quieres eliminar esta encuesta?';

    if (surveyToDelete.responseCount > 0) {
      confirmationMessage = `¡ATENCIÓN! Esta encuesta ya tiene ${surveyToDelete.responseCount} respuesta(s). Si la eliminas, se borrarán permanentemente todos los resultados.\n\n¿Estás seguro de que quieres continuar?`;
    }

    if (confirm(confirmationMessage)) {
      this.encuestasService.deleteSurvey(this.selectedSurveyId).subscribe({
        next: () => {
          alert('Encuesta eliminada con éxito.');
          if (this.viewMode === 'user') {
            this.loadUserSurveys();
          } else {
            this.loadAllSurveys();
          }
          this.selectedSurveyId = null;
        },
        error: (err: any) => {
          console.error('Error al eliminar la encuesta:', err);
          alert('Error al eliminar la encuesta: ' + (err.error?.message || err.message));
        }
      });
    }
  }

  logout(): void {
    this.authService.logout();
  }
}