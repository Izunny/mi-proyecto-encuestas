import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { EncuestasService } from '../../services/encuestas.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [ CommonModule, FormsModule, RouterModule ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  surveys: any[] = [];
  filteredSurveys: any[] = [];
  selectedSurveyId: number | null = null;
  searchTerm: string = '';
  viewMode: 'user' | 'all' = 'user'; 
  currentUserId: number | null = null; 

  constructor(
    private encuestasService: EncuestasService, 
    private authService: AuthService
  ) { }


  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      // Guardamos el ID en la variable de la clase para usarlo en otros métodos
      this.currentUserId = currentUser.id;

      // LA CORRECCIÓN: Pasamos 'currentUser.id' directamente a la función.
      // Así, TypeScript sabe sin lugar a dudas que le estamos pasando un número.
      this.loadUserSurveys(currentUser.id); 
    }
  }

  logout(): void {
    this.authService.logout();
  }
  
  loadUserSurveys(userId: number): void {
    this.encuestasService.getSurveysByUser(userId).subscribe((data: any[]) => {
      this.surveys = data;
      this.filterSurveys(); 
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
    if (this.currentUserId) {
      this.loadUserSurveys(this.currentUserId);
    }
  } else {
    this.loadAllSurveys();
  }
}

  filterSurveys(): void {
    if (!this.searchTerm) {
      this.filteredSurveys = this.surveys;
    } else {
      this.filteredSurveys = this.surveys.filter(survey =>
        survey.nombre.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
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
          // CORRECCIÓN AQUÍ: Pasa el ID del usuario si es necesario
          if (this.currentUserId) {
            this.loadUserSurveys(this.currentUserId);

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
}