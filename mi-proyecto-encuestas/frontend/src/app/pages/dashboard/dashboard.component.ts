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
  json: any[] = [];
  viewMode: 'user' | 'all' = 'user'; 
  currentUserId: number = 0; 
  idString: string | null = "";

  constructor(private encuestasService: EncuestasService, private AuthService: AuthService) { }


  ngOnInit(): void {
    this.loadUserSurveys();
  }


  logout(): void {
    this.AuthService.logout();
  }
  
  loadUserSurveys(): void {
    this.idString = this.AuthService.getID();
    this.currentUserId = Number(this.idString) 
    console.log(this.currentUserId)
    this.encuestasService.getSurveysByUser(this.currentUserId).subscribe((data: any[]) => {
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
      this.loadUserSurveys();
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
          this.viewMode === 'user' ? this.loadUserSurveys() : this.loadAllSurveys();
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
